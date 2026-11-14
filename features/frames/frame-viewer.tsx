"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Bookmark, CircleHelp, Grid3x3, Maximize2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LandingHero } from "@/features/landing/landing-hero";
import { ParticipantForm } from "@/features/frames/participant-form";
import { StudyTour } from "@/features/frames/study-tour";
import { useLang, type Key } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AnnotationAnswer, Frame } from "@/types/domain";

const answers: Array<{ value: AnnotationAnswer; label: Key }> = [
  { value: "UNCONVENTIONAL", label: "ansUnconventional" },
  { value: "CONVENTIONAL", label: "ansConventional" },
  { value: "NOT_SURE", label: "ansNotSure" }
];

const answerKey: Record<AnnotationAnswer, Key> = {
  UNCONVENTIONAL: "ansUnconventional",
  CONVENTIONAL: "ansConventional",
  NOT_SURE: "ansNotSure"
};

const REFRESH_MS = 15_000;

export function FrameViewer({ frames: initialFrames }: { frames: Frame[] }) {
  const { t } = useLang();
  const [stage, setStage] = useState<"landing" | "details" | "viewer">("landing");
  const [participantId, setParticipantId] = useState("");
  const [frames, setFrames] = useState(initialFrames);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<AnnotationAnswer | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [showThirds, setShowThirds] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [toast, setToast] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const currentId = useRef<string | undefined>(undefined);
  const frame: Frame | undefined = frames[index];
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
        const { frames: next } = (await response.json()) as { frames: Frame[] };
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
      setSelected(null);
      setShowThirds(false);
      setToast("");
    },
    [frames.length]
  );

  const submitAnswer = useCallback(
    async (answer = selected) => {
      if (!answer || !frame) return;
      setSelected(answer);
      setToast(`${t(answerKey[answer])} ${t("saved")}`);

      await fetch("/api/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, frameId: frame.id, answer })
      });

      window.setTimeout(() => {
        if (index < frames.length - 1) goTo(index + 1);
      }, 700);
    },
    [frame, frames.length, goTo, index, participantId, selected, t]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Only act in the viewer, never while the guide is open or while typing.
      if (stage !== "viewer" || tourOpen) return;
      const target = event.target as HTMLElement | null;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
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
      if (event.key === "Enter") void submitAnswer();
      if (event.key === "Escape" && document.fullscreenElement) void document.exitFullscreen();
      if (event.key === "1") void submitAnswer("UNCONVENTIONAL");
      if (event.key === "2") void submitAnswer("CONVENTIONAL");
      if (event.key === "3") void submitAnswer("NOT_SURE");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, index, stage, submitAnswer, tourOpen, visible]);

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
        onContinue={(id) => {
          setParticipantId(id);
          setStage("viewer");
        }}
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
        className="absolute inset-0 flex items-center justify-center px-3 pb-28 pt-24 sm:px-8 sm:pb-28 sm:pt-28"
      >
        <div
          data-tour="frame"
          className="relative flex h-[min(62dvh,calc(100dvh-14rem))] w-full max-w-[min(94vw,1500px)] items-center justify-center sm:h-[min(70dvh,calc(100dvh-15rem))] lg:max-w-[min(78vw,1600px)]"
        >
          <Image
            priority
            unoptimized={frame.frameImage.startsWith("/api/") || frame.frameImage.startsWith("data:")}
            src={frame.frameImage}
            alt={`${frame.movie} frame at ${frame.timecode}`}
            width={1800}
            height={1013}
            className="h-full w-full object-contain shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
            sizes="100vw"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {showThirds && <RuleOfThirdsOverlay />}
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
              className="pointer-events-none absolute inset-y-28 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-8"
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
              <div className="grid w-full grid-cols-[92px_minmax(0,1fr)_140px] items-center gap-3">
                <div className="flex justify-self-start gap-2">
                  <IconButton label={t("saveFrame")} onClick={toggleBookmark}>
                    <Bookmark
                      size={16}
                      fill={bookmarked.has(frame.id) ? "#ffffff" : "transparent"}
                    />
                  </IconButton>
                  <IconButton label={t("replayFrame")} onClick={replayFrame}>
                    <RotateCcw size={16} />
                  </IconButton>
                </div>

                <div
                  data-tour="answers"
                  className="mx-auto flex max-w-full justify-center gap-2 rounded-full bg-black/45 p-2 backdrop-blur-xl sm:gap-3"
                >
                  {answers.map((answer) => (
                    <Button
                      key={answer.value}
                      variant="outline"
                      aria-pressed={selected === answer.value}
                      onClick={() => void submitAnswer(answer.value)}
                      className={cn(
                        "min-h-10 min-w-0 border-white/15 bg-white/5 px-4 text-[13px] sm:px-5 sm:text-sm",
                        selected === answer.value &&
                          "border-white bg-white text-black shadow-[0_0_36px_rgba(255,255,255,0.35)]"
                      )}
                    >
                      <span aria-hidden className="size-3.5 shrink-0 rounded-full border-2 border-current" />
                      <span className="truncate">{t(answer.label)}</span>
                    </Button>
                  ))}
                </div>

                <div data-tour="tools" className="flex justify-self-end gap-2">
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
                  <IconButton
                    label={t("fullscreen")}
                    onClick={() => void document.documentElement.requestFullscreen()}
                  >
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
            className="absolute bottom-28 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-2xl sm:bottom-32"
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

function RuleOfThirdsOverlay() {
  return (
    <svg aria-hidden viewBox="0 0 3 3" preserveAspectRatio="none" className="h-full w-full opacity-80">
      <path d="M1 0V3 M2 0V3 M0 1H3 M0 2H3" stroke="rgba(255,80,70,0.9)" strokeWidth="0.01" />
      <path d="M0.92 1H1.08 M1 0.92V1.08 M1.92 1H2.08 M2 0.92V1.08 M0.92 2H1.08 M1 1.92V2.08 M1.92 2H2.08 M2 1.92V2.08" stroke="rgba(255,80,70,0.95)" strokeWidth="0.015" />
    </svg>
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
