"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import type { SectionProps } from "./types";
import { FieldRow, SaveButton, SectionCard, TextInput } from "./ui";

export function ResearchSection({ settings, saving, onSave }: SectionProps) {
  const [researchSubreddits, setResearchSubreddits] = useState(
    settings.research_subreddits ?? "entrepreneur,marketing,smallbusiness,SaaS",
  );
  const [youtubeRegion, setYoutubeRegion] = useState(
    settings.research_youtube_region ?? "US",
  );
  const [newsCategories, setNewsCategories] = useState(
    settings.research_news_categories ?? "business,technology",
  );
  const [blogAuthorName, setBlogAuthorName] = useState(
    settings.blog_author_name ?? "",
  );

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);

  async function saveResearch() {
    setLoading(true);
    setFeedback(null);
    try {
      await onSave({
        research_subreddits: researchSubreddits,
        research_youtube_region: youtubeRegion,
        research_news_categories: newsCategories,
        blog_author_name: blogAuthorName,
      });
      setFeedback("saved");
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Research & Blog"
      description="Configure research sources and Ghost CMS for blog publishing."
      icon={<Search size={15} style={{ color: "#6366f1" }} />}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <FieldRow label="Subreddits">
          <TextInput
            value={researchSubreddits}
            onChange={setResearchSubreddits}
            placeholder="entrepreneur,marketing,smallbusiness,SaaS"
          />
        </FieldRow>
        <FieldRow label="YouTube Region">
          <TextInput
            value={youtubeRegion}
            onChange={setYoutubeRegion}
            placeholder="US"
          />
        </FieldRow>
        <FieldRow label="News Categories">
          <TextInput
            value={newsCategories}
            onChange={setNewsCategories}
            placeholder="business,technology"
          />
        </FieldRow>
        <FieldRow label="Blog Author Name">
          <TextInput value={blogAuthorName} onChange={setBlogAuthorName} />
        </FieldRow>
        <SaveButton
          onClick={saveResearch}
          loading={loading || saving}
          feedback={feedback}
        />
      </div>
    </SectionCard>
  );
}
