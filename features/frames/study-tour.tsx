"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

type Step = { target: string; title: string; body: string };

const steps: Step[] = [
  {
    target: '[data-tour="frame"]',
    title: "This is the frame",
    body: "Look at the picture first, in full. Click anywhere or press any key to show or hide the movie details."
  },
  {
    target: '[data-tour="info"]',
    title: "Movie details",
    body: "The film, timecode, director and cinematographer appear here, along with your progress through the frames."
  },
  {
    target: '[data-tour="answers"]',
    title: "Give your answer",
    body: "Choose Unconventional, Conventional or Not Sure. Shortcut keys: 1, 2 and 3. Your answer is saved and the next frame opens."
  },
  {
    target: '[data-tour="next"]',
    title: "Move between frames",
    body: "Use the arrows, or the left and right arrow keys, to go back or skip ahead."
  },
  {
    target: '[data-tour="tools"]',
    title: "Helpful tools",
    body: "Show a rule-of-thirds grid, go fullscreen, or reopen this guide any time with the ? button."
  }
];

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const CARD_W = 320;

export function StudyTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const current = steps[step];
  const last = step === steps.length - 1;

  const measure = useCallback(() => {
    const el = document.querySelector(current.target);
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    if (!el) {
      setRect(null);
      return;
    }
    const box = el.getBoundingClientRect();
    setRect({ top: box.top - PAD, left: box.left - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 });
  }, [current.target]);

  useLayoutEffect(() => {
    measure();
    // Overlays fade in, so measure again once they have settled.
    const timer = window.setTimeout(measure, 900);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" || event.key === "Enter") (last ? onClose : () => setStep((s) => s + 1))();
      if (event.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      event.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [last, onClose]);

  // Card sits below the highlighted area when there is room, otherwise above it.
  const cardStyle = (() => {
    if (!rect || !viewport.w) return { left: "50%", top: "50%", transform: "translate(-50%,-50%)" } as const;
    const below = viewport.h - (rect.top + rect.height);
    const placeBelow = below > 210 || below > rect.top;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - CARD_W / 2), viewport.w - CARD_W - 12);
    return placeBelow
      ? ({ left, top: Math.min(rect.top + rect.height + 14, viewport.h - 200) } as const)
      : ({ left, top: Math.max(12, rect.top - 14), transform: "translateY(-100%)" } as const);
  })();

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Study guide"
      onClick={(event) => event.stopPropagation()}
    >
      {rect ? (
        <motion.div
          layout={false}
          animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="pointer-events-none absolute rounded-xl border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.78)]"
        />
      ) : (
        <div className="absolute inset-0 bg-black/78" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ ...cardStyle, width: CARD_W, maxWidth: "calc(100vw - 24px)" }}
          className="absolute rounded-xl border border-white/15 bg-zinc-950 p-5 text-white shadow-2xl"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="mt-2 text-lg font-semibold">{current.title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{current.body}</p>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-zinc-500 transition hover:text-white"
            >
              Skip
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="h-9 rounded-full border border-white/15 px-4 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => (last ? onClose() : setStep((s) => s + 1))}
                className="h-9 rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                {last ? "Start rating" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
