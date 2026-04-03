import crypto from "crypto";

import { db } from "@/lib/db";

// Map Polar product IDs to plan names
const PRODUCT_PLAN_MAP: Record<string, string> = {
  [process.env.POLAR_STARTER_PRODUCT_ID ?? ""]: "starter",
  [process.env.POLAR_PRO_PRODUCT_ID ?? ""]: "pro",
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("webhook-signature") ?? "";

  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret)
    return new Response("Webhook secret not configured", { status: 500 });

  // Polar uses standard webhook signature: "v1=<hex>"
  const expectedSig =
    "v1=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  ) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const { type, data } = event;

  if (type === "subscription.created" || type === "subscription.updated") {
    const email = data.user?.email;
    const productId = data.product_id;
    const expiresAt = data.current_period_end
      ? new Date(data.current_period_end)
      : null;
    const plan = PRODUCT_PLAN_MAP[productId] ?? "starter";

    if (email) {
      await db.user.updateMany({
        where: { email },
        data: {
          plan,
          polarCustomerId: data.user?.id ?? null,
          planExpiresAt: expiresAt,
        },
      });
    }
  }

  if (type === "subscription.canceled" || type === "subscription.revoked") {
    const email = data.user?.email;
    if (email) {
      await db.user.updateMany({
        where: { email },
        data: { plan: "free", planExpiresAt: null },
      });
    }
  }

  return Response.json({ received: true });
}
