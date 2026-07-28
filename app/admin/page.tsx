import { StatisticsDashboard } from "@/features/admin/statistics-dashboard";
import { calculateStatistics } from "@/lib/mock-data";

export const metadata = {
  title: "Admin Dashboard"
};

export default function AdminPage() {
  return <StatisticsDashboard statistics={calculateStatistics()} />;
}
