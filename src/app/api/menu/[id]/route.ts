import { NextResponse } from "next/server";
import { readSession, sameOrigin } from "@/lib/auth";
import { forbidden, unauthorized, validationError } from "@/lib/http";
import { deactivateMenuItem, recordAudit, saveMenuItem } from "@/lib/repository";
import { menuItemSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return forbidden();
  const staff = await readSession();
  if (!staff) return unauthorized();
  const parsed = menuItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { id } = await params;
  const item = await saveMenuItem(parsed.data, id);
  await recordAudit(staff.id, "MENU_ITEM_UPDATED", "MenuItem", id, {
    name: item.name,
    active: item.active
  });
  return NextResponse.json({ item });
}

export async function DELETE(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return forbidden();
  const staff = await readSession();
  if (!staff) return unauthorized();
  const { id } = await params;
  const item = await deactivateMenuItem(id);
  if (!item) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  await recordAudit(staff.id, "MENU_ITEM_DEACTIVATED", "MenuItem", id, { name: item.name });
  return NextResponse.json({ item });
}
