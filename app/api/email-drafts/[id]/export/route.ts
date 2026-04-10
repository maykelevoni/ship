import { auth } from "@/auth";
import { db } from "@/lib/db";

export const POST = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user!.id as string;
  const { id } = await params;

  const draft = await db.emailDraft.findUnique({
    where: { id },
  });

  if (!draft || draft.userId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  await db.emailDraft.update({
    where: { id },
    data: { exportedAt: new Date() },
  });

  return Response.json({
    subject: draft.subject,
    body: draft.body,
  });
});
