"use client";

import { ChevronRight, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExportDialog } from "@/features/admin/export-dialog";
import type { ScaleConfig } from "@/lib/scale";
import type { ParticipantSummary, RatingCounts, Statistics } from "@/types/domain";

const tooltipStyle = { background: "#111111", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" };

// 1 = darkest, 5 = white: reads as a scale in a black and white theme.
const shades = ["#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#ffffff"];

export function StatisticsDashboard({
  statistics,
  participants,
  scale
}: {
  statistics: Statistics;
  participants: ParticipantSummary[];
  scale: ScaleConfig;
}) {
  const [query, setQuery] = useState("");
  const [profession, setProfession] = useState("All roles");
  const names = scale.labels.en;

  const filtered = useMemo(
    () =>
      participants.filter(
        (item) =>
          (profession === "All roles" || item.profession === profession) &&
          item.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [participants, profession, query]
  );

  return (
    <div className="px-5 py-6 text-white sm:px-8 lg:px-12">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-zinc-300">Research Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-5xl">Study analytics</h1>
        </div>
        <ExportDialog />
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Participants" value={statistics.participants} />
        <Metric label="Ratings" value={statistics.totalAnnotations} />
        <Metric label="Frames" value={statistics.totalFrames} />
        <Metric label="Completion" value={`${statistics.completionPercent}%`} />
        <Metric label="Average rating" value={statistics.totalAnnotations ? `${statistics.averageRating} / 5` : "–"} />
      </section>

      <section className="mt-8 rounded-lg bg-[#111111] p-5">
        <h2 className="text-lg font-medium">All ratings</h2>
        <Distribution counts={statistics.distribution} names={names} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Chart
          title="Ratings by movie"
          data={statistics.movies.map((item) => ({ label: item.movie, counts: item.counts }))}
          names={names}
        />
        <Chart
          title="Ratings by participant role"
          data={statistics.professions.map((item) => ({ label: item.profession, counts: item.counts }))}
          names={names}
        />
      </section>

      <section className="mt-8 rounded-lg bg-[#111111] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium">
            Participants <span className="ml-1 text-sm text-zinc-500">{filtered.length}</span>
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-11 items-center gap-2 rounded-full bg-white/5 px-4 text-sm text-zinc-300">
              <Search size={16} />
              <input
                aria-label="Search participants by name"
                placeholder="Search name"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-40 bg-transparent text-white outline-none placeholder:text-zinc-500"
              />
            </label>
            <select
              aria-label="Filter by role"
              value={profession}
              onChange={(event) => setProfession(event.target.value)}
              className="min-h-11 rounded-full border border-white/10 bg-black px-4 text-sm text-white"
            >
              <option>All roles</option>
              {statistics.professions.map((item) => (
                <option key={item.profession}>{item.profession}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {participants.length === 0 ? "No one has taken the study yet." : "No participants match."}
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-white/5">
            {filtered.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/participants/${item.id}`}
                  className="group flex items-center gap-4 rounded-lg px-2 py-3 transition hover:bg-white/5"
                >
                  <Avatar src={item.avatar} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-sm text-zinc-400">{item.profession}</p>
                  </div>
                  <p className="hidden text-sm text-zinc-400 sm:block">
                    {item.answered} / {statistics.totalFrames} rated
                    {item.answered > 0 && <span className="ml-2 text-zinc-500">avg {item.average}</span>}
                  </p>
                  <p className="hidden text-sm text-zinc-500 md:block">{new Date(item.createdAt).toLocaleDateString()}</p>
                  <ChevronRight size={18} className="text-zinc-600 transition group-hover:text-white" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

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

/** One bar per rating with its share, so the shape of the answers is visible at a glance. */
function Distribution({ counts, names }: { counts: RatingCounts; names: string[] }) {
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-zinc-500">No ratings yet</p>;

  return (
    <ul className="mt-5 space-y-3">
      {counts.map((count, index) => {
        const percent = Math.round((count / total) * 100);
        return (
          <li key={index} className="grid grid-cols-[2rem_minmax(0,11rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
            <span className="grid size-7 place-items-center rounded-full bg-white/10 text-xs font-semibold">{index + 1}</span>
            <span className="truncate text-zinc-300">{names[index]}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-white/5">
              <span className="block h-full rounded-full" style={{ width: `${percent}%`, background: shades[index] }} />
            </span>
            <span className="text-right text-zinc-400">
              {count} · {percent}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Chart({ title, data, names }: { title: string; data: Array<{ label: string; counts: RatingCounts }>; names: string[] }) {
  const rows = data.map((item) => ({
    label: item.label,
    ...Object.fromEntries(item.counts.map((count, index) => [`r${index + 1}`, count]))
  }));

  return (
    <div className="rounded-lg bg-[#111111] p-5 shadow-2xl shadow-black/40">
      <h2 className="mb-5 text-lg font-medium">{title}</h2>
      <div className="h-72">
        {rows.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-zinc-500">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
              <YAxis stroke="#a1a1aa" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend />
              {shades.map((fill, index) => (
                <Bar key={index} dataKey={`r${index + 1}`} name={`${index + 1} · ${names[index]}`} stackId="a" fill={fill} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[#111111] p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
