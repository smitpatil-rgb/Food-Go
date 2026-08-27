import { NextResponse } from "next/server";
import { readSession, sameOrigin } from "@/lib/auth";
import { forbidden, safeError, unauthorized, validationError } from "@/lib/http";
import { recordAudit, updateOrderStatus } from "@/lib/repository";
import { statusSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  if (!sameOrigin(request)) return forbidden();
  const staff = await readSession();
  if (!staff) return unauthorized();
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  try {
    const { orderNumber } = await params;
    const order = await updateOrderStatus(orderNumber, parsed.data.status, parsed.data.note);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    await recordAudit(staff.id, "ORDER_STATUS_CHANGED", "Order", order.id, {
      orderNumber,
      status: parsed.data.status
    });
    return NextResponse.json({ order });
  } catch (error) {
    return safeError(error);
  }
}
