import { FrameViewer } from "@/features/frames/frame-viewer";
import { getFrames, getScale } from "@/lib/data";
import { LanguageProvider } from "@/lib/i18n";
import type { Frame } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function Home() {
  let frames: Frame[] = [];
  try {
    frames = await getFrames();
  } catch (error) {
    // Keep the landing page up even if the database is unreachable; the viewer shows a friendly message.
    console.error("Could not load frames", error);
  }
  const scale = await getScale();
  return (
    <LanguageProvider>
      <FrameViewer frames={frames} scale={scale} />
    </LanguageProvider>
  );
}
