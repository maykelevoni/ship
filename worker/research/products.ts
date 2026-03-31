import { generateText } from "../../lib/ai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AffiliateProduct {
  name: string;
  platform: string; // 'ClickBank' | 'JVZoo' | 'ShareASale' | 'PartnerStack' | 'Gumroad' | 'Other'
  description: string;
  painPoints: string[];
  benefits: string[];
  commission: number; // percentage, e.g. 50
  affiliateLink: string;
  targetAudience: string;
}

// ---------------------------------------------------------------------------
// System + prompt builders
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT =
  "You are an affiliate marketing expert. Return ONLY valid JSON, no markdown, no explanation.";

function buildPrompt(keyword: string): string {
  return (
    `List 8 real affiliate products in the "${keyword}" niche. ` +
    "For each product return a JSON object with these fields: " +
    "name (string), " +
    "platform (one of: ClickBank, JVZoo, ShareASale, PartnerStack, Gumroad, Other), " +
    "description (2-3 sentences), " +
    "painPoints (array of 3-5 strings), " +
    "benefits (array of 3-5 strings), " +
    "commission (number — percentage, e.g. 50), " +
    "affiliateLink (marketplace signup or product URL), " +
    "targetAudience (string). " +
    "Return ONLY a JSON array of 8 objects. No markdown, no explanation, no code fences."
  );
}

function buildStrictPrompt(keyword: string): string {
  return (
    `List 8 real affiliate products in the "${keyword}" niche. ` +
    "Return ONLY a JSON array starting with [ and ending with ]. " +
    "Each element must have: name, platform (ClickBank/JVZoo/ShareASale/PartnerStack/Gumroad/Other), " +
    "description, painPoints (string[]), benefits (string[]), commission (number), " +
    "affiliateLink, targetAudience. " +
    "No prose, no markdown, no code fences. Start your response with [ immediately."
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function searchAffiliateProducts(
  keyword: string,
): Promise<AffiliateProduct[]> {
  // First attempt
  let raw: string;
  try {
    const result = await generateText(buildPrompt(keyword), SYSTEM_PROMPT);
    raw = result.text;
  } catch {
    return [];
  }

  // Try to parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // First parse failed — retry once with a stricter prompt
    try {
      const retryResult = await generateText(
        buildStrictPrompt(keyword),
        SYSTEM_PROMPT,
      );
      raw = retryResult.text;
    } catch {
      return [];
    }

    try {
      parsed = JSON.parse(raw);
    } catch {
      // Second parse also failed
      return [];
    }
  }

  // Validate it's an array
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed as AffiliateProduct[];
}
