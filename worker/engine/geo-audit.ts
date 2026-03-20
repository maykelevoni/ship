import { db } from "@/lib/db";
import { generateText } from "@/lib/claude";

const GEO_SYSTEM_PROMPT = `You are a GEO (Generative Engine Optimization) expert.
Score this webpage 0-100 for AI search visibility.
Consider: clear problem statement, specific claims with numbers,
structured headings, llms.txt presence, citability, structured data.
Return ONLY valid JSON: { "score": number, "issues": string[], "recommendations": string[] }`;

interface GeoAuditResult {
  score: number;
  issues: string[];
  recommendations: string[];
}

async function fetchPageContent(url: string): Promise<{
  title: string;
  description: string;
  headings: string[];
  bodyText: string;
  hasLlmsTxt: boolean;
  hasStructuredData: boolean;
}> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GeoAuditBot/1.0)" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract <meta name="description">
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  // Extract headings h1, h2, h3
  const headingMatches = html.matchAll(/<h[1-3][^>]*>([^<]*(?:<(?!\/h[1-3])[^>]*>[^<]*)*)<\/h[1-3]>/gi);
  const headings: string[] = [];
  for (const match of headingMatches) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text) headings.push(text);
  }

  // Extract body text (strip tags, take first 2000 chars)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyRaw = bodyMatch ? bodyMatch[1] : html;
  const bodyText = bodyRaw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);

  // Check for structured data
  const hasStructuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);

  // Check for llms.txt
  let hasLlmsTxt = false;
  try {
    const origin = new URL(url).origin;
    const llmsResponse = await fetch(`${origin}/llms.txt`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    hasLlmsTxt = llmsResponse.ok;
  } catch {
    hasLlmsTxt = false;
  }

  return { title, description, headings, bodyText, hasLlmsTxt, hasStructuredData };
}

export async function runGeoAudit(promotionId: string, url: string): Promise<void> {
  try {
    const pageContent = await fetchPageContent(url);

    const prompt = `Analyze this webpage for GEO (Generative Engine Optimization) visibility:

URL: ${url}
Title: ${pageContent.title}
Meta Description: ${pageContent.description}
Headings (H1-H3): ${pageContent.headings.join(" | ")}
llms.txt present: ${pageContent.hasLlmsTxt}
Structured data (JSON-LD) present: ${pageContent.hasStructuredData}

Body text (first 2000 chars):
${pageContent.bodyText}`;

    let result: GeoAuditResult;

    try {
      const raw = await generateText(prompt, GEO_SYSTEM_PROMPT);

      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in Claude response");
      }

      result = JSON.parse(jsonMatch[0]) as GeoAuditResult;

      if (
        typeof result.score !== "number" ||
        !Array.isArray(result.issues) ||
        !Array.isArray(result.recommendations)
      ) {
        throw new Error("Invalid JSON structure from Claude");
      }
    } catch (claudeError) {
      console.error(`[geo-audit] Claude error for promotion ${promotionId}:`, claudeError);
      result = { score: 0, issues: ["Claude analysis failed"], recommendations: [] };
    }

    await db.promotion.update({
      where: { id: promotionId },
      data: {
        geoScore: result.score,
        geoIssues: JSON.stringify(result.issues),
        geoAuditedAt: new Date(),
      },
    });

    console.log(`[geo-audit] Completed for promotion ${promotionId}: score=${result.score}`);
  } catch (error) {
    console.error(`[geo-audit] Failed for promotion ${promotionId}:`, error);

    try {
      await db.promotion.update({
        where: { id: promotionId },
        data: {
          geoScore: 0,
          geoIssues: JSON.stringify([
            error instanceof Error ? error.message : "Audit failed",
          ]),
          geoAuditedAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error(`[geo-audit] Failed to update DB for promotion ${promotionId}:`, dbError);
    }
  }
}
