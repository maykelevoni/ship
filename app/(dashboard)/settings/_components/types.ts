// Shared types for settings section components

export interface SettingsData {
  gemini_api_key: string | null;
  openrouter_api_key: string | null;
  openrouter_model: string | null;
  postbridge_api_key: string | null;
  enabled_platforms: string | null;
  timezone: string | null;
  gate_mode: string | null;
  daily_run_hour: string | null;
  youtube_api_key: string | null;
  newsapi_key: string | null;
  ghost_url: string | null;
  ghost_admin_api_key: string | null;
  research_subreddits: string | null;
  research_youtube_region: string | null;
  research_news_categories: string | null;
  blog_author_name: string | null;
  elevenlabs_api_key: string | null;
  elevenlabs_voice_id: string | null;
  replicate_api_key: string | null;
  amazon_affiliate_tag: string | null;
  amazon_paapi_key: string | null;
  amazon_paapi_secret: string | null;
  clickbank_api_key: string | null;
  clickbank_account: string | null;
  systeme_domain: string | null;
  systeme_default_funnel_url: string | null;
  systeme_api_key: string | null;
  video_generation_enabled: string | null;
}

export interface SectionProps {
  settings: SettingsData;
  saving: boolean;
  onSave: (patch: Partial<SettingsData>) => Promise<void>;
}
