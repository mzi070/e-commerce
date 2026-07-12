import { NextResponse, type NextRequest } from "next/server";
import { fulfillSwipezPayment } from "@/lib/fulfillment";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limit = rateLimit(`swipe-webhook:${ip}`, 120, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, string>;

  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    payload = Object.fromEntries(
      Object.entries(json).map(([key, value]) => [key, String(value ?? "")]),
    );
  } else {
    const form = await request.formData();
    payload = Object.fromEntries(
      [...form.entries()].map(([key, value]) => [key, String(value)]),
    );
  }

  const referenceNo = payload.reference_no;
  const transactionId = payload.transaction_id;
  const status = payload.status;

  if (!referenceNo || !transactionId || !status) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const webhookId = `${transactionId}:${referenceNo}`;
  const eventLimit = rateLimit(`swipe-event:${webhookId}`, 1, 86_400_000);
  if (!eventLimit.allowed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await fulfillSwipezPayment(
      {
        reference_no: referenceNo,
        transaction_id: transactionId,
        status,
        amount: payload.amount ?? "",
        billing_email: payload.billing_email ?? "",
        billing_name: payload.billing_name,
        billing_mobile: payload.billing_mobile,
        billing_address: payload.billing_address,
        billing_city: payload.billing_city,
        billing_state: payload.billing_state,
        billing_postal_code: payload.billing_postal_code,
        checksum: payload.checksum,
      },
      webhookId,
    );
  } catch {
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
