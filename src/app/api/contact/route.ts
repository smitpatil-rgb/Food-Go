import { NextResponse } from "next/server";
import { readSession, sameOrigin } from "@/lib/auth";
import { forbidden, unauthorized, validationError } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { createContact, listContacts } from "@/lib/repository";
import { contactSchema } from "@/lib/validation";

export async function GET() {
  if (!(await readSession())) return unauthorized();
  return NextResponse.json({ messages: await listContacts() });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  if (!rateLimit(`contact:${requestIp(request)}`, 5, 60 * 60_000).allowed) {
    return NextResponse.json(
      { error: "Message limit reached. Please try later." },
      { status: 429 }
    );
  }
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const message = await createContact(parsed.data);
  return NextResponse.json({ message, success: "Your message is with our team." }, { status: 201 });
}
