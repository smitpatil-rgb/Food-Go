import { NextResponse } from "next/server";
import { readSession, sameOrigin } from "@/lib/auth";
import { forbidden, safeError, unauthorized, validationError } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { createOrder, listOrders } from "@/lib/repository";
import { orderSchema } from "@/lib/validation";

export async function GET() {
  if (!(await readSession())) return unauthorized();
  return NextResponse.json({ orders: await listOrders() });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const limit = rateLimit(`order:${requestIp(request)}`, 10, 10 * 60_000);
  if (!limit.allowed)
    return NextResponse.json({ error: "Too many order attempts. Please wait." }, { status: 429 });
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  try {
    const order = await createOrder(parsed.data);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return safeError(error, "We could not place the order. Your cart is still saved.");
  }
}
