import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { UserAuthForm } from "@/components/forms/user-auth-form";
import { Icons } from "@/components/shared/icons";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      {/* Radial glow blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute left-1/4 top-1/2 h-[300px] w-[400px] -translate-y-1/2 rounded-full bg-indigo-500/8 blur-[80px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Back button */}
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "absolute left-4 top-4 text-muted-foreground hover:text-violet-400 md:left-8 md:top-8",
        )}
      >
        <Icons.chevronLeft className="mr-2 size-4" />
        Back
      </Link>

      {/* Card */}
      <div className="mx-auto flex w-full max-w-[380px] flex-col justify-center space-y-6 rounded-2xl border border-border/50 bg-background/60 p-8 backdrop-blur-sm">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <span className="text-violet-400">✦</span>
            PostForge
          </div>
        </div>

        {/* Logo + heading */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <Icons.logo className="size-10 text-violet-500" />
          <h1 className="text-gradient_indigo-purple font-urban text-2xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in to your account
          </p>
        </div>

        {/* Form */}
        <Suspense>
          <UserAuthForm />
        </Suspense>

        {/* Sign up link */}
        <p className="px-4 text-center text-sm text-muted-foreground">
          <Link
            href="/register"
            className="underline underline-offset-4 transition-colors hover:text-violet-400"
          >
            Don&apos;t have an account? Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
