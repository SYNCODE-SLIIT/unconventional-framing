import { getFrameImage } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await getFrameImage(id);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.type,
      // The URL carries a version query, so it is safe to cache for a long time.
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
