import { NextResponse } from "next/server";
import { SESSION_COOKIE, sameOrigin, signSession } from "@/lib/auth";
import { forbidden, validationError } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { authenticateStaff, recordAudit } from "@/lib/repository";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const ip = requestIp(request);
  const limit = rateLimit(`login:${ip}`, 8, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const staff = await authenticateStaff(parsed.data.email, parsed.data.password);
  if (!staff)
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  const response = NextResponse.json({
    staff: { name: staff.name, email: staff.email, role: staff.role }
  });
  response.cookies.set(SESSION_COOKIE, await signSession(staff), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  await recordAudit(staff.id, "STAFF_LOGIN", "Staff", staff.id, {}, ip);
  return response;
}
