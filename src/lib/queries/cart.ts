import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export interface CartLineItem {
  productId: string;
  title: string;
  sku: string;
  unitPrice: string;
  lineTotal: string;
  quantity: number;
  stock: number;
  image: string | null;
}

export interface CartView {
  items: CartLineItem[];
  itemCount: number;
  total: string;
}

const EMPTY_CART: CartView = { items: [], itemCount: 0, total: "0.00" };

/**
 * Load the current user's cart with product details and server-computed
 * totals. Prices are serialized to strings so the result is safe to pass to
 * client components.
 */
export async function getCartForUser(userId: string): Promise<CartView> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return EMPTY_CART;
  }

  let itemCount = 0;
  let total = new Prisma.Decimal(0);
  const items: CartLineItem[] = cart.items.map((item) => {
    const lineTotal = item.product.price.mul(item.quantity);
    itemCount += item.quantity;
    total = total.add(lineTotal);
    return {
      productId: item.productId,
      title: item.product.title,
      sku: item.product.sku,
      unitPrice: item.product.price.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      quantity: item.quantity,
      stock: item.product.stock,
      image: item.product.images[0] ?? null,
    };
  });

  return { items, itemCount, total: total.toFixed(2) };
}
