import { describe, expect, it } from "vitest";
import { orderSchema, trackingSchema } from "@/lib/validation";

describe("validation", () => {
  it("normalizes a customer phone number", () => {
    const parsed = trackingSchema.parse({
      orderNumber: "fg-20260823-abc123",
      phone: "+91 98765 43210"
    });
    expect(parsed).toEqual({ orderNumber: "FG-20260823-ABC123", phone: "+919876543210" });
  });

  it("rejects empty orders and raw card-like payment values", () => {
    const result = orderSchema.safeParse({
      customerName: "A Guest",
      phone: "9876543210",
      deliveryAddress: "12 Market Street",
      paymentMethod: "CARD",
      idempotencyKey: crypto.randomUUID(),
      items: []
    });
    expect(result.success).toBe(false);
  });
});
