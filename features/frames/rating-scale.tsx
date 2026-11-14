"use client";

import { cn } from "@/lib/utils";

/**
 * 1-5 scale with a caption under every number.
 * Used by participants (to answer) and in the admin preview.
 */
export function RatingScale({
  question,
  labels,
  selected,
  onSelect,
  className,
  tourId
}: {
  /** Optional heading above the numbers; when left out only the numbers and their words show. */
  question?: string;
  labels: string[];
  selected: number | null;
  onSelect?: (rating: number) => void;
  className?: string;
  tourId?: string;
}) {
  return (
    <div
      data-tour={tourId}
      className={cn("mx-auto w-full max-w-3xl rounded-2xl bg-black/50 px-3 pb-3 pt-3 backdrop-blur-xl sm:px-6", className)}
    >
      {question && <p className="mb-3 text-center text-xs font-medium text-zinc-200 sm:text-sm">{question}</p>}

      <div className="relative">
        {/* the line that links the numbers into a scale */}
        <span aria-hidden className="absolute left-[10%] right-[10%] top-5 h-px bg-white/20" />
        <div role="radiogroup" aria-label={question ?? "Rating"} className="relative grid grid-cols-5 gap-1 sm:gap-3">
          {labels.map((label, index) => {
            const rating = index + 1;
            const active = selected === rating;
            return (
              <button
                key={rating}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!onSelect}
                onClick={() => onSelect?.(rating)}
                className="group flex min-w-0 flex-col items-center gap-2 text-center disabled:cursor-default"
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-full border text-base font-semibold transition",
                    active
                      ? "border-white bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.35)]"
                      : "border-white/25 bg-zinc-900 text-white group-hover:border-white group-hover:bg-zinc-800"
                  )}
                >
                  {rating}
                </span>
                <span
                  className={cn(
                    "line-clamp-2 text-[10px] leading-tight transition sm:text-xs",
                    active ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
