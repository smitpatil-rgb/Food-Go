import { NextResponse } from "next/server";
import { readSession, sameOrigin } from "@/lib/auth";
import { forbidden, unauthorized, validationError } from "@/lib/http";
import { listMenu, recordAudit, saveMenuItem } from "@/lib/repository";
import { menuItemSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const all = new URL(request.url).searchParams.get("all") === "1";
  if (all && !(await readSession())) return unauthorized();
  return NextResponse.json({ items: await listMenu(all) });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const staff = await readSession();
  if (!staff) return unauthorized();
  const parsed = menuItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const item = await saveMenuItem(parsed.data);
  await recordAudit(staff.id, "MENU_ITEM_CREATED", "MenuItem", item.id, { name: item.name });
  return NextResponse.json({ item }, { status: 201 });
}
