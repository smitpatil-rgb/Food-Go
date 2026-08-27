import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { readSession } from "@/lib/auth";
import {
  dashboardSummary,
  listContacts,
  listMenu,
  listOrders,
  listReviews
} from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operations", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const staff = await readSession();
  if (!staff) redirect("/admin/login");
  const [initialSummary, initialOrders, initialMenu, initialReviews, initialMessages] =
    await Promise.all([
      dashboardSummary(),
      listOrders(),
      listMenu(true),
      listReviews(true),
      listContacts()
    ]);
  return (
    <AdminDashboard
      {...{ initialSummary, initialOrders, initialMenu, initialReviews, initialMessages, staff }}
    />
  );
}
