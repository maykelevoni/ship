"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Zurich",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Warsaw",
  "Europe/Kiev",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, "0")}:00`,
}));

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "reddit", label: "Reddit" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube Shorts" },
  { id: "email", label: "Email / Newsletter" },
];

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [claudeApiKey, setClaudeApiKey] = useState(
    initialSettings.claude_api_key ?? ""
  );
  const [geminiApiKey, setGeminiApiKey] = useState(
    initialSettings.gemini_api_key ?? ""
  );
  const [postBridgeApiKey, setPostBridgeApiKey] = useState(
    initialSettings.post_bridge_api_key ?? ""
  );
  const [resendApiKey, setResendApiKey] = useState(
    initialSettings.resend_api_key ?? ""
  );
  const [fromEmail, setFromEmail] = useState(initialSettings.from_email ?? "");
  const [timezone, setTimezone] = useState(
    initialSettings.timezone ?? "UTC"
  );
  const [gateMode, setGateMode] = useState(
    initialSettings.gate_mode === "true"
  );
  const [dailyRunHour, setDailyRunHour] = useState(
    initialSettings.daily_run_hour ?? "6"
  );

  const parseEnabledPlatforms = (): string[] => {
    try {
      const raw = initialSettings.enabled_platforms;
      if (!raw) return PLATFORMS.map((p) => p.id);
      return JSON.parse(raw);
    } catch {
      return PLATFORMS.map((p) => p.id);
    }
  };

  const [enabledPlatforms, setEnabledPlatforms] = useState<string[]>(
    parseEnabledPlatforms
  );

  const [saving, setSaving] = useState(false);

  function togglePlatform(id: string) {
    setEnabledPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        claude_api_key: claudeApiKey,
        gemini_api_key: geminiApiKey,
        post_bridge_api_key: postBridgeApiKey,
        resend_api_key: resendApiKey,
        from_email: fromEmail,
        timezone,
        gate_mode: String(gateMode),
        daily_run_hour: dailyRunHour,
        enabled_platforms: JSON.stringify(enabledPlatforms),
      };

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claude-api-key">Claude API Key</Label>
            <Input
              id="claude-api-key"
              type="password"
              placeholder="sk-ant-..."
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gemini-api-key">
              Gemini API Key{" "}
              <span className="text-muted-foreground text-sm font-normal">
                (image generation)
              </span>
            </Label>
            <Input
              id="gemini-api-key"
              type="password"
              placeholder="AIza..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-bridge-api-key">post-bridge API Key</Label>
            <Input
              id="post-bridge-api-key"
              type="password"
              placeholder="pb_..."
              value={postBridgeApiKey}
              onChange={(e) => setPostBridgeApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resend-api-key">Resend API Key</Label>
            <Input
              id="resend-api-key"
              type="password"
              placeholder="re_..."
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-email">From Email</Label>
            <Input
              id="from-email"
              type="email"
              placeholder="newsletter@yourdomain.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-run-hour">Daily Run Hour</Label>
            <Select value={dailyRunHour} onValueChange={setDailyRunHour}>
              <SelectTrigger id="daily-run-hour">
                <SelectValue placeholder="Select hour" />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The hour (0–23) at which the content engine runs each day.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Behaviour */}
      <Card>
        <CardHeader>
          <CardTitle>Behaviour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gate-mode">Gate Mode</Label>
              <p className="text-sm text-muted-foreground">
                Require manual approval before content is posted.
              </p>
            </div>
            <Switch
              id="gate-mode"
              checked={gateMode}
              onCheckedChange={setGateMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Enabled Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Enabled Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Select which platforms will receive generated content.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLATFORMS.map(({ id, label }) => (
              <div key={id} className="flex items-center space-x-2">
                <Checkbox
                  id={`platform-${id}`}
                  checked={enabledPlatforms.includes(id)}
                  onCheckedChange={() => togglePlatform(id)}
                />
                <Label
                  htmlFor={`platform-${id}`}
                  className="cursor-pointer font-normal"
                >
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
