"use client";

import { ArrowLeft, ArrowRight, Check, Crop, ImagePlus, Video, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CropDialog } from "@/features/frames/crop-dialog";
import { RoleCard } from "@/features/frames/role-card";
import { LanguageSwitch, useLang, type Key } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const participantRoles: Array<{ value: string; label: Key; hint: Key }> = [
  { value: "Film Director", label: "roleDirector", hint: "hintDirector" },
  { value: "Cinematographer", label: "roleCinematographer", hint: "hintCinematographer" },
  { value: "Academic / Lecturer", label: "roleAcademic", hint: "hintAcademic" },
  { value: "Film Student / Young Filmmaker", label: "roleStudent", hint: "hintStudent" }
];

/** Grabs the current camera frame (mirrored, like the preview) as an image URL. */
function frameToDataUrl(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const context = canvas.getContext("2d");
  if (!context) return "";
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function ParticipantForm({
  onBack,
  onContinue
}: {
  onBack: () => void;
  onContinue: (participant: { id: string; name: string; profession: string }) => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");
  const [source, setSource] = useState("");
  const [cropping, setCropping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canContinue = name.trim().length > 0 && role.length > 0 && !saving;

  const pickFile = () => fileInputRef.current?.click();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const loadFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSource(URL.createObjectURL(file));
    setCropping(true);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    loadFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const openLiveCamera = async () => {
    setCameraError("");
    setCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError(t("cameraError"));
    }
  };

  const closeLiveCamera = () => {
    stopCamera();
    setCameraOpen(false);
  };

  const captureLivePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    setSource(frameToDataUrl(video));
    setCropping(true);
    closeLiveCamera();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canContinue) return;

    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), profession: role, avatar: avatar || undefined })
      });
      if (!response.ok) throw new Error("Failed");
      const { participant } = await response.json();
      onContinue({ id: participant.id, name: name.trim(), profession: role });
    } catch {
      setSaveError(t("saveError"));
      setSaving(false);
    }
  };

  const secondaryButton =
    "inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-zinc-900 px-5 text-sm text-white transition hover:border-white/70 hover:bg-zinc-800";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <LanguageSwitch />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.06),transparent_55%)]" />

      <button
        type="button"
        onClick={onBack}
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white sm:left-8 sm:top-8"
      >
        <ArrowLeft size={16} /> {t("back")}
      </button>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-24 lg:py-6">
        <form onSubmit={submit} className="order-2 mx-auto w-full max-w-md lg:order-1 lg:mx-0">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-300">{t("beforeBegin")}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{t("createCard")}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {t("createCardHint")}
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <span className="mb-2 block text-sm font-medium text-zinc-200">{t("yourPhoto")}</span>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={pickFile} className={secondaryButton}>
                  <ImagePlus size={16} /> {avatar ? t("changePhoto") : t("uploadPhoto")}
                </button>
                <button type="button" onClick={openLiveCamera} className={secondaryButton}>
                  <Video size={16} /> {t("useCamera")}
                </button>
                {avatar && (
                  <>
                    <button type="button" onClick={() => setCropping(true)} className={secondaryButton}>
                      <Crop size={16} /> {t("crop")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSource("");
                        setAvatar("");
                      }}
                      className="inline-flex h-11 items-center rounded-full px-2 text-sm text-zinc-500 transition hover:text-white"
                    >
                      {t("remove")}
                    </button>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500">{t("photoOptional")}</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            </div>

            <div>
              <label htmlFor="participant-name" className="mb-2 block text-sm font-medium text-zinc-200">
                {t("yourName")}
              </label>
              <input
                id="participant-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 w-full rounded-lg border border-white/15 bg-zinc-900 px-4 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/25"
                placeholder={t("namePlaceholder")}
                autoComplete="name"
                maxLength={60}
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-zinc-200">{t("yourRole")}</legend>
              <div role="radiogroup" aria-label={t("yourRole")} className="grid grid-cols-2 gap-2.5">
                {participantRoles.map((item) => {
                  const active = role === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={t(item.hint)}
                      onClick={() => setRole(item.value)}
                      className={cn(
                        "relative flex min-h-14 items-center justify-center whitespace-pre-line rounded-lg border px-3 py-2 text-center text-sm font-medium leading-tight transition",
                        active
                          ? "border-white bg-white/15 text-white shadow-[0_0_24px_rgba(255,255,255,0.18)]"
                          : "border-white/12 bg-zinc-900 text-zinc-300 hover:border-white/30 hover:bg-zinc-800 hover:text-white"
                      )}
                    >
                      {t(item.label)}
                      {active && (
                        <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-white text-black">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {saveError && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {saveError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canContinue}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-medium text-black shadow-[0_0_36px_rgba(255,255,255,0.25)] transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {saving ? t("saving") : t("startStudy")} {!saving && <ArrowRight size={18} />}
          </button>
        </form>

        <div
          className={cn(
            "order-1 flex justify-center transition lg:sticky lg:top-8 lg:order-2",
            dragging && "scale-[1.02]"
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            loadFile(event.dataTransfer.files?.[0]);
          }}
        >
          <RoleCard name={name} role={role} avatar={avatar} onPhotoClick={pickFile} />
        </div>
      </div>

      {cropping && source && (
        <CropDialog
          src={source}
          onCancel={() => {
            setCropping(false);
            if (!avatar) setSource("");
          }}
          onDone={(url) => {
            setAvatar(url);
            setCropping(false);
          }}
        />
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-200">{t("liveCamera")}</p>
              <button
                type="button"
                onClick={closeLiveCamera}
                className="grid size-9 place-items-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
                aria-label={t("closeCamera")}
                title={t("closeCamera")}
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-zinc-900">
              {cameraError ? (
                <div className="grid size-full place-items-center px-6 text-center text-sm text-zinc-300">{cameraError}</div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" />
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeLiveCamera}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={captureLivePhoto}
                disabled={Boolean(cameraError)}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:pointer-events-none disabled:opacity-40"
              >
                {t("capture")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
