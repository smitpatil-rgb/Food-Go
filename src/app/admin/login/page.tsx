import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin-login";
import { readSession } from "@/lib/auth";

export const metadata = { title: "Staff sign-in", robots: { index: false, follow: false } };
export default async function AdminLoginPage() {
  if (await readSession()) redirect("/admin");
  return <AdminLogin />;
}
