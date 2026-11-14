import { FrameViewer } from "@/features/frames/frame-viewer";
import { getFrames } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <FrameViewer frames={await getFrames()} />;
}
