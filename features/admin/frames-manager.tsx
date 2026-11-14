"use client";

import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Frame } from "@/types/domain";

type AdminFrame = Frame & { responses: number };

type Draft = {
  id?: string;
  movie: string;
  timecode: string;
  director: string;
  dop: string;
  notes: string;
  image: string; // data URL when a new file was chosen
  preview: string; // what to show in the form
};

const empty: Draft = { movie: "", timecode: "", director: "", dop: "", notes: "", image: "", preview: "" };

const MAX_WIDTH = 1800;

/** Shrinks big photos so they upload fast and load quickly for participants. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Canvas unavailable"));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    image.onerror = () => reject(new Error("Could not read that image"));
    image.src = url;
  });
}

const inputClass =
  "h-11 w-full rounded-lg border border-white/15 bg-zinc-900 px-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/20";

export function FramesManager({ frames, editable }: { frames: AdminFrame[]; editable: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<AdminFrame | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setError("");
    setDraft({ ...empty });
  };

  const openEdit = (frame: AdminFrame) => {
    setError("");
    setDraft({
      id: frame.id,
      movie: frame.movie,
      timecode: frame.timecode,
      director: frame.director,
      dop: frame.dop,
      notes: frame.notes ?? "",
      image: "",
      preview: frame.frameImage
    });
  };

  const pickImage = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setDraft((current) => (current ? { ...current, image: dataUrl, preview: dataUrl } : current));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read that image");
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!draft.id && !draft.image) {
      setError("Please choose an image for the frame.");
      return;
    }

    setBusy(true);
    setError("");
    const body = {
      movie: draft.movie,
      timecode: draft.timecode,
      director: draft.director,
      dop: draft.dop,
      notes: draft.notes || undefined,
      ...(draft.image ? { frameImage: draft.image } : {})
    };

    try {
      const response = await fetch(draft.id ? `/api/admin/frames/${draft.id}` : "/api/admin/frames", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Please sign in again." : "Could not save the frame.");
      setDraft(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the frame.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/frames/${toDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete the frame.");
      setToDelete(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the frame.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-zinc-300">Content</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Frames</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            These are the frames participants see and rate. Changes show up for participants within seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={!editable}
          className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40 sm:self-auto"
        >
          <Plus size={17} /> Add frame
        </button>
      </header>

      {!editable && (
        <p className="mt-6 rounded-lg border border-white/10 bg-zinc-900 p-4 text-sm text-zinc-300">
          The database isn&apos;t connected, so frames are read-only. Set DATABASE_URL to manage them.
        </p>
      )}

      {frames.length === 0 ? (
        <p className="py-20 text-center text-sm text-zinc-500">No frames yet. Add the first one.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {frames.map((frame, position) => (
            <li key={frame.id} className="overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/5">
              <div className="relative aspect-video bg-black">
                <Image
                  src={frame.frameImage}
                  alt={`${frame.movie} at ${frame.timecode}`}
                  fill
                  sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                  unoptimized={frame.frameImage.startsWith("/api/")}
                  className="object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs text-zinc-200">
                  #{position + 1}
                </span>
              </div>
              <div className="p-4">
                <p className="truncate font-medium">{frame.movie}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {frame.timecode} · {frame.director} · DOP {frame.dop}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-400">
                    {frame.responses} {frame.responses === 1 ? "response" : "responses"}
                  </span>
                  {editable && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(frame)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/5 px-3.5 text-sm text-zinc-100 transition hover:bg-white/10"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setToDelete(frame);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/5 px-3.5 text-sm text-zinc-300 transition hover:bg-red-500/20 hover:text-red-300"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true">
          <form onSubmit={save} className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{draft.id ? "Edit frame" : "Add frame"}</h2>
              <button
                type="button"
                onClick={() => setDraft(null)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full bg-white/5 transition hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative grid aspect-video w-full place-items-center overflow-hidden rounded-lg border border-dashed border-white/25 bg-zinc-900 text-zinc-400 transition hover:border-white/60"
              )}
            >
              {draft.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.preview} alt="Frame preview" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm">
                  <ImagePlus size={28} /> Choose the frame image
                </span>
              )}
              {draft.preview && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1.5 text-xs text-white">Change image</span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                void pickImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm text-zinc-300">Movie</span>
                <input required className={inputClass} value={draft.movie} onChange={(e) => setDraft({ ...draft, movie: e.target.value })} placeholder="e.g. Paradise" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-zinc-300">Timecode</span>
                <input required className={inputClass} value={draft.timecode} onChange={(e) => setDraft({ ...draft, timecode: e.target.value })} placeholder="00:46:15" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-zinc-300">Director</span>
                <input required className={inputClass} value={draft.director} onChange={(e) => setDraft({ ...draft, director: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm text-zinc-300">Director of photography (DOP)</span>
                <input required className={inputClass} value={draft.dop} onChange={(e) => setDraft({ ...draft, dop: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm text-zinc-300">Notes (optional, not shown to participants)</span>
                <textarea
                  rows={2}
                  className="w-full resize-none rounded-lg border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/20"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="h-10 rounded-full border border-white/15 px-5 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-10 rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {busy ? "Saving…" : draft.id ? "Save changes" : "Add frame"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4 backdrop-blur-sm" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">Delete this frame?</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              &ldquo;{toDelete.movie}&rdquo; ({toDelete.timecode}) will be removed for everyone
              {toDelete.responses > 0 && (
                <>
                  , along with its {toDelete.responses} {toDelete.responses === 1 ? "response" : "responses"}
                </>
              )}
              . This can&apos;t be undone.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                className="h-10 rounded-full border border-white/15 px-5 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy}
                className="h-10 rounded-full bg-red-500 px-5 text-sm font-medium text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
