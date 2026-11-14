"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clapperboard, Clock, MousePointerClick, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

const VIDEO_ID = "JgokCr2LML8";

const points = [
  { icon: Clapperboard, label: "Real film frames" },
  { icon: MousePointerClick, label: "One click per frame" },
  { icon: Clock, label: "Only a few minutes" }
];

export function LandingHero({ onBegin }: { onBegin: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Left half: full-bleed autoplaying video (right-aligned fade into the page) */}
      <div className="relative aspect-video w-full lg:absolute lg:inset-y-0 lg:left-0 lg:aspect-auto lg:w-[62%]">
        <BackgroundVideo />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/40 lg:bg-gradient-to-r lg:from-black/20 lg:via-transparent lg:to-[#050505]" />
      </div>

      <header className="absolute inset-x-0 top-0 z-20 flex items-center px-6 py-6 sm:px-10">
        <span className="text-sm font-medium uppercase tracking-[0.28em] text-white drop-shadow">Unconventional Framing</span>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-56vw)] items-center px-6 py-14 sm:px-10 lg:ml-[62%] lg:min-h-screen lg:px-10 xl:px-14 lg:py-10">
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-xs uppercase tracking-[0.32em] text-zinc-300"
          >
            A research study in cinematography
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="mt-6 text-balance text-4xl font-semibold leading-[1.08] sm:text-5xl 2xl:text-6xl"
          >
            How do you see an{" "}
            <span className="bg-gradient-to-r from-white to-zinc-500 bg-clip-text italic text-transparent">unconventional</span>{" "}
            frame?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="mt-6 text-pretty text-base leading-7 text-zinc-400 sm:text-lg"
          >
            We are studying how unusual spatial arrangements in contemporary cinema shape viewer perception and
            emotional response. Look at each frame and tell us what you feel.
          </motion.p>

          <motion.button
            type="button"
            onClick={onBegin}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="group mt-10 inline-flex h-14 items-center gap-3 rounded-full bg-white px-9 text-base font-medium text-black shadow-[0_0_48px_rgba(255,255,255,0.3)] transition hover:bg-zinc-200 hover:shadow-[0_0_64px_rgba(255,255,255,0.25)]"
          >
            Begin the study
            <ArrowRight size={20} className="transition group-hover:translate-x-1" />
          </motion.button>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500 lg:justify-start"
          >
            {points.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon size={16} className="text-zinc-600" /> {label}
              </li>
            ))}
          </motion.ul>
        </div>
      </section>
    </main>
  );
}

/**
 * Autoplaying, looping, chrome-free YouTube video that covers its container.
 * Browsers only allow autoplay when muted, so it starts silent with a sound toggle.
 */
function BackgroundVideo() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const next = !muted;
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: next ? "mute" : "unMute", args: [] }),
      "https://www.youtube-nocookie.com"
    );
    setMuted(next);
  };

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: VIDEO_ID,
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    disablekb: "1",
    iv_load_policy: "3",
    enablejsapi: "1"
  });

  return (
    <div className="absolute inset-0 overflow-hidden bg-black [container-type:size]">
      <iframe
        ref={frameRef}
        src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?${params}`}
        title="Unconventional Framing: introduction film"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={-1}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 scale-[1.3] border-0"
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        title={muted ? "Turn sound on" : "Turn sound off"}
        className="absolute bottom-5 left-5 z-20 inline-flex items-center gap-2 rounded-full bg-black/55 px-4 py-2.5 text-sm text-white backdrop-blur transition hover:bg-black/75 sm:bottom-8 sm:left-8"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        {muted ? "Sound on" : "Sound off"}
      </button>
    </div>
  );
}
