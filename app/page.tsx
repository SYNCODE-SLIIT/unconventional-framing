import { FrameViewer } from "@/features/frames/frame-viewer";
import { frames } from "@/lib/mock-data";

export default function Home() {
  return <FrameViewer frames={frames} />;
}
