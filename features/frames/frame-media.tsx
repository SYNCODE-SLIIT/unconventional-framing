"use client";

import Image from "next/image";
import { parseVideo, youtubeEmbedUrl } from "@/lib/video";
import type { Frame } from "@/types/domain";

/** Fills its 16:9 parent with the frame: a picture, or a video player when the frame is a video. */
export function FrameMedia({ frame, priority = false }: { frame: Frame; priority?: boolean }) {
  if (frame.video) {
    const video = parseVideo(frame.video);

    if (video.kind === "youtube") {
      return (
        <iframe
          key={frame.id}
          src={youtubeEmbedUrl(video.id)}
          title={`${frame.movie} at ${frame.timecode}`}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0 bg-black"
        />
      );
    }

    return (
      <video
        key={frame.id}
        src={video.url}
        poster={frame.frameImage}
        controls
        playsInline
        preload="metadata"
        onClick={(event) => event.stopPropagation()}
        className="absolute inset-0 size-full bg-black object-contain"
      />
    );
  }

  return (
    <Image
      priority={priority}
      fill
      unoptimized={frame.frameImage.startsWith("/api/") || frame.frameImage.startsWith("data:")}
      src={frame.frameImage}
      alt={`${frame.movie} frame at ${frame.timecode}`}
      className="object-contain"
      sizes="100vw"
    />
  );
}
