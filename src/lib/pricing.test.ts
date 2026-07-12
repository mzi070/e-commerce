import { describe, expect, it } from "vitest";
import {
  priceCartLines,
  PricingError,
  type PricedProduct,
} from "@/lib/pricing";
import { dollarsToCents, formatCents, lineTotalCents, sumCents } from "@/lib/money";

const PRODUCTS: PricedProduct[] = [
  {
    id: "p1",
    title: "T-Shirt",
    sku: "TSHIRT-001",
    priceCents: 2499,
    stock: 10,
    images: [],
  },
  {
    id: "p2",
    title: "Mug",
    sku: "MUG-001",
    priceCents: 1400,
    stock: 2,
    images: [],
  },
];

describe("money helpers", () => {
  it("converts dollars to cents without float drift", () => {
    expect(dollarsToCents("24.99")).toBe(2499);
    expect(dollarsToCents(54.5)).toBe(5450);
  });

  it("formats cents for display", () => {
    expect(formatCents(2499)).toBe("24.99");
    expect(formatCents(1400)).toBe("14.00");
  });

  it("computes line totals and sums in integer cents", () => {
    expect(lineTotalCents(2499, 2)).toBe(4998);
    expect(sumCents([2499, 1400, 4998])).toBe(8897);
  });
});

describe("priceCartLines (server re-pricing guard)", () => {
  it("re-prices from authoritative product records", () => {
    const priced = priceCartLines(
      [
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 1 },
      ],
      PRODUCTS,
    );

    expect(priced.subtotalCents).toBe(6398);
    expect(priced.items[0]?.lineTotalCents).toBe(4998);
    expect(priced.items[1]?.unitPriceCents).toBe(1400);
  });

  it("rejects unknown product ids", () => {
    expect(() =>
      priceCartLines([{ productId: "missing", quantity: 1 }], PRODUCTS),
    ).toThrow(PricingError);
  });

  it("rejects quantities above available stock", () => {
    expect(() =>
      priceCartLines([{ productId: "p2", quantity: 5 }], PRODUCTS),
    ).toThrow(/Only 2/);
  });

  it("rejects empty product list with empty lines", () => {
    const priced = priceCartLines([], PRODUCTS);
    expect(priced.subtotalCents).toBe(0);
  });
});
