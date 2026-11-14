"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function LandingHero({ onBegin }: { onBegin: () => void }) {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.07),transparent_60%)]" />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-xs uppercase tracking-[0.32em] text-zinc-400"
        >
          Final year academic research · 2026
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-8 text-balance text-2xl font-semibold leading-[1.2] md:text-3xl lg:text-[2.1rem]"
        >
          Reading and Evaluating the Aesthetics of{" "}
          <span className="italic text-zinc-300">Unconventional Framing</span>
          <br className="hidden lg:block" /> in Contemporary Sri Lankan Cinema
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-base text-zinc-400 sm:text-lg"
        >
          Sinhala Feature Films (2005 – 2026)
        </motion.p>

        <motion.button
          type="button"
          onClick={onBegin}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="group mt-12 inline-flex h-14 items-center gap-3 rounded-full bg-white px-9 text-base font-medium text-black shadow-[0_0_48px_rgba(255,255,255,0.18)] transition hover:bg-zinc-200"
        >
          Begin the study
          <ArrowRight size={20} className="transition group-hover:translate-x-1" />
        </motion.button>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center">
        <p className="text-sm font-medium text-zinc-200">Loshan Ruwanpathirana</p>
        <p className="mt-1 text-xs text-zinc-500">Undergraduate of BSc (Hons) in Multimedia Technology</p>
        <p className="text-xs text-zinc-500">Kingston University London</p>
      </footer>
    </main>
  );
}
