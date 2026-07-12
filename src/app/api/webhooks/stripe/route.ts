import { NextResponse, type NextRequest } from "next/server";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfillment";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limit = rateLimit(`stripe-webhook:${ip}`, 120, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Dedupe by event id before processing.
  const eventLimit = rateLimit(`stripe-event:${event.id}`, 1, 86_400_000);
  if (!eventLimit.allowed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await fulfillCheckoutSession(session, event.id);
    }
  } catch {
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
