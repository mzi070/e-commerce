import { lineTotalCents, sumCents } from "@/lib/money";

export interface CartLineInput {
  productId: string;
  quantity: number;
}

export interface PricedProduct {
  id: string;
  title: string;
  sku: string;
  priceCents: number;
  stock: number;
  images: string[];
}

export interface PricedLineItem {
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  image: string | null;
}

export interface PricedCart {
  items: PricedLineItem[];
  itemCount: number;
  subtotalCents: number;
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

/**
 * Server-side re-pricing guard. Accepts only product id + quantity from the
 * client and computes totals from authoritative product records.
 */
export function priceCartLines(
  lines: CartLineInput[],
  products: PricedProduct[],
): PricedCart {
  if (lines.length === 0) {
    return { items: [], itemCount: 0, subtotalCents: 0 };
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const pricedItems: PricedLineItem[] = [];
  let itemCount = 0;

  for (const line of lines) {
    const product = productById.get(line.productId);
    if (!product) {
      throw new PricingError("A product in your cart is no longer available.");
    }
    if (line.quantity < 1) {
      throw new PricingError("Quantity must be at least 1.");
    }
    if (line.quantity > product.stock) {
      throw new PricingError(
        `Only ${product.stock} of "${product.title}" available.`,
      );
    }

    itemCount += line.quantity;
    pricedItems.push({
      productId: product.id,
      title: product.title,
      sku: product.sku,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
      lineTotalCents: lineTotalCents(product.priceCents, line.quantity),
      image: product.images[0] ?? null,
    });
  }

  return {
    items: pricedItems,
    itemCount,
    subtotalCents: sumCents(pricedItems.map((item) => item.lineTotalCents)),
  };
}
