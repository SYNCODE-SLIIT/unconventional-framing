"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const OUT_W = 400;
const OUT_H = 500;
const RATIO = OUT_H / OUT_W; // 1.25: crop frame is always a 4:5 portrait
const MIN_W = 60;

type Crop = { x: number; y: number; w: number };
type Handle = { hx: 0 | 1; hy: 0 | 1 };

/**
 * Crop step shown right after you upload or take a photo.
 * Drag the frame to move it, drag a corner to resize it, then confirm.
 */
export function CropDialog({
  src,
  onCancel,
  onDone
}: {
  src: string;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, w: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const action = useRef<
    | { type: "move"; px: number; py: number; start: Crop }
    | { type: "resize"; handle: Handle; ax: number; ay: number }
    | null
  >(null);

  useEffect(() => {
    const next = new window.Image();
    next.onload = () => {
      const maxW = Math.min(520, window.innerWidth - 48);
      const maxH = Math.min(window.innerHeight * 0.58, 560);
      const scale = Math.min(maxW / next.naturalWidth, maxH / next.naturalHeight, 1);
      const w = Math.round(next.naturalWidth * scale);
      const h = Math.round(next.naturalHeight * scale);
      const cropW = Math.min(w, h / RATIO);
      setBox({ w, h });
      setCrop({ x: (w - cropW) / 2, y: (h - cropW * RATIO) / 2, w: cropW });
      setImage(next);
    };
    next.src = src;
  }, [src]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const local = (event: React.PointerEvent) => {
    const rect = stage.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startMove = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    action.current = { type: "move", px: event.clientX, py: event.clientY, start: crop };
  };

  const startResize = (handle: Handle) => (event: React.PointerEvent) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    // The corner opposite the one being dragged stays fixed.
    action.current = {
      type: "resize",
      handle,
      ax: handle.hx ? crop.x : crop.x + crop.w,
      ay: handle.hy ? crop.y : crop.y + crop.w * RATIO
    };
  };

  const onMove = (event: React.PointerEvent) => {
    const current = action.current;
    if (!current) return;

    if (current.type === "move") {
      const h = current.start.w * RATIO;
      setCrop({
        w: current.start.w,
        x: Math.min(box.w - current.start.w, Math.max(0, current.start.x + event.clientX - current.px)),
        y: Math.min(box.h - h, Math.max(0, current.start.y + event.clientY - current.py))
      });
      return;
    }

    const p = local(event);
    const { handle, ax, ay } = current;
    const wanted = Math.max(Math.abs(p.x - ax), Math.abs(p.y - ay) / RATIO);
    const roomX = handle.hx ? box.w - ax : ax;
    const roomY = (handle.hy ? box.h - ay : ay) / RATIO;
    const w = Math.max(MIN_W, Math.min(wanted, roomX, roomY));
    setCrop({ w, x: handle.hx ? ax : ax - w, y: handle.hy ? ay : ay - w * RATIO });
  };

  const confirm = () => {
    if (!image) return;
    const scale = image.naturalWidth / box.w;
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, crop.x * scale, crop.y * scale, crop.w * scale, crop.w * RATIO * scale, 0, 0, OUT_W, OUT_H);
    onDone(canvas.toDataURL("image/jpeg", 0.85));
  };

  const corners: Array<Handle & { className: string; cursor: string }> = [
    { hx: 0, hy: 0, className: "-left-2 -top-2", cursor: "nwse-resize" },
    { hx: 1, hy: 0, className: "-right-2 -top-2", cursor: "nesw-resize" },
    { hx: 0, hy: 1, className: "-bottom-2 -left-2", cursor: "nesw-resize" },
    { hx: 1, hy: 1, className: "-bottom-2 -right-2", cursor: "nwse-resize" }
  ];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/85 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Crop your photo"
    >
      <div className="w-full max-w-fit rounded-xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-white">Crop your photo</p>
            <p className="text-xs text-zinc-500">Drag the frame to move it. Drag a corner to resize.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="grid size-9 place-items-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center">
          <div
            ref={stage}
            className="relative touch-none select-none overflow-hidden rounded-md bg-zinc-900"
            style={{ width: box.w || 320, height: box.h || 400 }}
            onPointerMove={onMove}
            onPointerUp={() => (action.current = null)}
            onPointerCancel={() => (action.current = null)}
          >
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full" />
            )}
            {image && (
              <div
                onPointerDown={startMove}
                className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.62)]"
                style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.w * RATIO }}
              >
                <span className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="border border-white/30" />
                  ))}
                </span>
                {corners.map((corner) => (
                  <span
                    key={corner.className}
                    onPointerDown={startResize({ hx: corner.hx, hy: corner.hy })}
                    className={`absolute size-4 rounded-sm bg-white shadow ${corner.className}`}
                    style={{ cursor: corner.cursor }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-full border border-white/15 px-5 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!image}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40"
          >
            <Check size={16} /> Crop &amp; use
          </button>
        </div>
      </div>
    </div>
  );
}
