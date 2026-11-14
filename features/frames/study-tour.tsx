"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useLang, type Key } from "@/lib/i18n";

type Step = { target: string; title: Key; body: Key };

const steps: Step[] = [
  { target: '[data-tour="frame"]', title: "tour1Title", body: "tour1Body" },
  { target: '[data-tour="info"]', title: "tour2Title", body: "tour2Body" },
  { target: '[data-tour="answers"]', title: "tour3Title", body: "tour3Body" },
  { target: '[data-tour="next"]', title: "tour4Title", body: "tour4Body" },
  { target: '[data-tour="tools"]', title: "tour5Title", body: "tour5Body" }
];

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const CARD_W = 320;

export function StudyTour({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
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
  // (Positioned with top/bottom rather than a CSS transform, because the entrance animation owns `transform`.)
  const cardStyle = (() => {
    const cardWidth = Math.min(CARD_W, Math.max(0, viewport.w - 24));
    if (!rect || !viewport.w) return { left: Math.max(12, (viewport.w - cardWidth) / 2), top: Math.max(12, viewport.h / 2 - 110) };
    const below = viewport.h - (rect.top + rect.height);
    const placeBelow = below > 220 || below > rect.top;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - cardWidth / 2), viewport.w - cardWidth - 12);
    return placeBelow
      ? { left, top: Math.min(rect.top + rect.height + 14, viewport.h - 230) }
      : { left, bottom: Math.max(12, viewport.h - rect.top + 14) };
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
            {t("tourStep")} {step + 1} {t("tourOf")} {steps.length}
          </p>
          <h2 className="mt-2 text-lg font-semibold">{t(current.title)}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{t(current.body)}</p>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-zinc-500 transition hover:text-white"
            >
              {t("skip")}
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="h-9 rounded-full border border-white/15 px-4 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  {t("back")}
                </button>
              )}
              <button
                type="button"
                onClick={() => (last ? onClose() : setStep((s) => s + 1))}
                className="h-9 rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                {last ? t("startRating") : t("next")}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
