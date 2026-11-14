"use client";

import { ArrowLeft, Play } from "lucide-react";
import Image from "next/image";
import { LanguageSwitch, useLang } from "@/lib/i18n";
import type { Category, ScaleConfig } from "@/lib/scale";
import type { Frame } from "@/types/domain";

const answerKey = {
  UNCONVENTIONAL: "ansUnconventional",
  CONVENTIONAL: "ansConventional",
  NOT_SURE: "ansNotSure"
} as const;

/** Read-only gallery of every frame with the participant's answer. Nothing here can be changed. */
export function ReviewAnswers({
  frames,
  answers,
  ratings,
  scale,
  onBack
}: {
  frames: Frame[];
  answers: Record<string, Category>;
  ratings: Record<string, number>;
  scale: ScaleConfig;
  onBack: () => void;
}) {
  const { t, lang } = useLang();

  return (
    <main className="relative min-h-screen bg-[#050505] px-5 pb-16 pt-20 text-white sm:px-8 lg:px-12">
      <LanguageSwitch />

      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t("reviewTitle")}</h1>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          <ArrowLeft size={16} /> {t("back")}
        </button>
      </header>

      <ul className="mx-auto mt-8 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {frames.map((frame, index) => {
          const answer = answers[frame.id];
          const rating = ratings[frame.id];
          const done = Boolean(answer && rating);
          const label = done ? scale.categories[answer].labels[lang][rating - 1] : "";

          return (
            <li key={frame.id} className="overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/5">
              <div className="relative aspect-video bg-black">
                <Image
                  src={frame.frameImage}
                  alt={`${frame.movie} frame at ${frame.timecode}`}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  unoptimized={frame.frameImage.startsWith("/api/") || frame.frameImage.startsWith("data:")}
                  className="object-contain"
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs text-zinc-200">#{index + 1}</span>
                {frame.video && (
                  <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-black/70 text-white" title="Video">
                    <Play size={13} fill="currentColor" />
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="truncate font-medium">{frame.movie}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{frame.timecode}</p>

                {done ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black">{t(answerKey[answer])}</span>
                    <span className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-xs text-zinc-200">
                      <span className="grid size-6 place-items-center rounded-full bg-zinc-800 text-xs font-semibold text-white">{rating}</span>
                      {label}
                    </span>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">{t("notAnswered")}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
