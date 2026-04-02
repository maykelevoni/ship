import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

const pipelineRun = [
  {
    step: "Research",
    status: "done",
    detail: "27 signals · YouTube, Reddit, HN, News",
    time: "0:12",
  },
  {
    step: "Generate",
    status: "done",
    detail: "7 pieces · Twitter, LinkedIn, Blog, Email, TikTok",
    time: "0:38",
  },
  {
    step: "Images",
    status: "done",
    detail: "6 images · Gemini API",
    time: "0:51",
  },
  {
    step: "Video",
    status: "done",
    detail: "1 render · Remotion 1080×1920",
    time: "1:24",
  },
  {
    step: "Schedule",
    status: "active",
    detail: "Queued for 9:00 AM · Gate mode ON",
    time: "—",
  },
];

const platforms = [
  { name: "Twitter", color: "bg-sky-500", count: "1 thread" },
  { name: "LinkedIn", color: "bg-blue-600", count: "1 article" },
  { name: "Reddit", color: "bg-orange-500", count: "1 post" },
  { name: "Instagram", color: "bg-pink-500", count: "1 caption" },
  { name: "TikTok", color: "bg-slate-200", count: "1 video" },
  { name: "Blog", color: "bg-emerald-500", count: "1 post" },
  { name: "Email", color: "bg-violet-500", count: "1 newsletter" },
];

export default function PreviewLanding() {
  return (
    <div className="pb-6 sm:pb-16">
      <MaxWidthWrapper>
        <div className="rounded-xl md:bg-muted/30 md:p-3.5 md:ring-1 md:ring-inset md:ring-border">
          {/* Dashboard mockup */}
          <div className="overflow-hidden rounded-xl border bg-[#0d0d0d]">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-border/40 bg-[#111111] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                PostForge · Engine Run #47 · Today 06:00 AM
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Completed
              </span>
            </div>

            <div className="grid grid-cols-1 divide-y divide-border/30 md:grid-cols-[1fr_220px] md:divide-x md:divide-y-0">
              {/* Pipeline steps */}
              <div className="p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Pipeline
                </p>
                <div className="space-y-2">
                  {pipelineRun.map((item, i) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-3 rounded-lg border border-border/30 bg-[#161616] px-4 py-3"
                    >
                      {/* Icon */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          item.status === "done"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-violet-500/20 text-violet-400"
                        }`}
                      >
                        {item.status === "done" ? "✓" : "○"}
                      </div>
                      {/* Label */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground/90">
                            {item.step}
                          </span>
                          {item.status === "active" && (
                            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
                      {/* Time */}
                      <span className="shrink-0 font-mono text-xs text-muted-foreground/50">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform output */}
              <div className="p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Output
                </p>
                <div className="space-y-2">
                  {platforms.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-3 rounded-lg border border-border/30 bg-[#161616] px-3 py-2.5"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${p.color}`}
                      />
                      <span className="flex-1 text-sm text-foreground/80">
                        {p.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.count}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 text-center">
                  <p className="text-xs text-violet-300">
                    Gate mode — awaiting review
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
