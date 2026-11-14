import { readVideoRange } from "@/lib/data";

export const dynamic = "force-dynamic";

// Each response stays under the host's response size limit; the player simply asks for the next part.
const MAX_PART = 4_000_000;

/** Streams an uploaded video with Range support, so players can seek and start quickly. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const header = request.headers.get("range");

  let start = 0;
  let requestedEnd = Number.POSITIVE_INFINITY;
  if (header) {
    const match = header.match(/^bytes=(\d*)-(\d*)$/);
    if (!match || (match[1] === "" && match[2] === "")) return new Response("Bad range", { status: 416 });
    start = match[1] === "" ? 0 : Number(match[1]);
    if (match[2] !== "") requestedEnd = Number(match[2]);
  }

  const first = await readVideoRange(id, start, Math.min(requestedEnd, start + MAX_PART - 1));
  if (!first) return new Response("Not found", { status: 404 });
  if (start >= first.size) {
    return new Response("Range not satisfiable", { status: 416, headers: { "Content-Range": `bytes */${first.size}` } });
  }

  return new Response(new Uint8Array(first.bytes), {
    status: 206,
    headers: {
      "Content-Type": first.contentType,
      "Content-Length": String(first.bytes.length),
      "Content-Range": `bytes ${first.start}-${first.end}/${first.size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
