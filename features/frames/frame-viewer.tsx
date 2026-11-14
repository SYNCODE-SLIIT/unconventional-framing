"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Bookmark, CircleHelp, Grid3x3, Maximize2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { LandingHero } from "@/features/landing/landing-hero";
import { FrameMedia } from "@/features/frames/frame-media";
import { ParticipantForm } from "@/features/frames/participant-form";
import { StudyTour } from "@/features/frames/study-tour";
import { ThirdsGrid } from "@/features/frames/thirds-grid";
import { LanguageSwitch, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RatingScale } from "@/features/frames/rating-scale";
import { downloadReport } from "@/features/frames/report";
import { ReviewAnswers } from "@/features/frames/review-answers";
import { ThankYou } from "@/features/frames/thank-you";
import { CATEGORIES, SCALE_POINTS, type Category, type ScaleConfig } from "@/lib/scale";
import type { Frame } from "@/types/domain";

const REFRESH_MS = 15_000;

const answerKey = {
  UNCONVENTIONAL: "ansUnconventional",
  CONVENTIONAL: "ansConventional",
  NOT_SURE: "ansNotSure"
} as const;

export function FrameViewer({ frames: initialFrames, scale: initialScale }: { frames: Frame[]; scale: ScaleConfig }) {
  const { t, lang } = useLang();
  const [stage, setStage] = useState<"landing" | "details" | "viewer" | "done" | "review">("landing");
  const [participant, setParticipant] = useState({ id: "", name: "", profession: "" });
  const [frames, setFrames] = useState(initialFrames);
  const [scale, setScale] = useState(initialScale);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Category>>({}); // step 1, per frame
  const [responses, setResponses] = useState<Record<string, number>>({}); // step 2 (saved), per frame
  const savedAnswer = useRef<Record<string, Category>>({});
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [showThirds, setShowThirds] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [toast, setToast] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const currentId = useRef<string | undefined>(undefined);
  const frame: Frame | undefined = frames[index];
  const choice: Category | null = frame ? (answers[frame.id] ?? null) : null;
  const selected: number | null = frame ? (responses[frame.id] ?? null) : null;
  const progress = useMemo(() => (frames.length ? ((index + 1) / frames.length) * 100 : 0), [frames.length, index]);

  currentId.current = frame?.id;

  useEffect(() => {
    setVisible(false);
    setShowThirds(false);
  }, [frame?.id]);

  // Open the guide the first time a participant reaches the frames.
  useEffect(() => {
    if (stage === "viewer") setTourOpen(true);
  }, [stage]);

  useEffect(() => {
    if (tourOpen) setVisible(true);
  }, [tourOpen]);

  // Keep the list in sync when an admin adds, edits or removes frames.
  useEffect(() => {
    if (stage !== "viewer") return;
    const refresh = async () => {
      try {
        const response = await fetch("/api/frames", { cache: "no-store" });
        if (!response.ok) return;
        const { frames: next, scale: nextScale } = (await response.json()) as { frames: Frame[]; scale?: ScaleConfig };
        if (nextScale) setScale((current) => (JSON.stringify(current) === JSON.stringify(nextScale) ? current : nextScale));
        setFrames((current) => {
          if (JSON.stringify(current) === JSON.stringify(next)) return current;
          const position = next.findIndex((item) => item.id === currentId.current);
          setIndex((value) => (position >= 0 ? position : Math.min(value, Math.max(0, next.length - 1))));
          return next;
        });
      } catch {
        // Offline or server hiccup: keep showing what we have.
      }
    };
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [stage]);

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex(Math.max(0, Math.min(nextIndex, frames.length - 1)));
      setShowThirds(false);
      setToast("");
    },
    [frames.length]
  );

  const chooseCategory = useCallback(
    (category: Category) => {
      if (!frame) return;
      const frameId = frame.id;
      setAnswers((current) => ({ ...current, [frameId]: category }));
      // A number only stays highlighted if it was saved together with this same first answer.
      if (savedAnswer.current[frameId] !== category) {
        setResponses((current) => {
          const next = { ...current };
          delete next[frameId];
          return next;
        });
      }
    },
    [frame]
  );

  const submitRating = useCallback(
    async (rating: number) => {
      if (!frame || !choice) return;
      const frameId = frame.id;
      const answer = choice;
      const previous = responses[frameId];
      setResponses((current) => ({ ...current, [frameId]: rating }));
      setToast(`${t("rated")} ${rating} · ${t("saved")}`);

      let saved = false;
      try {
        const response = await fetch("/api/annotation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: participant.id, frameId, answer, rating })
        });
        saved = response.ok;
      } catch {
        saved = false;
      }

      if (!saved) {
        // Put the previous choice back so the screen never claims something that was not stored.
        setResponses((current) => {
          const next = { ...current };
          if (previous) next[frameId] = previous;
          else delete next[frameId];
          return next;
        });
        setToast(t("saveFailed"));
        return;
      }

      savedAnswer.current[frameId] = answer;
      window.setTimeout(() => {
        if (index < frames.length - 1) goTo(index + 1);
        else setStage("done");
      }, 700);
    },
    [choice, frame, frames.length, goTo, index, participant.id, responses, t]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Only act in the viewer, never while the guide is open or while typing.
      if (stage !== "viewer" || tourOpen) return;
      const target = event.target as HTMLElement | null;
      if (target && (["INPUT", "TEXTAREA", "SELECT", "VIDEO"].includes(target.tagName) || target.isContentEditable)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (!visible) {
        setVisible(true);
        return;
      }

      if (event.key === "ArrowLeft") goTo(index - 1);
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === " ") {
        event.preventDefault();
        setVisible((value) => !value);
      }
      if (event.key === "Escape" && document.fullscreenElement) void document.exitFullscreen();
      const digit = Number(event.key);
      if (!Number.isInteger(digit) || digit < 1) return;
      if (!choice) {
        if (digit <= CATEGORIES.length) chooseCategory(CATEGORIES[digit - 1]);
      } else if (digit <= SCALE_POINTS) {
        void submitRating(digit);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choice, chooseCategory, goTo, index, stage, submitRating, tourOpen, visible]);

  const toggleBookmark = () => {
    if (!frame) return;
    setBookmarked((current) => {
      const next = new Set(current);
      if (next.has(frame.id)) next.delete(frame.id);
      else next.add(frame.id);
      return next;
    });
  };

  const replayFrame = () => {
    setReplayKey((value) => value + 1);
    setVisible(false);
    setShowThirds(false);
    setToast("");
  };

  const clearOverlays = () => {
    setVisible(true);
    setShowThirds(false);
  };

  if (stage === "landing") {
    return <LandingHero onBegin={() => setStage("details")} />;
  }

  if (stage === "details") {
    return (
      <ParticipantForm
        onBack={() => setStage("landing")}
        onContinue={(person) => {
          setParticipant(person);
          setStage("viewer");
        }}
      />
    );
  }

  if (stage === "review") {
    return (
      <ReviewAnswers
        frames={frames}
        answers={savedAnswer.current}
        ratings={responses}
        scale={scale}
        onBack={() => setStage("done")}
      />
    );
  }

  if (stage === "done") {
    return (
      <ThankYou
        onReview={() => setStage("review")}
        onDownload={() =>
          downloadReport({
            participant,
            frames,
            answers: savedAnswer.current,
            ratings: responses,
            scale
          })
        }
      />
    );
  }

  if (!frame) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-semibold">{t("noFrames")}</h1>
          <p className="mt-2 text-sm text-zinc-400">{t("noFramesHint")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white" onClick={clearOverlays}>
      <motion.div
        key={`${frame.id}-${replayKey}`}
        initial={{ opacity: 0, scale: 1.01 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex items-center justify-center px-3 pb-72 pt-24 sm:px-8 sm:pb-72 sm:pt-28"
      >
        <div className="relative flex h-[min(46dvh,calc(100dvh-24rem))] w-full max-w-[min(94vw,1500px)] items-center justify-center [container-type:size] sm:h-[min(56dvh,calc(100dvh-25rem))] lg:max-w-[min(78vw,1600px)]">
          {/* Every frame is shown in a 16:9 box, and the thirds grid lives in that same box. */}
          <div
            data-tour="frame"
            className="relative shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
            style={{ aspectRatio: "16 / 9", width: "min(100cqw, calc(100cqh * 16 / 9))" }}
          >
            <FrameMedia frame={frame} priority />
            {showThirds && <ThirdsGrid />}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {visible && (
          <>
            <motion.section
              data-tour="info"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none absolute left-4 right-4 top-5 z-40 grid grid-cols-1 gap-3 sm:left-8 sm:right-8 sm:grid-cols-[minmax(180px,1fr)_minmax(180px,360px)_minmax(320px,1fr)] sm:items-start sm:gap-6"
            >
              <div>
                <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">{frame.movie}</h1>
                <p className="mt-1 text-sm text-zinc-300">{t("timecode")} : {frame.timecode}</p>
              </div>
              <div className="hidden text-center sm:block">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
                  {t("frame")} {index + 1} / {frames.length}
                </p>
                <Progress value={progress} className="mx-auto mt-3 max-w-72" />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm sm:justify-end sm:text-right">
                <p className="text-zinc-300">
                  {t("director")} <span className="font-medium text-white">{frame.director}</span>
                </p>
                <p className="text-zinc-300">
                  {t("dop")} <span className="font-medium text-white">{frame.dop}</span>
                </p>
              </div>
            </motion.section>

            <div
              className="pointer-events-none absolute bottom-72 top-28 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-8"
              onClick={(event) => event.stopPropagation()}
            >
              <IconButton
                label={t("prevFrame")}
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                className="pointer-events-auto"
              >
                <ArrowLeft size={20} />
              </IconButton>
              <IconButton
                data-tour="next"
                label={t("nextFrame")}
                onClick={() => goTo(index + 1)}
                disabled={index === frames.length - 1}
                className="pointer-events-auto"
              >
                <ArrowRight size={20} />
              </IconButton>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-5 pt-8 sm:px-8 sm:pb-6"
              onClick={(event) => event.stopPropagation()}
            >
              {/* The three buttons never move. The numbers appear just above them, between the buttons and the picture. */}
              <div data-tour="answers" className="mx-auto w-full max-w-3xl space-y-2">
                {choice && (
                  <motion.div
                    key={choice}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <RatingScale
                      labels={scale.categories[choice].labels[lang]}
                      selected={selected}
                      onSelect={(rating) => void submitRating(rating)}
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/50 p-2 backdrop-blur-xl sm:gap-3">
                  {CATEGORIES.map((category) => {
                    const active = choice === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={active}
                        onClick={() => chooseCategory(category)}
                        className={cn(
                          "flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-[13px] font-medium transition sm:text-base",
                          active
                            ? "border-white bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                            : "border-white/20 bg-white/5 text-white hover:border-white hover:bg-white/10"
                        )}
                      >
                        <span aria-hidden className="size-3.5 shrink-0 rounded-full border-2 border-current" />
                        <span className="truncate">{t(answerKey[category])}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex w-full items-center justify-between gap-3">
                <div className="flex gap-2">
                  <IconButton label={t("saveFrame")} onClick={toggleBookmark}>
                    <Bookmark size={16} fill={bookmarked.has(frame.id) ? "#ffffff" : "transparent"} />
                  </IconButton>
                  <IconButton label={t("replayFrame")} onClick={replayFrame}>
                    <RotateCcw size={16} />
                  </IconButton>
                </div>

                <div data-tour="tools" className="flex items-center gap-2">
                  <LanguageSwitch inline />
                  <IconButton label={t("showGuide")} onClick={() => setTourOpen(true)}>
                    <CircleHelp size={16} />
                  </IconButton>
                  <IconButton
                    label={t("thirds")}
                    onClick={() => setShowThirds((value) => !value)}
                    className={showThirds ? "border border-white/70 text-zinc-300" : undefined}
                  >
                    <Grid3x3 size={16} />
                  </IconButton>
                  <IconButton label={t("fullscreen")} onClick={() => void document.documentElement.requestFullscreen()}>
                    <Maximize2 size={16} />
                  </IconButton>
                </div>
              </div>
            </motion.div>

            <div className="absolute left-4 top-4 z-20 sm:hidden">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">
                {index + 1} / {frames.length}
              </p>
              <Progress value={progress} className="mt-2 w-28" />
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute bottom-[19rem] left-1/2 z-30 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-2xl"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {tourOpen && <StudyTour onClose={() => setTourOpen(false)} />}
    </main>
  );
}

function IconButton({
  label,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "grid size-10 place-items-center rounded-full bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-35",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
