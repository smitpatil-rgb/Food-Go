import { NextResponse } from "next/server";
import { readSession, sameOrigin } from "@/lib/auth";
import { forbidden, unauthorized, validationError } from "@/lib/http";
import { moderateReview, recordAudit } from "@/lib/repository";
import { reviewModerationSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return forbidden();
  const staff = await readSession();
  if (!staff) return unauthorized();
  const parsed = reviewModerationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { id } = await params;
  const review = await moderateReview(id, parsed.data.status);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  await recordAudit(staff.id, "REVIEW_MODERATED", "Review", id, { status: parsed.data.status });
  return NextResponse.json({ review });
}
