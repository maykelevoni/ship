"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

import { env } from "@/env.mjs";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only",
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  posthog.capture(name, props);
}
