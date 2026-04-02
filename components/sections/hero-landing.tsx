import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

const pipelineSteps = [
  { label: "Research", icon: "🔍", color: "text-sky-400" },
  { label: "Generate", icon: "✦", color: "text-violet-400" },
  { label: "Schedule", icon: "◷", color: "text-indigo-400" },
  { label: "Post", icon: "↗", color: "text-emerald-400" },
];

export default function HeroLanding() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="bg-indigo-500/8 absolute left-1/4 top-1/2 h-[300px] w-[400px] -translate-y-1/2 rounded-full blur-[80px]" />
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

      <div className="container flex max-w-5xl flex-col items-center gap-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
          Self-hosted · Single user · Full automation
        </div>

        {/* Headline */}
        <h1 className="text-balance font-urban text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-[68px]">
          Your content engine.{" "}
          <span className="text-gradient_indigo-purple">
            One prompt, every platform.
          </span>
        </h1>

        <p className="max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
          AI pipeline that researches, writes, creates images, schedules, and
          posts — fully automated or gate-reviewed. You decide when it runs.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            prefetch={true}
            className={cn(
              buttonVariants({ size: "lg", rounded: "full" }),
              "gap-2 bg-violet-600 text-white hover:bg-violet-500",
            )}
          >
            <span>Get started</span>
            <Icons.arrowRight className="size-4" />
          </Link>
          <Link
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({
                variant: "outline",
                size: "lg",
                rounded: "full",
              }),
              "gap-2 border-border/60 px-5",
            )}
          >
            <Icons.gitHub className="size-4" />
            <span>View on GitHub</span>
          </Link>
        </div>

        {/* Pipeline flow */}
        <div className="mt-4 flex items-center gap-0 rounded-2xl border border-border/50 bg-background/60 px-2 py-2 backdrop-blur-sm sm:gap-0 sm:px-4 sm:py-3">
          {pipelineSteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 px-3 sm:px-5">
                <span className={cn("text-xl sm:text-2xl", step.color)}>
                  {step.icon}
                </span>
                <span className="text-xs font-medium tracking-wide text-muted-foreground sm:text-sm">
                  {step.label}
                </span>
              </div>
              {i < pipelineSteps.length - 1 && (
                <div className="flex items-center gap-0.5 pb-4">
                  <span className="h-px w-4 bg-border/60 sm:w-6" />
                  <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-violet-400/70" />
                  <span className="h-px w-4 bg-border/60 sm:w-6" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stack note */}
        <p className="text-xs text-muted-foreground/60">
          Powered by Claude AI · Gemini Images · Remotion Video · Runs on a
          $10/mo VPS
        </p>
      </div>
    </section>
  );
}
