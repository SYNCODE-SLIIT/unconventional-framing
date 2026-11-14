import { UserRound } from "lucide-react";

export function Avatar({ src, size }: { src?: string; size: number }) {
  return src ? (
    <div
      className="shrink-0 rounded-full bg-cover bg-center ring-1 ring-white/15"
      style={{ width: size, height: size, backgroundImage: `url(${src})` }}
      role="img"
      aria-label="Participant photo"
    />
  ) : (
    <div
      className="grid shrink-0 place-items-center rounded-full bg-zinc-800 text-zinc-400 ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      <UserRound size={size * 0.5} strokeWidth={1.5} />
    </div>
  );
}
