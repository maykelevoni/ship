import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  }

  const hashed = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
