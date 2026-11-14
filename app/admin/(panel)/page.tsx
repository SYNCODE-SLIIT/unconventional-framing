import { StatisticsDashboard } from "@/features/admin/statistics-dashboard";
import { getDeletedParticipants, getParticipants, getStatistics } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false }
};

export default async function AdminPage() {
  const [statistics, participants, deleted] = await Promise.all([getStatistics(), getParticipants(), getDeletedParticipants()]);
  return <StatisticsDashboard statistics={statistics} participants={participants} deleted={deleted} />;
}
