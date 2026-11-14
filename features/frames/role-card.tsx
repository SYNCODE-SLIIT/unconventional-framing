"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Aperture, Camera, Clapperboard, GraduationCap, NotebookPen, PenLine, Scissors, Star, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  role: string;
  avatar: string;
  onPhotoClick?: () => void;
};

/** Photo area shared by every card: shows the portrait large, or an inviting upload prompt. */
function Portrait({
  avatar,
  onClick,
  className,
  imageClass,
  emptyClass
}: {
  avatar: string;
  onClick?: () => void;
  className?: string;
  imageClass?: string;
  emptyClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={avatar ? "Change photo" : "Add your photo"}
      className={cn("group relative block w-full overflow-hidden text-left", className)}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="Your photo" className={cn("size-full object-cover", imageClass)} />
      ) : (
        <div className={cn("grid size-full place-items-center", emptyClass)}>
          <div className="flex flex-col items-center gap-2 opacity-60">
            <UserRound size={52} strokeWidth={1.2} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Add your photo</span>
          </div>
        </div>
      )}
      <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100">
        <span className="inline-flex items-center gap-2 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-medium text-white">
          <Camera size={13} /> {avatar ? "Change photo" : "Upload photo"}
        </span>
      </span>
    </button>
  );
}

function Name({ value, className, placeholder = "Your name" }: { value: string; className?: string; placeholder?: string }) {
  const shown = value.trim();
  return (
    <p className={cn("break-words", className, !shown && "opacity-35")} title={shown}>
      {shown || placeholder}
    </p>
  );
}

const shadow = "shadow-[0_24px_60px_rgba(0,0,0,0.65)]";

/* Director: clapperboard slate. Hard black/white stripes, all-caps, crisp white rule. */
function DirectorCard({ name, avatar, onPhotoClick }: Props) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-white/70 bg-black", shadow)}>
      <div
        className="h-7 border-b border-white/70"
        style={{ backgroundImage: "repeating-linear-gradient(-55deg,#fafafa 0 14px,#000 14px 28px)" }}
        aria-hidden
      />
      <div className="flex items-center justify-between px-4 pt-3 text-[9px] uppercase tracking-[0.3em] text-zinc-400">
        <span>Director</span>
        <span>Scene 01 · Take 01</span>
      </div>
      <div className="p-4 pt-2.5">
        <Portrait
          avatar={avatar}
          onClick={onPhotoClick}
          className="h-[var(--photo-h)] rounded-md ring-1 ring-white/40"
          emptyClass="bg-zinc-950 text-zinc-300"
        />
        <Name value={name} className="mt-4 text-2xl font-extrabold uppercase leading-none tracking-wide text-white" />
        <div className="mt-2.5 flex items-center gap-2 text-zinc-300">
          <Clapperboard size={14} />
          <span className="text-[11px] uppercase tracking-[0.25em]">Film Director</span>
        </div>
        <p className="mt-3 border-t border-white/15 pt-2.5 text-[11px] italic text-zinc-500">&ldquo;Action.&rdquo;</p>
      </div>
    </div>
  );
}

/* Cinematographer: lens + viewfinder. Concentric rings, focus brackets, exposure data. */
function CinematographerCard({ name, avatar, onPhotoClick }: Props) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-white/20 bg-[linear-gradient(160deg,#1c1c1e_0%,#09090a_70%)]", shadow)}>
      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -bottom-14 -right-14 size-64 text-white/[0.07]">
        {[90, 74, 58, 42, 26].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="1.5" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="100"
            y1="100"
            x2={100 + 90 * Math.cos((i * Math.PI) / 6)}
            y2={100 + 90 * Math.sin((i * Math.PI) / 6)}
            stroke="currentColor"
            strokeWidth="0.8"
          />
        ))}
      </svg>
      <div className="relative flex items-center justify-between px-4 pt-4 text-[9px] uppercase tracking-[0.3em] text-zinc-300">
        <span className="inline-flex items-center gap-2">
          <Aperture size={13} /> Director of Photography
        </span>
        <span className="font-mono">f/2.8</span>
      </div>
      <div className="relative p-4 pt-2.5">
        <div className="relative">
          <Portrait
            avatar={avatar}
            onClick={onPhotoClick}
            className="h-[var(--photo-h)] rounded-sm"
            imageClass="contrast-110"
            emptyClass="bg-zinc-900 text-zinc-300"
          />
          {[
            "left-2 top-2 border-l-2 border-t-2",
            "right-2 top-2 border-r-2 border-t-2",
            "left-2 bottom-2 border-b-2 border-l-2",
            "right-2 bottom-2 border-b-2 border-r-2"
          ].map((c) => (
            <span key={c} className={cn("pointer-events-none absolute size-4 border-white/90", c)} />
          ))}
        </div>
        <Name value={name} className="mt-4 text-2xl font-semibold leading-tight text-white" />
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.25em] text-zinc-400">Cinematographer</p>
        <p className="mt-3 border-t border-white/10 pt-2.5 font-mono text-[10px] text-zinc-500">24 fps · 2.39:1 · ISO 800</p>
      </div>
    </div>
  );
}

