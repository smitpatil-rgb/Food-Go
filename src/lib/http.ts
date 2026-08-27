import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      error: "Please correct the highlighted fields.",
      fieldErrors: error.flatten().fieldErrors
    },
    { status: 422 }
  );
}

export function safeError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message =
    error instanceof Error && error.message.startsWith("Invalid status") ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 400 });
}

export const unauthorized = () =>
  NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
export const forbidden = () =>
  NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
