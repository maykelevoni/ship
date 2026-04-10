import { expect, test } from "@playwright/test";

test("login with test credentials", async ({ page }) => {
  const allRequests: { method: string; url: string; status: number; body?: string }[] = [];

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/auth") || url.includes("localhost:3000")) {
      let body: string | undefined;
      try { body = await res.text(); } catch { body = undefined; }
      allRequests.push({ method: res.request().method(), url, status: res.status(), body: body?.substring(0, 200) });
    }
  });

  await page.goto("/login");
  await page.locator("#email").waitFor({ state: "visible" });

  await page.locator("#email").click();
  await page.locator("#email").type("test@example.com");
  await page.locator("#password").click();
  await page.locator("#password").type("password123");
  await page.locator("button[type=submit]").click();

  // Wait longer for any auth flow
  await page.waitForTimeout(15000);

  const finalUrl = page.url();
  const authReqs = allRequests.filter(r => r.url.includes("/api/auth"));
  console.log("Final URL:", finalUrl);
  console.log("Auth requests:", JSON.stringify(authReqs.map(r => ({ method: r.method, url: r.url.replace("http://localhost:3000", ""), status: r.status, body: r.body })), null, 2));

  await page.screenshot({ path: "test-results/login-final.png" });

  expect(finalUrl).not.toContain("/login");
});
