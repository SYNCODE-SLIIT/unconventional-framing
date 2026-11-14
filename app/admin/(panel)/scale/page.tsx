import { ScaleEditor } from "@/features/admin/scale-editor";
import { getScale, hasDatabase } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rating scale",
  robots: { index: false, follow: false }
};

export default async function AdminScalePage() {
  const scale = await getScale();
  return <ScaleEditor initial={scale} editable={hasDatabase} />;
}
