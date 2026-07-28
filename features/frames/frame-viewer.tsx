"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Bookmark, Camera, Check, ChevronDown, ChevronRight, Grid3x3, ImagePlus, Maximize2, Ratio, RotateCcw, UserRound, Video, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { answerLabel, cn } from "@/lib/utils";
import type { AnnotationAnswer, Frame } from "@/types/domain";

const answers: Array<{ value: AnnotationAnswer; label: string }> = [
  { value: "UNCONVENTIONAL", label: "Unconventional" },
  { value: "CONVENTIONAL", label: "Conventional" },
  { value: "NOT_SURE", label: "Not Sure" }
];

const goldenTransforms = ["", "scale-x-[-1]", "scale-y-[-1]", "rotate-180"];

const participantRoles = [
  "Film Director",
  "Cinematographer",
  "Film Editor",
  "Film Critic",
  "Film Academic / Lecturer",
  "Film Student"
];

export function FrameViewer({ frames }: { frames: Frame[] }) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<AnnotationAnswer | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [goldenMode, setGoldenMode] = useState<number | null>(null);
  const [showThirds, setShowThirds] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [toast, setToast] = useState("");
  const frame = frames[index];
  const progress = useMemo(() => ((index + 1) / frames.length) * 100, [frames.length, index]);

  useEffect(() => {
    setVisible(false);
    setGoldenMode(null);
    setShowThirds(false);
  }, [frame.id]);

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex(Math.max(0, Math.min(nextIndex, frames.length - 1)));
      setSelected(null);
      setGoldenMode(null);
      setShowThirds(false);
      setToast("");
    },
    [frames.length]
  );

  const submitAnswer = useCallback(
    async (answer = selected) => {
      if (!answer) return;
      setSelected(answer);
      setToast(`${answerLabel(answer)} saved`);

      await fetch("/api/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameId: frame.id, answer })
      });

      window.setTimeout(() => {
        if (index < frames.length - 1) goTo(index + 1);
      }, 700);
    },
    [frame.id, frames.length, goTo, index, selected]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
  }, [goTo, index, submitAnswer, visible]);

  const toggleBookmark = () => {
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
    setGoldenMode(null);
    setShowThirds(false);
    setToast("");
  };

  const cycleGoldenRatio = () => {
    setShowThirds(false);
    setGoldenMode((current) => (current === null ? 0 : (current + 1) % goldenTransforms.length));
  };

  const toggleThirds = () => {
    setGoldenMode(null);
    setShowThirds((value) => !value);
  };

  const clearOverlays = () => {
    setVisible(true);
    setGoldenMode(null);
    setShowThirds(false);
  };

  if (!started) {
    return <LandingIntro onContinue={() => setStarted(true)} />;
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
        <div className="relative flex h-[min(62dvh,calc(100dvh-14rem))] w-full max-w-[min(94vw,1500px)] items-center justify-center sm:h-[min(70dvh,calc(100dvh-15rem))] lg:max-w-[min(78vw,1600px)]">
          <Image
            priority
            src={frame.frameImage}
            alt={`${frame.movie} frame at ${frame.timecode}`}
            width={1800}
            height={1013}
            className="h-full w-full object-contain shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
            sizes="100vw"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {goldenMode !== null && <GoldenRatioOverlay transformClass={goldenTransforms[goldenMode]} />}
            {showThirds && <RuleOfThirdsOverlay />}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {visible && (
          <>
            <motion.section
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none absolute left-4 right-4 top-5 z-40 grid grid-cols-1 gap-3 sm:left-8 sm:right-8 sm:grid-cols-[minmax(180px,1fr)_minmax(180px,360px)_minmax(320px,1fr)] sm:items-start sm:gap-6"
            >
              <div>
                <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">{frame.movie}</h1>
                <p className="mt-1 text-sm text-zinc-300">timecode : {frame.timecode}</p>
              </div>
              <div className="hidden text-center sm:block">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
                  Frame {index + 1} / {frames.length}
                </p>
                <Progress value={progress} className="mx-auto mt-3 max-w-72" />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm sm:justify-end sm:text-right">
                <p className="text-zinc-300">
                  Director <span className="font-medium text-white">{frame.director}</span>
                </p>
                <p className="text-zinc-300">
                  DOP <span className="font-medium text-white">{frame.dop}</span>
                </p>
              </div>
            </motion.section>

            <div
              className="pointer-events-none absolute inset-y-28 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-8"
              onClick={(event) => event.stopPropagation()}
            >
              <IconButton
                label="Previous frame"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                className="pointer-events-auto"
              >
                <ArrowLeft size={20} />
              </IconButton>
              <IconButton
                label="Next frame"
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
                  <IconButton label="Save frame" onClick={toggleBookmark}>
                    <Bookmark
                      size={16}
                      fill={bookmarked.has(frame.id) ? "#C5A46D" : "transparent"}
                    />
                  </IconButton>
                  <IconButton label="Replay frame" onClick={replayFrame}>
                    <RotateCcw size={16} />
                  </IconButton>
                </div>

                <div className="mx-auto flex max-w-full justify-center gap-2 rounded-full bg-black/45 p-2 backdrop-blur-xl sm:gap-3">
                  {answers.map((answer) => (
                    <Button
                      key={answer.value}
                      variant="outline"
                      aria-pressed={selected === answer.value}
                      onClick={() => void submitAnswer(answer.value)}
                      className={cn(
                        "min-h-10 min-w-0 border-white/15 bg-white/5 px-4 text-[13px] sm:px-5 sm:text-sm",
                        selected === answer.value &&
                          "border-[#C5A46D] bg-[#C5A46D] text-black shadow-[0_0_36px_rgba(197,164,109,0.35)]"
                      )}
                    >
                      <span aria-hidden className="size-3.5 shrink-0 rounded-full border-2 border-current" />
                      <span className="truncate">{answer.label}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex justify-self-end gap-2">
                  <IconButton
                    label="Golden ratio overlay"
                    onClick={cycleGoldenRatio}
                    className={goldenMode !== null ? "border border-[#C5A46D]/70 text-[#C5A46D]" : undefined}
                  >
                    <Ratio size={16} />
                  </IconButton>
                  <IconButton
                    label="Rule of thirds overlay"
                    onClick={toggleThirds}
                    className={showThirds ? "border border-[#C5A46D]/70 text-[#C5A46D]" : undefined}
                  >
                    <Grid3x3 size={16} />
                  </IconButton>
                  <IconButton
                    label="Fullscreen"
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
    </main>
  );
}

function LandingIntro({ onContinue }: { onContinue: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const showContinue = role.length > 0;
  const canContinue = name.trim().length > 0 && role.length > 0;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    setShowPhotoOptions(false);
  };

  const openLiveCamera = async () => {
    setShowPhotoOptions(false);
    setCameraError("");
    setCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera access is blocked or unavailable.");
    }
  };

  const closeLiveCamera = () => {
    stopCamera();
    setCameraOpen(false);
  };

  const captureLivePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setAvatar(canvas.toDataURL("image/jpeg", 0.92));
    closeLiveCamera();
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#050505] px-5 py-10 text-white sm:px-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <div className="max-w-4xl pt-2 sm:pt-6">
          <h1 className="text-balance text-2xl font-semibold leading-tight text-zinc-300 sm:text-3xl">
            A Visual Study on<br className="hidden sm:block" /> Unconventional Cinematography
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-pretty text-sm leading-6 text-zinc-400 sm:text-base">
            Welcome to a specialized study on the visual language of contemporary cinema. We are investigating how unconventional spatial arrangements affect viewer perception and emotional response.
          </p>
        </div>

        <div className="mt-12 flex w-full max-w-sm flex-col items-center sm:mt-14">
          <div className="relative size-36 rounded-full bg-zinc-900 shadow-[0_24px_70px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:size-40">
            {avatar ? (
              <div
                className="size-full rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${avatar})` }}
              />
            ) : (
              <div className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_50%_28%,#565656,#1d1d1d_62%,#101010)] text-zinc-300">
                <UserRound size={70} strokeWidth={1.35} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowPhotoOptions((value) => !value)}
              className="absolute bottom-1 right-2 grid size-9 place-items-center rounded-full border border-white/25 bg-black/80 text-white transition hover:border-[#C5A46D]/70 hover:text-[#C5A46D]"
              aria-label="Change profile photo"
              title="Change profile photo"
            >
              <Camera size={18} />
            </button>
            {showPhotoOptions && (
              <div className="absolute left-1/2 top-[calc(100%+12px)] z-20 w-48 -translate-x-1/2 overflow-hidden rounded-md border border-white/10 bg-zinc-950/95 p-1 text-left shadow-2xl backdrop-blur">
                <button
                  type="button"
                  onClick={openLiveCamera}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  <Video size={16} /> Live camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  <ImagePlus size={16} /> Browse image
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              id="participant-photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="mt-12 flex w-full flex-col gap-3 text-left">
            <input
              id="participant-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 min-w-0 rounded-md border border-white/10 bg-[#d7d7d7] px-4 text-base text-zinc-950 outline-none transition placeholder:text-zinc-500 focus:border-[#C5A46D]/70 focus:bg-[#e4e4e4]"
              placeholder="Type your name"
              autoComplete="name"
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoles((value) => !value)}
                className="flex h-11 w-full items-center justify-between rounded-md border border-white/10 bg-white px-4 text-left text-base text-zinc-900 outline-none transition hover:border-[#C5A46D]/60"
              >
                <span className={role ? "text-zinc-900" : "text-zinc-500"}>{role || "Choose your role"}</span>
                <ChevronDown size={18} className={cn("transition", showRoles && "rotate-180")} />
              </button>
              {showRoles && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 overflow-hidden rounded-md border border-white/10 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur">
                  {participantRoles.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setRole(item);
                        setShowRoles(false);
                      }}
                      className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-white/10"
                    >
                      {item}
                      {role === item && <Check size={15} className="text-[#C5A46D]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showContinue && (
        <button
          type="button"
          aria-label="Continue"
          title="Continue"
          disabled={!canContinue}
          onClick={onContinue}
          className="absolute bottom-6 right-6 grid size-12 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-[#C5A46D]/70 hover:bg-[#C5A46D] hover:text-black disabled:pointer-events-none disabled:opacity-35 sm:bottom-8 sm:right-8"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-200">Live camera</p>
              <button
                type="button"
                onClick={closeLiveCamera}
                className="grid size-9 place-items-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Close camera"
                title="Close camera"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-zinc-900">
              {cameraError ? (
                <div className="grid size-full place-items-center px-6 text-center text-sm text-zinc-300">
                  {cameraError}
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeLiveCamera}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureLivePhoto}
                disabled={Boolean(cameraError)}
                className="rounded-md bg-[#C5A46D] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#d4b57d] disabled:pointer-events-none disabled:opacity-40"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function GoldenRatioOverlay({ transformClass }: { transformClass: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 562.5"
      preserveAspectRatio="none"
      className={cn("h-full w-full opacity-75", transformClass)}
    >
      <rect x="1" y="1" width="998" height="560.5" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.82)" strokeWidth="2" />
      <path
        d="M618 1V562 M618 347H999 M854 347V562 M618 347A381 381 0 0 1 999 562 M618 1A618 618 0 0 1 999 347 M618 347A236 236 0 0 1 854 562 M854 347A145 145 0 0 1 999 492 M854 492H999 M944 492V562 M854 492A90 90 0 0 1 944 562"
        fill="none"
        stroke="rgba(255,255,255,0.86)"
        strokeWidth="2.2"
      />
    </svg>
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

