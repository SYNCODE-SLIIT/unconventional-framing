"use client";

import { Camera, ChevronLeft, ChevronRight, GripVertical, ImagePlus, Pencil, Play, Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CropDialog } from "@/features/frames/crop-dialog";
import { ThirdsGrid } from "@/features/frames/thirds-grid";
import { MAX_VIDEO_BYTES, VIDEO_CHUNK, VIDEO_TYPES, parseVideo } from "@/lib/video";
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
  isVideo: boolean;
  localVideo: string; // address of the file just chosen on this computer, used only for the preview
  video: string; // video link, or the uploaded file's address
  image: string; // data URL when a new file was chosen
  preview: string; // what to show in the form
};

const empty: Draft = { movie: "", timecode: "", director: "", dop: "", notes: "", isVideo: false, localVideo: "", video: "", image: "", preview: "" };

const inputClass =
  "h-11 w-full rounded-lg border border-white/15 bg-zinc-900 px-3.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/20";

export function FramesManager({ frames, editable }: { frames: AdminFrame[]; editable: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<AdminFrame | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState(frames);
  const [notice, setNotice] = useState("");
  const [cropSrc, setCropSrc] = useState("");
  const [showGrid, setShowGrid] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const startOrder = useRef<string[]>([]);

  // Pick up changes after a refresh (add, edit, delete, or a saved reorder).
  useEffect(() => {
    setItems(frames);
  }, [frames]);

  const saveOrder = async (next: AdminFrame[]) => {
    setNotice("");
    try {
      const response = await fetch("/api/admin/frames/order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((item) => item.id) })
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(frames);
      setNotice("Could not save the new order. It has been put back.");
    }
  };

  const moveBy = (id: string, delta: number) => {
    const from = items.findIndex((item) => item.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    void saveOrder(next);
  };

  const dragOver = (overId: string) => {
    if (!draggingId || draggingId === overId) return;
    setItems((current) => {
      const from = current.findIndex((item) => item.id === draggingId);
      const to = current.findIndex((item) => item.id === overId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const dragEnd = () => {
    const changed = items.some((item, index) => item.id !== startOrder.current[index]);
    setDraggingId(null);
    if (changed) void saveOrder(items);
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

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
      isVideo: Boolean(frame.video),
      localVideo: "",
      video: frame.video ?? "",
      image: "",
      preview: frame.frameImage
    });
  };

  const pickImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setError("");
    setCropSrc(URL.createObjectURL(file));
  };

  const uploadVideo = async (file?: File) => {
    if (!file) return;
    if (!VIDEO_TYPES.includes(file.type)) {
      setError("Please choose an MP4, WebM or MOV video.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(`That video is too large. The limit is ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB.`);
      return;
    }

    setError("");
    setProgress(0);
    setDraft((current) => (current ? { ...current, localVideo: URL.createObjectURL(file) } : current));
    try {
      // The file is sent in small pieces, so big videos work within the host's request size limit.
      const created = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size })
      });
      if (created.status === 401) throw new Error("Your session expired. Please sign in again.");
      if (!created.ok) throw new Error((await created.json().catch(() => ({}))).error ?? "Could not start the upload.");
      const { id } = (await created.json()) as { id: string };

      const total = Math.ceil(file.size / VIDEO_CHUNK);
      for (let index = 0; index < total; index += 1) {
        const piece = file.slice(index * VIDEO_CHUNK, (index + 1) * VIDEO_CHUNK);
        let sent = false;
        for (let attempt = 0; attempt < 3 && !sent; attempt += 1) {
          const response = await fetch(`/api/admin/videos/${id}/chunks/${index}`, {
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: piece
          }).catch(() => null);
          sent = Boolean(response?.ok);
        }
        if (!sent) throw new Error("The upload was interrupted. Please try again.");
        setProgress(Math.round(((index + 1) / total) * 100));
      }

      const done = await fetch(`/api/admin/videos/${id}/complete`, { method: "POST" });
      if (!done.ok) throw new Error((await done.json().catch(() => ({}))).error ?? "Could not finish the upload.");
      const { url } = (await done.json()) as { url: string };
      setDraft((current) => (current ? { ...current, video: url } : current));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload the video.");
    } finally {
      setProgress(null);
    }
  };

  // Takes whatever frame the preview is paused on and offers it as the cover (cropped to 16:9 next).
  const captureCover = () => {
    const video = previewRef.current;
    if (!video || !video.videoWidth) {
      setError("Wait for the video to load, then pause on the frame you want.");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setError("");
      setCropSrc(canvas.toDataURL("image/jpeg", 0.92));
    } catch {
      setError("This video's host doesn't allow picking a frame. Upload the video here, or choose a cover picture instead.");
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!draft.id && !draft.image) {
      setError(draft.isVideo ? "Please choose a cover picture for the video." : "Please choose an image for the frame.");
      return;
    }
    if (draft.isVideo && !draft.video.trim()) {
      setError("Add a video link or upload a video file.");
      return;
    }
    if (progress !== null) {
      setError("Please wait for the video to finish uploading.");
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
      video: draft.isVideo ? draft.video.trim() : null,
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

      {notice && (
        <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {notice}
        </p>
      )}

      {editable && items.length > 1 && (
        <p className="mt-6 text-xs text-zinc-500">Drag a card by its handle to change the order, or use the arrows. The order is what participants see.</p>
      )}

      {items.length === 0 ? (
        <p className="py-20 text-center text-sm text-zinc-500">No frames yet. Add the first one.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((frame, position) => (
            <li
              key={frame.id}
              draggable={editable}
              onDragStart={(event) => {
                startOrder.current = items.map((item) => item.id);
                setDraggingId(frame.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", frame.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                dragOver(frame.id);
              }}
              onDrop={(event) => event.preventDefault()}
              onDragEnd={dragEnd}
              className={cn(
                "overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/5 transition",
                draggingId === frame.id && "opacity-40 ring-white/40"
              )}
            >
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
                {frame.video && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs text-zinc-200">
                    <Play size={11} fill="currentColor" /> Video
                  </span>
                )}
                {editable && items.length > 1 && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 p-1">
                    <button
                      type="button"
                      onClick={() => moveBy(frame.id, -1)}
                      disabled={position === 0}
                      aria-label="Move earlier"
                      title="Move earlier"
                      className="grid size-7 place-items-center rounded-full text-zinc-200 transition hover:bg-white/15 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="grid size-7 cursor-grab place-items-center text-zinc-400 active:cursor-grabbing" aria-hidden title="Drag to reorder">
                      <GripVertical size={16} />
                    </span>
                    <button
                      type="button"
                      onClick={() => moveBy(frame.id, 1)}
                      disabled={position === items.length - 1}
                      aria-label="Move later"
                      title="Move later"
                      className="grid size-7 place-items-center rounded-full text-zinc-200 transition hover:bg-white/15 disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
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

            <div role="group" aria-label="Frame type" className="mb-4 inline-flex gap-0.5 rounded-full border border-white/15 p-1">
              {([false, true] as const).map((video) => (
                <button
                  key={String(video)}
                  type="button"
                  aria-pressed={draft.isVideo === video}
                  onClick={() => setDraft({ ...draft, isVideo: video })}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition",
                    draft.isVideo === video ? "bg-white text-black" : "text-zinc-300 hover:text-white"
                  )}
                >
                  {video ? "Video" : "Picture"}
                </button>
              ))}
            </div>

            {draft.isVideo && (
              <div className="mb-4 space-y-2 rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-zinc-300">Video link</span>
                  <input
                    className={inputClass}
                    value={draft.video}
                    onChange={(e) => setDraft({ ...draft, video: e.target.value })}
                    placeholder="YouTube link, or a direct link to an .mp4 file"
                    inputMode="url"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => videoFileRef.current?.click()}
                    disabled={progress !== null}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-zinc-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Upload size={15} /> {progress !== null ? `Uploading ${progress}%` : "Upload a video file"}
                  </button>
                  {draft.video && progress === null && <span className="text-xs text-zinc-400">{draft.video.startsWith("/api/videos/") ? "Video uploaded" : "Video link added"}</span>}
                </div>
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  onChange={(event) => {
                    void uploadVideo(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                {(() => {
                  const previewSrc = draft.localVideo || (draft.video && parseVideo(draft.video).kind === "file" ? draft.video : "");
                  if (!previewSrc) return null;
                  return (
                    <div className="space-y-2 pt-1">
                      <video
                        ref={previewRef}
                        key={previewSrc}
                        src={previewSrc}
                        controls
                        playsInline
                        preload="metadata"
                        className="aspect-video w-full rounded-lg bg-black"
                      />
                      <button
                        type="button"
                        onClick={captureCover}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200"
                      >
                        <Camera size={15} /> Use this frame as the cover
                      </button>
                      <p className="text-xs text-zinc-500">Pause on the frame you want, then press the button. You can crop it next.</p>
                    </div>
                  );
                })()}
                <p className="text-xs text-zinc-500">Uploads: MP4, WebM or MOV, up to 150 MB. Larger files are better added as a YouTube link.</p>
                <p className="text-xs text-zinc-500">The cover shows while the video loads and in the participant&apos;s results. Pick a frame from the video above, or choose a picture below.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative grid aspect-video w-full place-items-center overflow-hidden rounded-lg border border-dashed border-white/25 bg-zinc-900 text-zinc-400 transition hover:border-white/60"
              )}
            >
              {draft.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.preview} alt="Frame preview" className="size-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm">
                  <ImagePlus size={28} /> {draft.isVideo ? "Choose the cover picture" : "Choose the frame image"}
                </span>
              )}
              {draft.preview && showGrid && <ThirdsGrid />}
              {draft.preview && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1.5 text-xs text-white">Change image</span>
              )}
            </button>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
              <span>Preview shows the 16:9 frame participants will see.</span>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-zinc-300">
                <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} className="accent-white" />
                Thirds grid
              </label>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                pickImage(event.target.files?.[0]);
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

      {cropSrc && (
        <CropDialog
          src={cropSrc}
          aspect={16 / 9}
          outWidth={1800}
          quality={0.9}
          onCancel={() => setCropSrc("")}
          onDone={(dataUrl) => {
            setDraft((current) => (current ? { ...current, image: dataUrl, preview: dataUrl } : current));
            setCropSrc("");
          }}
        />
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
