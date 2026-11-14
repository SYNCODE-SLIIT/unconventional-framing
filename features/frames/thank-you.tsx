"use client";

import { motion } from "framer-motion";
import { Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { LanguageSwitch, useLang } from "@/lib/i18n";

export function ThankYou({ onDownload, onReview }: { onDownload: () => Promise<void>; onReview: () => void }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await onDownload();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.07),transparent_60%)]" />
      <LanguageSwitch />

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-balance text-2xl font-semibold leading-relaxed sm:text-4xl"
        >
          <span className="block">{t("thankLine1")}</span>
          <span className="mt-3 block text-zinc-300">{t("thankLine2")}</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-12 flex flex-col items-center gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={() => void download()}
            disabled={busy}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-60"
          >
            <Download size={17} /> {busy ? t("preparing") : t("downloadPdf")}
          </button>
          <button
            type="button"
            onClick={onReview}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            <RotateCcw size={16} /> {t("reviewAnswers")}
          </button>
        </motion.div>

        {failed && (
          <p role="alert" className="mt-5 text-sm text-red-400">
            {t("reportError")}
          </p>
        )}
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center">
        <p className="text-sm font-medium text-zinc-200">Loshan Ruwanpathirana</p>
        <p className="mt-1 text-xs text-zinc-500">{t("footerDegree")}</p>
        <p className="text-xs text-zinc-500">{t("footerUni")}</p>
      </footer>
    </main>
  );
}
