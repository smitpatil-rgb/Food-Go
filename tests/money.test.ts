import { describe, expect, it } from "vitest";
import { calculateTotals, formatMoney } from "@/lib/money";

describe("money", () => {
  it("calculates all totals using integer minor units", () => {
    expect(calculateTotals([{ priceMinor: 34900, quantity: 2 }])).toEqual({
      subtotalMinor: 69800,
      deliveryFeeMinor: 4900,
      taxMinor: 3490,
      totalMinor: 78190
    });
  });

  it("waives delivery at the threshold", () => {
    expect(calculateTotals([{ priceMinor: 50000, quantity: 2 }]).deliveryFeeMinor).toBe(0);
  });

  it("formats INR without exposing floating point math to business logic", () => {
    expect(formatMoney(34900)).toContain("349");
  });
});
