import { NextRequest } from "next/server";
import { PostHog } from "posthog-node";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      console.warn(
        "[stripe webhook] Missing stripe_secret_key or stripe_webhook_secret in settings",
      );
      return new Response("OK", { status: 200 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      console.warn("[stripe webhook] Missing stripe-signature header");
      return new Response("OK", { status: 200 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("[stripe webhook] Signature verification failed:", err);
      return new Response("OK", { status: 200 });
    }

    if (event.type !== "checkout.session.completed") {
      // No-op for other event types
      return new Response("OK", { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const promotionId = session.metadata?.promotionId ?? null;
    const amountTotal = session.amount_total ?? 0;

    const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });

    await client.capture({
      distinctId: "system",
      event: "sale",
      properties: {
        platform: "stripe",
        sessionId,
        promotionId,
        amount: amountTotal / 100,
      },
    });

    await client.shutdown();
  } catch (err) {
    console.error("[stripe webhook] Error:", err);
  }

  return new Response("OK", { status: 200 });
}
