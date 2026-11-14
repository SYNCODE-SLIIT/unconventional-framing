import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

const MAX_BYTES = 500 * 1024 * 1024;

/**
 * Hands the admin's browser a short-lived token to upload a video straight to Vercel Blob storage.
 * The file never passes through this server, so large videos work.
 * Requires a Blob store to be connected to the project (BLOB_READ_WRITE_TOKEN).
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Video upload is not set up. Connect a Blob store in Vercel." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Only a signed-in admin may ask for an upload token. (Vercel's own completion callback is verified by handleUpload.)
  if (body.type === "blob.generate-client-token") {
    const store = await cookies();
    if (!(await verifySessionToken(store.get(ADMIN_COOKIE)?.value))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime"],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true
      }),
      onUploadCompleted: async () => {}
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
