"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RatingScale } from "@/features/frames/rating-scale";
import { CATEGORIES, defaultScale, type Category, type ScaleConfig } from "@/lib/scale";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-lg border border-white/15 bg-zinc-900 px-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/20";

const categoryNames: Record<Category, string> = {
  UNCONVENTIONAL: "Unconventional",
  CONVENTIONAL: "Conventional",
  NOT_SURE: "Not sure"
};

export function ScaleEditor({ initial, editable }: { initial: ScaleConfig; editable: boolean }) {
  const router = useRouter();
  const [scale, setScale] = useState(initial);
  const [category, setCategory] = useState<Category>("UNCONVENTIONAL");
  const [previewLang, setPreviewLang] = useState<"en" | "si">("en");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const current = scale.categories[category];

  const update = (change: (value: ScaleConfig["categories"][Category]) => ScaleConfig["categories"][Category]) =>
    setScale((state) => ({ categories: { ...state.categories, [category]: change(state.categories[category]) } }));

  const setQuestion = (lang: "en" | "si", value: string) => update((c) => ({ ...c, question: { ...c.question, [lang]: value } }));

  const setLabel = (lang: "en" | "si", index: number, value: string) =>
    update((c) => ({ ...c, labels: { ...c.labels, [lang]: c.labels[lang].map((item, i) => (i === index ? value : item)) } }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/scale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scale)
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Please sign in again." : "Could not save. Every field needs some text.");
      setMessage({ ok: true, text: "Saved. Participants will see the new text within a few seconds." });
      router.refresh();
    } catch (caught) {
      setMessage({ ok: false, text: caught instanceof Error ? caught.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 py-6 text-white sm:px-8 lg:px-12">
      <header className="border-b border-white/10 pb-6">
        <p className="text-sm uppercase tracking-[0.22em] text-zinc-300">Content</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Rating scale</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Participants first choose Unconventional, Conventional or Not sure, then a number from 1 to 5. Pick a first answer below to edit
          the question and the words under each number that follow it, in English and Sinhala.
        </p>
      </header>

      {!editable && (
        <p className="mt-6 rounded-lg border border-white/10 bg-zinc-900 p-4 text-sm text-zinc-300">
          The database isn&apos;t connected, so the scale is read-only.
        </p>
      )}

      <div role="tablist" aria-label="First answer" className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={category === key}
            onClick={() => setCategory(key)}
            className={cn(
              "h-10 rounded-full border px-5 text-sm transition",
              category === key ? "border-white bg-white text-black" : "border-white/15 text-zinc-300 hover:border-white/40 hover:text-white"
            )}
          >
            After &ldquo;{categoryNames[key]}&rdquo;
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={save} className="space-y-6">
          <fieldset disabled={!editable || busy} className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-zinc-300">Question (English)</span>
                <input required className={inputClass} value={current.question.en} onChange={(e) => setQuestion("en", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-zinc-300">Question (සිංහල)</span>
                <input required className={inputClass} value={current.question.si} onChange={(e) => setQuestion("si", e.target.value)} />
              </label>
            </div>

            <div>
              <div className="mb-2 grid grid-cols-[2.25rem_1fr_1fr] gap-3 text-sm text-zinc-300">
                <span />
                <span>Text under the number (English)</span>
                <span>Text under the number (සිංහල)</span>
              </div>
              <div className="space-y-3">
                {current.labels.en.map((_, index) => (
                  <div key={index} className="grid grid-cols-[2.25rem_1fr_1fr] items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-white text-sm font-semibold text-black">{index + 1}</span>
                    <input
                      required
                      maxLength={60}
                      aria-label={`Label for ${index + 1} in English`}
                      className={inputClass}
                      value={current.labels.en[index]}
                      onChange={(e) => setLabel("en", index, e.target.value)}
                    />
                    <input
                      required
                      maxLength={60}
                      aria-label={`Label for ${index + 1} in Sinhala`}
                      className={inputClass}
                      value={current.labels.si[index]}
                      onChange={(e) => setLabel("si", index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </fieldset>

          {message && (
            <p role="status" className={cn("flex items-center gap-2 text-sm", message.ok ? "text-zinc-200" : "text-red-400")}>
              {message.ok && <Check size={16} />} {message.text}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!editable || busy}
              className="h-11 rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save all changes"}
            </button>
            <button
              type="button"
              disabled={!editable || busy}
              onClick={() => setScale(defaultScale)}
              className="h-11 rounded-full border border-white/15 px-5 text-sm text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              Reset all to defaults
            </button>
          </div>
        </form>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Preview</h2>
            <div role="group" aria-label="Preview language" className="flex gap-0.5 rounded-full border border-white/15 p-1">
              {(["en", "si"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={previewLang === lang}
                  onClick={() => setPreviewLang(lang)}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-sm transition",
                    previewLang === lang ? "bg-white text-black" : "text-zinc-300 hover:text-white"
                  )}
                >
                  {lang === "en" ? "EN" : "සිං"}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-[#111111] p-6">
            <RatingScale question={current.question[previewLang]} labels={current.labels[previewLang]} selected={4} className="bg-transparent" />
            <p className="mt-4 text-center text-xs text-zinc-500">
              This is the second step, shown after &ldquo;{categoryNames[category]}&rdquo; is chosen. The highlighted number is just an example.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
