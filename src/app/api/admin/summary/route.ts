import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { unauthorized } from "@/lib/http";
import { dashboardSummary } from "@/lib/repository";

export async function GET() {
  if (!(await readSession())) return unauthorized();
  return NextResponse.json({ summary: await dashboardSummary() });
}
