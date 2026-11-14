export type ParsedVideo = { kind: "youtube"; id: string } | { kind: "file"; url: string };

/** Understands a YouTube link (watch, short or embed) or a direct link to a video file. */
export function parseVideo(url: string): ParsedVideo {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id) return { kind: "youtube", id };
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const watch = parsed.searchParams.get("v");
      if (watch) return { kind: "youtube", id: watch };
      const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
      if (match) return { kind: "youtube", id: match[1] };
    }
  } catch {
    // Not a valid URL: treat it as a file link and let the player report a problem.
  }
  return { kind: "file", url };
}

export function youtubeEmbedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1`;
}
