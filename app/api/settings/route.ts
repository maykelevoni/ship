import { auth } from "@/auth";
import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const settings = await db.setting.findMany();
    const result = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return Response.json(result);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const body = await req.json();

    if (typeof body !== "object" || body === null) {
      return new Response("Invalid body", { status: 400 });
    }

    const entries = Object.entries(body) as [string, string][];

    await Promise.all(
      entries.map(([key, value]) =>
        db.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return Response.json({ ok: true });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
