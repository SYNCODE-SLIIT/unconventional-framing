"use client";

import { Search } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExportDialog } from "@/features/admin/export-dialog";
import type { Statistics } from "@/types/domain";

export function StatisticsDashboard({ statistics }: { statistics: Statistics }) {
  return (
    <div className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-8 lg:px-12">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#C5A46D]">Research Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-5xl">
            Frame Classification
          </h1>
        </div>
        <ExportDialog />
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Total Frames" value={statistics.totalFrames} />
        <Metric label="Annotations" value={statistics.totalAnnotations} />
        <Metric label="Completion" value={`${statistics.completionPercent}%`} />
        <Metric label="Conventional" value={`${statistics.conventionalPercent}%`} />
        <Metric label="Unconventional" value={`${statistics.unconventionalPercent}%`} />
        <Metric label="Not Sure" value={`${statistics.notSurePercent}%`} />
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-lg bg-[#111111] p-5 shadow-2xl shadow-black/40">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Movie Breakdown</h2>
            <label className="flex min-h-11 items-center gap-2 rounded-full bg-white/5 px-4 text-sm text-zinc-300">
              <Search size={16} />
              <input
                aria-label="Search by movie"
                placeholder="Search movie"
                className="w-36 bg-transparent text-white outline-none placeholder:text-zinc-500"
              />
            </label>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statistics.movies}>
                <XAxis dataKey="movie" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff"
                  }}
                />
                <Bar dataKey="conventional" stackId="a" fill="#f8fafc" />
                <Bar dataKey="unconventional" stackId="a" fill="#C5A46D" />
                <Bar dataKey="notSure" stackId="a" fill="#71717a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <aside className="rounded-lg bg-[#111111] p-5">
          <h2 className="text-lg font-medium">Filters</h2>
          <div className="mt-5 space-y-4 text-sm text-zinc-300">
            <Select label="Movie" options={["All movies", ...statistics.movies.map((item) => item.movie)]} />
            <Select label="Answer" options={["Any answer", "Conventional", "Unconventional", "Not Sure"]} />
            <Select label="Research Session" options={["Current session", "Bookmarked", "Needs review"]} />
          </div>
        </aside>
      </section>
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

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-zinc-400">{label}</span>
      <select className="min-h-11 w-full rounded-md border border-white/10 bg-black px-3 text-white">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
