"use client";

import { ChevronRight, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExportDialog } from "@/features/admin/export-dialog";
import type { ParticipantSummary, Statistics } from "@/types/domain";

const tooltipStyle = { background: "#111111", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" };

export function StatisticsDashboard({
  statistics,
  participants
}: {
  statistics: Statistics;
  participants: ParticipantSummary[];
}) {
  const [query, setQuery] = useState("");
  const [profession, setProfession] = useState("All roles");

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

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Participants" value={statistics.participants} />
        <Metric label="Responses" value={statistics.totalAnnotations} />
        <Metric label="Frames" value={statistics.totalFrames} />
        <Metric label="Unconventional" value={`${statistics.unconventionalPercent}%`} />
        <Metric label="Conventional" value={`${statistics.conventionalPercent}%`} />
        <Metric label="Not Sure" value={`${statistics.notSurePercent}%`} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Chart title="Answers by movie" data={statistics.movies} xKey="movie" />
        <Chart title="Answers by participant role" data={statistics.professions} xKey="profession" />
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
                    {item.answered} / {statistics.totalFrames} answered
                  </p>
                  <p className="hidden text-sm text-zinc-500 md:block">{new Date(item.createdAt).toLocaleDateString()}</p>
                  <ChevronRight size={18} className="text-zinc-600 transition group-hover:text-zinc-300" />
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

function Chart({
  title,
  data,
  xKey
}: {
  title: string;
  data: Array<{ conventional: number; unconventional: number; notSure: number } & Record<string, string | number>>;
  xKey: string;
}) {
  return (
    <div className="rounded-lg bg-[#111111] p-5 shadow-2xl shadow-black/40">
      <h2 className="mb-5 text-lg font-medium">{title}</h2>
      <div className="h-72">
        {data.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-zinc-500">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey={xKey} stroke="#a1a1aa" tick={{ fontSize: 12 }} />
              <YAxis stroke="#a1a1aa" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend />
              <Bar dataKey="unconventional" name="Unconventional" stackId="a" fill="#ffffff" />
              <Bar dataKey="conventional" name="Conventional" stackId="a" fill="#a1a1aa" />
              <Bar dataKey="notSure" name="Not sure" stackId="a" fill="#52525b" />
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
