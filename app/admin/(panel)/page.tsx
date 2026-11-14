import { StatisticsDashboard } from "@/features/admin/statistics-dashboard";
import { getParticipants, getStatistics } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false }
};

export default async function AdminPage() {
  const [statistics, participants] = await Promise.all([getStatistics(), getParticipants()]);
  return <StatisticsDashboard statistics={statistics} participants={participants} />;
}
