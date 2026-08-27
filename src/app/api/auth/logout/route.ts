import { NextResponse } from "next/server";
import { SESSION_COOKIE, sameOrigin } from "@/lib/auth";
import { forbidden } from "@/lib/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
