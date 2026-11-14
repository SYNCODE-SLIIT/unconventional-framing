/** The 1-5 rating scale shown under every frame. The admin can rename every label. */
export const SCALE_POINTS = 5;

export type ScaleConfig = {
  question: { en: string; si: string };
  labels: { en: string[]; si: string[] };
};

export const defaultScale: ScaleConfig = {
  question: {
    en: "How unconventional is this frame?",
    si: "මෙම රාමුව කොතරම් අසාම්ප්‍රදායිකද?"
  },
  labels: {
    en: ["Very conventional", "Conventional", "Neutral", "Unconventional", "Very unconventional"],
    si: ["ඉතා සාම්ප්‍රදායික", "සාම්ප්‍රදායික", "මධ්‍යස්ථ", "අසාම්ප්‍රදායික", "ඉතා අසාම්ප්‍රදායික"]
  }
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function labels(value: unknown, fallback: string[]) {
  const list = Array.isArray(value) ? value : [];
  return Array.from({ length: SCALE_POINTS }, (_, index) => text(list[index], fallback[index]));
}

/** Turns whatever is stored (or nothing) into a complete, valid scale. */
export function normalizeScale(input: unknown): ScaleConfig {
  const raw = (input && typeof input === "object" ? input : {}) as Partial<{
    question: Partial<ScaleConfig["question"]>;
    labels: Partial<ScaleConfig["labels"]>;
  }>;

  return {
    question: {
      en: text(raw.question?.en, defaultScale.question.en),
      si: text(raw.question?.si, defaultScale.question.si)
    },
    labels: {
      en: labels(raw.labels?.en, defaultScale.labels.en),
      si: labels(raw.labels?.si, defaultScale.labels.si)
    }
  };
}