/* Editor: NLE timeline. Grey clips on tracks with a white playhead. */
function EditorCard({ name, avatar, onPhotoClick }: Props) {
  const tracks: Array<Array<[number, number, string]>> = [
    [[0, 34, "bg-zinc-200"], [38, 22, "bg-zinc-500"], [64, 30, "bg-zinc-300"]],
    [[8, 26, "bg-zinc-500"], [38, 40, "bg-zinc-200"], [82, 14, "bg-zinc-400"]],
    [[0, 52, "bg-zinc-400"], [56, 38, "bg-zinc-600"]]
  ];
  return (
    <div className={cn("overflow-hidden rounded-xl border border-white/20 bg-[#0d0d0d]", shadow)}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[9px] uppercase tracking-[0.3em] text-zinc-300">
        <span className="inline-flex items-center gap-2">
          <Scissors size={13} /> Film Editor
        </span>
        <span className="font-mono text-zinc-500">00:00:00:00</span>
      </div>
      <div className="p-4 pt-3">
        <Portrait
          avatar={avatar}
          onClick={onPhotoClick}
          className="h-[var(--photo-h)] rounded-md ring-1 ring-white/20"
          emptyClass="bg-zinc-900 text-zinc-300"
        />
        <Name value={name} className="mt-4 text-2xl font-bold leading-tight text-white" />
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.25em] text-zinc-400">Where the story is made</p>
        <div className="relative mt-4 space-y-1.5 rounded-md bg-black p-2 ring-1 ring-white/10" aria-hidden>
          {tracks.map((track, row) => (
            <div key={row} className="relative h-2.5">
              {track.map(([left, width, color]) => (
                <span key={left} className={cn("absolute top-0 h-2.5 rounded-[2px]", color)} style={{ left: `${left}%`, width: `${width}%` }} />
              ))}
            </div>
          ))}
          <span className="absolute inset-y-0 left-[46%] w-px bg-white shadow-[0_0_8px_#fff]" />
        </div>
      </div>
    </div>
  );
}

