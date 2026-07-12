"use client";

import { useEffect, useRef } from "react";
import type { SwipezCheckoutFields } from "@/lib/swipe";

export function SwipezPaymentForm({
  actionUrl,
  fields,
}: {
  actionUrl: string;
  fields: SwipezCheckoutFields;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} method="post" action={actionUrl} className="hidden">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </form>
  );
}
