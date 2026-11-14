import { FramesManager } from "@/features/admin/frames-manager";
import { getAdminFrames, hasDatabase } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage frames",
  robots: { index: false, follow: false }
};

export default async function AdminFramesPage() {
  const frames = await getAdminFrames();
  return <FramesManager frames={frames} editable={hasDatabase} />;
}
