/**
 * Every frame is answered in two steps: first a category (unconventional / conventional / not sure),
 * then a 1-5 number. The question and the words under each number can differ per category,
 * and the admin can edit all of them.
 */
export const SCALE_POINTS = 5;

export const CATEGORIES = ["UNCONVENTIONAL", "CONVENTIONAL", "NOT_SURE"] as const;
export type Category = (typeof CATEGORIES)[number];

export type CategoryScale = {
  question: { en: string; si: string };
  labels: { en: string[]; si: string[] };
};

export type ScaleConfig = { categories: Record<Category, CategoryScale> };

const placeholder = (): CategoryScale => ({
  question: { en: "Choose a number", si: "අංකයක් තෝරන්න" },
  labels: {
    en: Array.from({ length: SCALE_POINTS }, () => "test"),
    si: Array.from({ length: SCALE_POINTS }, () => "test")
  }
});

export const defaultScale: ScaleConfig = {
  categories: { UNCONVENTIONAL: placeholder(), CONVENTIONAL: placeholder(), NOT_SURE: placeholder() }
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function labels(value: unknown, fallback: string[]) {
  const list = Array.isArray(value) ? value : [];
  return Array.from({ length: SCALE_POINTS }, (_, index) => text(list[index], fallback[index]));
}

function category(input: unknown, fallback: CategoryScale): CategoryScale {
  const raw = (input && typeof input === "object" ? input : {}) as Partial<{
    question: Partial<CategoryScale["question"]>;
    labels: Partial<CategoryScale["labels"]>;
  }>;
  return {
    question: { en: text(raw.question?.en, fallback.question.en), si: text(raw.question?.si, fallback.question.si) },
    labels: { en: labels(raw.labels?.en, fallback.labels.en), si: labels(raw.labels?.si, fallback.labels.si) }
  };
}

/** Turns whatever is stored (or nothing) into a complete, valid scale. Also accepts the older single-scale shape. */
export function normalizeScale(input: unknown): ScaleConfig {
  const raw = (input && typeof input === "object" ? input : {}) as {
    categories?: Partial<Record<Category, unknown>>;
    question?: unknown;
    labels?: unknown;
  };

  // Older saves had one scale for everything; use it for all three categories.
  const legacy = raw.categories ? undefined : { question: raw.question, labels: raw.labels };

  return {
    categories: {
      UNCONVENTIONAL: category(raw.categories?.UNCONVENTIONAL ?? legacy, defaultScale.categories.UNCONVENTIONAL),
      CONVENTIONAL: category(raw.categories?.CONVENTIONAL ?? legacy, defaultScale.categories.CONVENTIONAL),
      NOT_SURE: category(raw.categories?.NOT_SURE ?? legacy, defaultScale.categories.NOT_SURE)
    }
  };
}
