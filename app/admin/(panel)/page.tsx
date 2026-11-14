import { StatisticsDashboard } from "@/features/admin/statistics-dashboard";
import { getParticipants, getScale, getStatistics } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false }
};

export default async function AdminPage() {
  const [statistics, participants, scale] = await Promise.all([getStatistics(), getParticipants(), getScale()]);
  return <StatisticsDashboard statistics={statistics} participants={participants} scale={scale} />;
}
