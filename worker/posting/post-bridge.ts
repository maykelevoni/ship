import fs from "fs";
import path from "path";

import { getSetting } from "../../lib/settings";

const BASE_URL = "https://api.post-bridge.com";

type Platform =
  | "twitter"
  | "linkedin"
  | "reddit"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "bluesky"
  | "threads";

async function getAuthHeader(userId: string): Promise<string> {
  const apiKey = await getSetting("postbridge_api_key", userId);
  if (!apiKey) {
    throw new Error("postbridge_api_key is not configured in settings");
  }
  return `Bearer ${apiKey}`;
}

// Fetch connected social accounts and return the first one matching the platform
async function getSocialAccountId(
  platform: Platform,
  authHeader: string,
): Promise<number> {
  const res = await fetch(`${BASE_URL}/v1/social-accounts`, {
    headers: { Authorization: authHeader },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `post-bridge /v1/social-accounts failed (${res.status}): ${text}`,
    );
  }
  const { data } = (await res.json()) as {
    data: { id: number; platform: string; username: string }[];
  };
  const match = data.find((a) => a.platform === platform);
  if (!match) {
    throw new Error(
      `No post-bridge social account connected for platform: ${platform}`,
    );
  }
  return match.id;
}

async function uploadMedia(
  mediaPath: string,
  authHeader: string,
): Promise<string> {
  const fileBuffer = fs.readFileSync(mediaPath);
  const ext = path.extname(mediaPath).toLowerCase();
  const mimeType = ext === ".mp4" ? "video/mp4" : "image/png";
  const fileName = path.basename(mediaPath);

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append("file", blob, fileName);

  const response = await fetch(`${BASE_URL}/v1/media`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `post-bridge media upload failed (${response.status}): ${text}`,
    );
  }

  const data = await response.json();
  return data.id as string;
}

async function doPostRequest(
  socialAccountId: number,
  content: string,
  mediaId: string | undefined,
  scheduledAt: Date | undefined,
  authHeader: string,
): Promise<{ id: string; status: string }> {
  const body: Record<string, unknown> = {
    caption: content,
    social_accounts: [socialAccountId],
  };

  if (mediaId) {
    body.media_ids = [mediaId];
  }

  if (scheduledAt) {
    body.scheduled_at = scheduledAt.toISOString();
  }

  const response = await fetch(`${BASE_URL}/v1/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    // Rate limited — wait 5 seconds and retry once
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const retry = await fetch(`${BASE_URL}/v1/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!retry.ok) {
      const text = await retry.text();
      throw new Error(
        `post-bridge postToPlatform retry failed (${retry.status}): ${text}`,
      );
    }

    const retryData = await retry.json();
    return {
      id: String(retryData.id ?? retryData.data?.id ?? ""),
      status: (retryData.status as string) ?? "scheduled",
    };
  }

  if (response.status === 401) {
    throw new Error("post-bridge API key is invalid or unauthorized (401)");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `post-bridge postToPlatform failed (${response.status}): ${text}`,
    );
  }

  const data = await response.json();
  const id = data.id ?? data.data?.id ?? data.data?.[0]?.id;
  return {
    id: String(id ?? ""),
    status: (data.status as string) ?? "scheduled",
  };
}

export async function postToPlatform(params: {
  platform: Platform;
  content: string;
  mediaPath?: string;
  scheduledAt?: Date;
}): Promise<{ id: string; status: string }> {
  const authHeader = await getAuthHeader();
  const socialAccountId = await getSocialAccountId(params.platform, authHeader);

  let mediaId: string | undefined;
  if (params.mediaPath) {
    mediaId = await uploadMedia(params.mediaPath, authHeader);
  }

  return doPostRequest(
    socialAccountId,
    params.content,
    mediaId,
    params.scheduledAt,
    authHeader,
  );
}

export async function listSocialAccounts(): Promise<
  { id: number; platform: string; username: string }[]
> {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/v1/social-accounts`, {
    headers: { Authorization: authHeader },
  });
  if (!res.ok) return [];
  const { data } = (await res.json()) as {
    data: { id: number; platform: string; username: string }[];
  };
  return data ?? [];
}
