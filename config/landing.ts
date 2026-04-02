import { FeatureLdg, InfoLdg, TestimonialType } from "types";

export const infos: InfoLdg[] = [
  {
    title: "Full pipeline, zero manual work",
    description:
      "Define a niche or product once. PostForge handles everything else — finding what's trending, writing platform-native content, generating images, and scheduling posts across every channel without you lifting a finger.",
    image: "/_static/illustrations/work-from-home.jpg",
    list: [
      {
        title: "Research-first",
        description:
          "Scans YouTube, Reddit, HN, Google Trends, and News APIs to find what your audience is already engaging with.",
        icon: "search",
      },
      {
        title: "Parallel generation",
        description:
          "Claude writes a master long-form piece, then repurposes it simultaneously into every platform format — threads, posts, captions, scripts.",
        icon: "post",
      },
      {
        title: "Gate or automate",
        description:
          "Gate mode holds every piece for your review before publishing. Toggle it off for fully hands-free distribution.",
        icon: "settings",
      },
    ],
  },
  {
    title: "Every platform, one place",
    description:
      "One engine that speaks every platform's language. From 280-character threads to 10-minute YouTube scripts, vertical TikTok videos to long-form blog posts — all scheduled, staggered, and tracked in a single calendar.",
    image: "/_static/illustrations/work-from-home.jpg",
    list: [
      {
        title: "Social + Video",
        description:
          "Twitter, LinkedIn, Reddit, Instagram, and TikTok — with Remotion-rendered vertical videos posted via PostBridge.",
        icon: "media",
      },
      {
        title: "Email + Blog",
        description:
          "Newsletter sequences via Brevo and long-form posts published directly to your Ghost CMS instance.",
        icon: "messages",
      },
      {
        title: "Self-hosted",
        description:
          "Runs on a $10/mo Hetzner VPS and a free Neon database. Your content, your infrastructure, no SaaS lock-in.",
        icon: "laptop",
      },
    ],
  },
];

export const features: FeatureLdg[] = [
  {
    title: "Research Engine",
    description:
      "Automatically surfaces trending topics from YouTube, Reddit, Hacker News, Google Trends, and NewsAPI — filtered to your niche.",
    link: "/login",
    icon: "search",
  },
  {
    title: "Claude AI Writing",
    description:
      "Generates platform-native content with claude-sonnet-4-6: blog posts, Twitter threads, LinkedIn articles, Reddit posts, and email newsletters in one run.",
    link: "/login",
    icon: "post",
  },
  {
    title: "Gemini Image Generation",
    description:
      "Creates on-brand social images for every post using Google Gemini. No Puppeteer, no headless browser — pure API generation.",
    link: "/login",
    icon: "media",
  },
  {
    title: "Smart Scheduler",
    description:
      "Staggered daily schedule: 9am Twitter, 10am LinkedIn, 11am Video, 12pm Reddit, 2pm Instagram, 5pm Email. Failed posts retry once after 30 minutes.",
    link: "/login",
    icon: "settings",
  },
  {
    title: "Email Sequences",
    description:
      "Connects to Brevo for subscriber management and newsletter delivery. Ghost handles subscriber acquisition; Brevo handles all email execution.",
    link: "/login",
    icon: "messages",
  },
  {
    title: "Media Studio",
    description:
      "Gallery of every generated image and rendered video. Remotion produces 1080×1920 vertical MP4s automatically from your content scripts.",
    link: "/login",
    icon: "laptop",
  },
];

export const testimonials: TestimonialType[] = [
  {
    name: "Automated pipeline",
    job: "Research → Generate → Schedule → Post",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    review:
      "PostForge takes a single niche keyword and turns it into a week of content across every major platform. The research step alone saves hours — it pulls what's actually trending before writing a single word.",
  },
  {
    name: "Self-hosted freedom",
    job: "Your VPS, your rules",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
    review:
      "No monthly SaaS fees. Runs on a $10 Hetzner VPS with a free Neon database. Docker Compose up and you're live — all API keys managed through the Settings UI.",
  },
  {
    name: "Gate mode",
    job: "Review before publishing",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
    review:
      "Gate mode is the killer feature for me. The engine generates everything on schedule, but nothing goes live until I approve it. Full automation with a human checkpoint.",
  },
  {
    name: "Gemini images",
    job: "On-brand visuals, zero effort",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
    review:
      "Every post gets a generated image via Gemini API — square format for social, text overlay for quotes. The media studio shows the full gallery so you can review before anything goes out.",
  },
  {
    name: "Brevo + Ghost",
    job: "Newsletter + Blog publishing",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    review:
      "The Ghost integration publishes blog posts automatically. Brevo handles the newsletter sequences. Setup once, it runs every day.",
  },
  {
    name: "TikTok video",
    job: "Remotion-rendered verticals",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    review:
      "1080×1920 vertical videos rendered with Remotion from your content scripts, posted to TikTok, YouTube Shorts, and Instagram Reels. Content that would take a team, done by one process.",
  },
];
