import type { Metadata } from "next";
import { AdminMarketingDashboard } from "@/components/admin/AdminMarketingDashboard";

export const metadata: Metadata = { title: "Admin — Marketing", robots: { index: false, follow: false } };

export default function AdminMarketingPage() {
  return <AdminMarketingDashboard />;
}
