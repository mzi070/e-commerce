"use client";

import { useEffect } from "react";
import { useCart } from "@/components/providers/cart-provider";

/** Clears the local cart once the customer reaches the confirmation page. */
export function ClearCartOnMount() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
