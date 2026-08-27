import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import type { StaffSession } from "./domain";

export const SESSION_COOKIE = "foodgo_staff_session";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required");
  return new TextEncoder().encode(value || "development-only-foodgo-secret-please-change");
}

export async function signSession(staff: StaffSession) {
  return new SignJWT({ name: staff.name, email: staff.email, role: staff.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(staff.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function readSession(): Promise<StaffSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (
      !payload.sub ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      !["OWNER", "MANAGER", "KITCHEN"].includes(String(payload.role))
    ) {
      return null;
    }
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role as StaffSession["role"]
    };
  } catch {
    return null;
  }
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