/* Critic: dark editorial review card. Serif name, rating row, outlined "Reviewed" mark. */
function CriticCard({ name, avatar, onPhotoClick }: Props) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-white/20 bg-[linear-gradient(160deg,#1c1c1e_0%,#09090a_70%)]", shadow)}>
      <div className="flex items-center justify-between px-4 pt-4 text-[9px] uppercase tracking-[0.3em] text-zinc-300">
        <span className="inline-flex items-center gap-2">
          <PenLine size={13} /> The Critic&apos;s Column
        </span>
        <span className="font-mono">Vol. I</span>
      </div>
      <div className="relative p-4 pt-2.5">
        <div className="relative">
          <Portrait
            avatar={avatar}
            onClick={onPhotoClick}
            className="h-[var(--photo-h)] rounded-sm"
            imageClass="grayscale contrast-125"
            emptyClass="bg-zinc-900 text-zinc-300"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 -rotate-6 rounded-sm border border-white/80 bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-sm">
            Reviewed
          </span>
        </div>
        <Name value={name} className="mt-4 font-serif text-2xl font-semibold leading-tight text-white" />
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.25em] text-zinc-400">Film Critic</p>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
          <p className="font-serif text-[11px] italic text-zinc-500">&ldquo;Every frame is an argument.&rdquo;</p>
          <span className="flex gap-0.5 text-zinc-300" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <Star key={i} size={11} fill="currentColor" />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* Academic: formal credential. Double frame, serif, arched portrait, centred. */
function AcademicCard({ name, avatar, onPhotoClick }: Props) {
  return (
    <div className={cn("rounded-xl border border-white/50 bg-black p-1 font-serif", shadow)}>
      <div className="rounded-lg border border-white/25 p-4">
        <div className="flex items-center justify-center gap-3 text-zinc-200">
          <span className="h-px flex-1 bg-white/30" />
          <GraduationCap size={22} />
          <span className="h-px flex-1 bg-white/30" />
        </div>
        <p className="mt-2 text-center text-[9px] uppercase tracking-[0.4em] text-zinc-400">Department of Film Studies</p>
        <Portrait
          avatar={avatar}
          onClick={onPhotoClick}
          className="mx-auto mt-3 h-[var(--photo-h)] w-[calc(var(--photo-h)*0.8)] rounded-b-md rounded-t-[999px] ring-1 ring-white/40"
          emptyClass="bg-zinc-950 text-zinc-300"
        />
        <Name value={name} className="mt-4 text-center text-2xl font-semibold leading-tight text-white" />
        <p className="mt-1.5 text-center text-[11px] uppercase tracking-[0.3em] text-zinc-400">Academic / Lecturer</p>
        <p className="mt-3 border-t border-white/20 pt-2.5 text-center text-[11px] italic text-zinc-500">Reading cinema closely.</p>
      </div>
    </div>
  );
}

/* Student: ID badge. Ash lanyard slot, bold header, tilted slightly like a worn badge. */
function StudentCard({ name, avatar, onPhotoClick }: Props) {
  return (
    <div className={cn("relative -rotate-1 overflow-hidden rounded-xl bg-zinc-300 p-3 text-zinc-900", shadow)}>
      <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-zinc-500/70" aria-hidden />
      <div className="overflow-hidden rounded-lg bg-white">
        <div className="bg-zinc-900 px-4 py-2 text-center text-white">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Hello</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">my name is</p>
        </div>
        <div className="p-3.5">
          <Name value={name} className="text-center text-2xl font-black leading-tight text-zinc-900" />
          <Portrait
            avatar={avatar}
            onClick={onPhotoClick}
            className="mt-3 h-[var(--photo-h)] rounded-md"
            emptyClass="bg-zinc-100 text-zinc-500"
          />
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-800">
            <NotebookPen size={15} /> Film Student
          </div>
          <p className="mt-0.5 text-center text-[11px] text-zinc-500">Always learning, always watching.</p>
        </div>
      </div>
    </div>
  );
}

function BlankCard({ name, avatar, onPhotoClick }: Props) {
  return (
    <div className={cn("rounded-xl border border-dashed border-white/25 bg-zinc-950/70 p-4", shadow)}>
      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Participant</p>
      <Portrait
        avatar={avatar}
        onClick={onPhotoClick}
        className="mt-2.5 h-[var(--photo-h)] rounded-md ring-1 ring-white/10"
        emptyClass="bg-zinc-900 text-zinc-400"
      />
      <Name value={name} className="mt-4 text-2xl font-semibold leading-tight text-white" />
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Choose a role to style your card</p>
    </div>
  );
}

const cards: Record<string, (props: Props) => ReactNode> = {
  "Film Director": DirectorCard,
  Cinematographer: CinematographerCard,
  "Film Editor": EditorCard,
  "Film Critic": CriticCard,
  "Film Academic / Lecturer": AcademicCard,
  "Film Student": StudentCard
};

export function RoleCard({ name, role, avatar, onPhotoClick }: Props) {
  const Card = cards[role] ?? BlankCard;

  return (
    <div className="w-full max-w-[310px] [--photo-h:260px] lg:[--photo-h:clamp(140px,32dvh,340px)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={role || "blank"}
          initial={{ opacity: 0, y: 18, rotateY: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 1200 }}
        >
          <Card name={name} role={role} avatar={avatar} onPhotoClick={onPhotoClick} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
