import { auth } from "@/auth";
import { db } from "@/lib/db";

export const GET = auth(async (req, context) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = await (context as unknown as { params: Promise<{ id: string }> }).params;

    const draft = await db.emailDraft.findUnique({
      where: { id },
      include: {
        blogPost: {
          select: { title: true, ghostUrl: true },
        },
      },
    });

    if (!draft) {
      return new Response("Not found", { status: 404 });
    }

    return Response.json(draft);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const PATCH = auth(async (req, context) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = await (context as unknown as { params: Promise<{ id: string }> }).params;

    const body = await req.json();
    const { subject, body: emailBody, suggestedPromos } = body as {
      subject?: string;
      body?: string;
      suggestedPromos?: string;
    };

    const updated = await db.emailDraft.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(emailBody !== undefined && { body: emailBody }),
        ...(suggestedPromos !== undefined && { suggestedPromos }),
      },
      include: {
        blogPost: {
          select: { title: true, ghostUrl: true },
        },
      },
    });

    return Response.json(updated);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
