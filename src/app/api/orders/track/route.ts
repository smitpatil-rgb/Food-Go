import { NextResponse } from "next/server";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { trackOrder } from "@/lib/repository";
import { trackingSchema } from "@/lib/validation";
import { validationError } from "@/lib/http";

export async function POST(request: Request) {
  const limit = rateLimit(`track:${requestIp(request)}`, 30, 10 * 60_000);
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Too many tracking attempts. Please wait." },
      { status: 429 }
    );
  const parsed = trackingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const order = await trackOrder(parsed.data.orderNumber, parsed.data.phone);
  if (!order)
    return NextResponse.json(
      { error: "No order matches that ID and phone number." },
      { status: 404 }
    );
  return NextResponse.json({ order });
}
