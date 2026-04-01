// Shared types for settings section components

export interface SettingsData {
  anthropic_api_key: string | null;
  gemini_api_key: string | null;
  openrouter_api_key: string | null;
  openrouter_model: string | null;
  postbridge_api_key: string | null;
  enabled_platforms: string | null;
  brevo_api_key: string | null;
  brevo_sender_email: string | null;
  brevo_sender_name: string | null;
  brevo_to_email: string | null;
  brevo_smtp_key: string | null;
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
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
}

export interface SectionProps {
  settings: SettingsData;
  saving: boolean;
  onSave: (patch: Partial<SettingsData>) => Promise<void>;
}
