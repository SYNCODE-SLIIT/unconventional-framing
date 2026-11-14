"use client";

import { ChevronRight, RotateCcw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/features/admin/avatar";
import { cn } from "@/lib/utils";
import type { ParticipantSummary } from "@/types/domain";

type Action = "delete" | "restore" | "purge";
type Pending = { action: Action; people: ParticipantSummary[] };

export function ParticipantsPanel({
  active,
  deleted,
  totalFrames,
  professions
}: {
  active: ParticipantSummary[];
  deleted: ParticipantSummary[];
  totalFrames: number;
  professions: string[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"active" | "bin">("active");
  const [query, setQuery] = useState("");
  const [profession, setProfession] = useState("All roles");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const allBox = useRef<HTMLInputElement>(null);

  const inBin = view === "bin";
  const source = inBin ? deleted : active;

  const filtered = useMemo(
    () =>
      source.filter(
        (item) =>
          (profession === "All roles" || item.profession === profession) &&
          item.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [source, profession, query]
  );

  // Selection only makes sense for rows that are still visible.
  useEffect(() => {
    setSelected((current) => {
      const visible = new Set(filtered.map((item) => item.id));
      const next = new Set([...current].filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filtered]);

  const chosen = filtered.filter((item) => selected.has(item.id));
  const allSelected = filtered.length > 0 && chosen.length === filtered.length;

  useEffect(() => {
    if (allBox.current) allBox.current.indeterminate = chosen.length > 0 && !allSelected;
  }, [chosen.length, allSelected]);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((item) => item.id)));

  const run = async (action: Action, people: ParticipantSummary[]) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: people.map((item) => item.id) })
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Please sign in again." : "Something went wrong. Please try again.");
      setPending(null);
      setSelected(new Set());
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const ask = (action: Action, people: ParticipantSummary[]) => {
    setError("");
    setPending({ action, people });
  };

  const tab = (value: "active" | "bin", label: string, count: number) => (
    <button
      type="button"
      onClick={() => {
        setView(value);
        setSelected(new Set());
        setQuery("");
      }}
      aria-pressed={view === value}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm transition",
        view === value ? "bg-white text-black" : "text-zinc-300 hover:bg-white/10 hover:text-white"
      )}
    >
      {value === "bin" && <Trash2 size={15} />}
      {label} <span className={view === value ? "text-black/60" : "text-zinc-500"}>{count}</span>
    </button>
  );

  const count = pending?.people.length ?? 0;
  const noun = count === 1 ? "participant" : "participants";

  return (
    <section className="mt-8 rounded-lg bg-[#111111] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 rounded-full border border-white/10 p-1">
          {tab("active", "Participants", active.length)}
          {tab("bin", "Deleted users", deleted.length)}
        </div>

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
            {professions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      {inBin && (
        <p className="mt-4 text-sm text-zinc-500">
          Deleted users don&apos;t count in the totals or charts. Restore them to bring everything back, or delete them permanently.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="mt-5 flex min-h-11 flex-wrap items-center gap-3 border-b border-white/5 pb-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
            <input ref={allBox} type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 accent-white" />
            Select all
          </label>

          {chosen.length > 0 && (
            <>
              <span className="text-sm text-zinc-500">{chosen.length} selected</span>
              <div className="ml-auto flex flex-wrap gap-2">
                {inBin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void run("restore", chosen)}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                    >
                      <RotateCcw size={14} /> Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => ask("purge", chosen)}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-red-500/15 px-4 text-sm text-red-300 transition hover:bg-red-500/25"
                    >
                      <Trash2 size={14} /> Delete permanently
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => ask("delete", chosen)}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-red-500/15 px-4 text-sm text-red-300 transition hover:bg-red-500/25"
                  >
                    <Trash2 size={14} /> Delete selected
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {error && !pending && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          {inBin
            ? "The bin is empty."
            : active.length === 0
              ? "No one has taken the study yet."
              : "No participants match."}
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {filtered.map((item) => {
            const row = (
              <>
                <Avatar src={item.avatar} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="truncate text-sm text-zinc-400">{item.profession}</p>
                </div>
                <p className="hidden text-sm text-zinc-400 sm:block">
                  {item.answered} / {totalFrames} rated
                  {item.answered > 0 && <span className="ml-2 text-zinc-500">avg {item.average}</span>}
                </p>
                <p className="hidden text-sm text-zinc-500 md:block">
                  {inBin && item.deletedAt ? `Deleted ${new Date(item.deletedAt).toLocaleDateString()}` : new Date(item.createdAt).toLocaleDateString()}
                </p>
              </>
            );

            return (
              <li
                key={item.id}
                className={cn("group flex items-center gap-1 rounded-lg transition hover:bg-white/5", selected.has(item.id) && "bg-white/5")}
              >
                <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    aria-label={`Select ${item.name}`}
                    className="size-4 accent-white"
                  />
                </label>

                {inBin ? (
                  <div className="flex min-w-0 flex-1 items-center gap-4 py-3 pr-2">{row}</div>
                ) : (
                  <Link href={`/admin/participants/${item.id}`} className="flex min-w-0 flex-1 items-center gap-4 py-3 pr-2">
                    {row}
                    <ChevronRight size={18} className="text-zinc-600 transition group-hover:text-white" />
                  </Link>
                )}

                {inBin ? (
                  <div className="mr-1 flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => void run("restore", [item])}
                      disabled={busy}
                      aria-label={`Restore ${item.name}`}
                      title="Restore"
                      className="grid size-9 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => ask("purge", [item])}
                      aria-label={`Delete ${item.name} permanently`}
                      title="Delete permanently"
                      className="grid size-9 place-items-center rounded-full text-zinc-500 transition hover:bg-red-500/15 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => ask("delete", [item])}
                    aria-label={`Delete ${item.name}`}
                    title="Delete"
                    className="mr-1 grid size-9 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-red-500/15 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4 backdrop-blur-sm" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">
              {pending.action === "purge" ? "Delete permanently?" : "Are you sure?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {pending.action === "delete" && (
                <>
                  {count === 1 ? (
                    <>
                      <span className="text-zinc-200">{pending.people[0].name}</span> will be moved to{" "}
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-200">{count} {noun}</span> will be moved to{" "}
                    </>
                  )}
                  the Deleted users bin. They stop counting in the totals and charts, and you can restore them any time.
                </>
              )}
              {pending.action === "purge" && (
                <>
                  This removes {count === 1 ? <span className="text-zinc-200">{pending.people[0].name}</span> : `${count} ${noun}`} from the
                  database for good, including their photo and every rating they gave. This can&apos;t be undone.
                </>
              )}
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="h-10 rounded-full border border-white/15 px-5 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void run(pending.action, pending.people)}
                disabled={busy}
                className="h-10 rounded-full bg-red-500 px-5 text-sm font-medium text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                {busy ? "Working…" : pending.action === "purge" ? "Delete permanently" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
