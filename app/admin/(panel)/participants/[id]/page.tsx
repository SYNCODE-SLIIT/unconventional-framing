import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/features/admin/statistics-dashboard";
import { getParticipant } from "@/lib/data";
import { answerLabel, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Participant profile",
  robots: { index: false, follow: false }
};

const badge: Record<string, string> = {
  UNCONVENTIONAL: "bg-white text-black",
  CONVENTIONAL: "bg-white/10 text-white",
  NOT_SURE: "bg-zinc-700/50 text-zinc-300"
};

export default async function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await getParticipant(id);
  if (!participant) notFound();

  const stats = [
    { label: "Unconventional", value: participant.unconventional },
    { label: "Conventional", value: participant.conventional },
    { label: "Not sure", value: participant.notSure }
  ];

  return (
    <div className="px-5 py-6 text-white sm:px-8 lg:px-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
        <ArrowLeft size={16} /> All participants
      </Link>

      <header className="mt-6 flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
        <Avatar src={participant.avatar} size={112} />
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.22em] text-zinc-300">{participant.profession}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{participant.name}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Joined {new Date(participant.createdAt).toLocaleString()} · {participant.answered} of{" "}
            {participant.totalFrames} frames answered
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-lg bg-[#111111] px-5 py-4 text-center">
              <p className="text-2xl font-semibold">{item.value}</p>
              <p className="mt-1 text-xs text-zinc-400">{item.label}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Responses</h2>
        {participant.responses.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">This participant hasn&apos;t answered any frames yet.</p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {participant.responses.map((item) => (
              <li key={item.frameId} className="overflow-hidden rounded-lg bg-[#111111]">
                <Image
                  unoptimized={item.frameImage.startsWith("/api/")}
                  src={item.frameImage}
                  alt={`${item.movie} frame at ${item.timecode}`}
                  width={640}
                  height={360}
                  className="aspect-video w-full object-cover"
                />
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.movie}</p>
                    <p className="text-xs text-zinc-500">
                      {item.timecode} · {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium", badge[item.answer])}>
                    {answerLabel(item.answer)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
