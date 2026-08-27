import { NextResponse } from "next/server";
import { readSession, sameOrigin } from "@/lib/auth";
import { forbidden, unauthorized, validationError } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { createReview, listReviews } from "@/lib/repository";
import { reviewSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const all = new URL(request.url).searchParams.get("all") === "1";
  if (all && !(await readSession())) return unauthorized();
  return NextResponse.json({ reviews: await listReviews(all) });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  if (!rateLimit(`review:${requestIp(request)}`, 5, 60 * 60_000).allowed) {
    return NextResponse.json({ error: "Review limit reached. Please try later." }, { status: 429 });
  }
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const review = await createReview(parsed.data);
  return NextResponse.json(
    { review, message: "Thank you. Your review is awaiting moderation." },
    { status: 201 }
  );
}
