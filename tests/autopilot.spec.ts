import { test, expect } from "@playwright/test";

// Helpers
async function waitForLoad(page: import("@playwright/test").Page) {
  // Use "load" (not "networkidle") — SSE connections keep the network active indefinitely
  await page.waitForLoadState("load");
  // React hydration happens after "load". Give the loading spinner a short window to
  // appear post-hydration, then wait for it to disappear before asserting on content.
  const spinner = page.getByText("Loading autopilot rules…");
  await spinner.waitFor({ state: "visible", timeout: 4_000 }).catch(() => {});
  await spinner.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
}

// ─── Page shell ──────────────────────────────────────────────────────────────

test.describe("Autopilot — page shell", () => {
  test("loads at /autopilot", async ({ page }) => {
    await page.goto("/autopilot");
    await waitForLoad(page);
    await expect(page).toHaveURL("/autopilot");
  });

  test("shows Autopilot heading", async ({ page }) => {
    await page.goto("/autopilot");
    await waitForLoad(page);
    await expect(page.getByRole("heading", { name: "Autopilot" })).toBeVisible();
  });

  test("shows subtitle 'Schedule your content pipeline'", async ({ page }) => {
    await page.goto("/autopilot");
    await waitForLoad(page);
    await expect(page.getByText("Schedule your content pipeline")).toBeVisible();
  });
});

// ─── Tab switcher ─────────────────────────────────────────────────────────────

test.describe("Autopilot — tab switcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autopilot");
    await waitForLoad(page);
  });

  test("shows Full Autopilot and Custom Schedule tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Full Autopilot/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Custom Schedule/ })).toBeVisible();
  });

  test("Full Autopilot tab is active by default (bold style)", async ({ page }) => {
    const fullTab = page.getByRole("button", { name: /Full Autopilot/ });
    const fontWeight = await fullTab.evaluate((el) =>
      window.getComputedStyle(el).fontWeight
    );
    expect(["600", "700", "bold"]).toContain(fontWeight);
  });

  test("clicking Custom Schedule changes URL to ?tab=custom", async ({ page }) => {
    await page.getByRole("button", { name: /Custom Schedule/ }).click();
    await page.waitForURL(/tab=custom/);
    await expect(page).toHaveURL(/tab=custom/);
  });

  test("clicking Full Autopilot changes URL to ?tab=full", async ({ page }) => {
    await page.getByRole("button", { name: /Custom Schedule/ }).click();
    await page.waitForURL(/tab=custom/);
    await page.getByRole("button", { name: /Full Autopilot/ }).click();
    await page.waitForURL(/tab=full/);
    await expect(page).toHaveURL(/tab=full/);
  });
});

// ─── Full Autopilot tab ───────────────────────────────────────────────────────

test.describe("Autopilot — Full Autopilot tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autopilot?tab=full");
    await waitForLoad(page);
  });

  test("shows Full Autopilot card with description", async ({ page }) => {
    await expect(page.getByText("Full Autopilot")).toBeVisible();
    await expect(page.getByText("Runs the complete pipeline on schedule")).toBeVisible();
  });

  test("shows ON/OFF toggle", async ({ page }) => {
    // Toggle is a styled <div> — visible in the Full Autopilot card header
    const card = page.locator("div").filter({ hasText: "Runs the complete pipeline on schedule" }).first();
    await expect(card).toBeVisible();
    // The toggle track div (40x22 pill) is inside the card
    const toggleTrack = card.locator("[style*='border-radius: 11px']").first();
    await expect(toggleTrack).toBeVisible();
  });

  test("shows 'Runs on' label and day chips Mon–Sun", async ({ page }) => {
    await expect(page.getByText("Runs on")).toBeVisible();
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      await expect(page.getByRole("button", { name: day })).toBeVisible();
    }
  });

  test("shows 'At' label and hour dropdown with 24 options", async ({ page }) => {
    await expect(page.getByText("At")).toBeVisible();
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
    const count = await select.locator("option").count();
    expect(count).toBe(24);
  });

  test("shows Research section with all sources", async ({ page }) => {
    await expect(page.getByText("Research")).toBeVisible();
    for (const source of ["YouTube", "Reddit", "HN", "News"]) {
      await expect(page.getByRole("button", { name: source }).first()).toBeVisible();
    }
  });

  test("shows Promote dropdown with auto-pick option", async ({ page }) => {
    await expect(page.getByText("Promote")).toBeVisible();
    await expect(page.getByText("Auto-pick by priority")).toBeVisible();
  });

  test("shows 'Post to' label and platform checkboxes", async ({ page }) => {
    await expect(page.getByText("Post to")).toBeVisible();
    for (const platform of ["Twitter", "LinkedIn", "Instagram", "Blog"]) {
      await expect(page.getByRole("button", { name: platform }).first()).toBeVisible();
    }
  });

  test("shows Gate section with Auto-post and Require approval options", async ({ page }) => {
    await expect(page.getByText("Gate")).toBeVisible();
    await expect(page.getByLabel("Auto-post")).toBeVisible();
    await expect(page.getByLabel("Require approval")).toBeVisible();
  });

  test("shows Save button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Save/ })).toBeVisible();
  });

  test("day chips toggle on click", async ({ page }) => {
    const monBtn = page.getByRole("button", { name: "Mon" });
    const bgBefore = await monBtn.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    await monBtn.click();
    const bgAfter = await monBtn.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    // Background should change (toggled on or off)
    expect(bgAfter).not.toBe(bgBefore);
  });

  test("gate radio: Require approval can be selected", async ({ page }) => {
    await page.getByLabel("Require approval").check();
    await expect(page.getByLabel("Require approval")).toBeChecked();
  });

  test("gate radio: Auto-post can be selected", async ({ page }) => {
    await page.getByLabel("Require approval").check();
    await page.getByLabel("Auto-post").check();
    await expect(page.getByLabel("Auto-post")).toBeChecked();
  });
});

// ─── Custom Schedule tab ──────────────────────────────────────────────────────

test.describe("Autopilot — Custom Schedule tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autopilot?tab=custom");
    await waitForLoad(page);
  });

  test("shows Custom Schedule heading and subtitle", async ({ page }) => {
    await expect(page.getByText("Custom Schedule")).toBeVisible();
    await expect(page.getByText("Configure individual pipeline steps per day")).toBeVisible();
  });

  test("shows '+ Add Step' button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add Step/ })).toBeVisible();
  });

  test("shows empty state when no steps exist", async ({ page }) => {
    const rules = await page.evaluate(async () => {
      const res = await fetch("/api/autopilot");
      const json = await res.json();
      return (json.rules || []).filter((r: { type: string }) => r.type !== "full");
    });

    if (rules.length === 0) {
      await expect(
        page.getByText('No custom steps yet. Click "Add Step" to create your first scheduled action.')
      ).toBeVisible();
    }
  });
});

// ─── Add Step modal ───────────────────────────────────────────────────────────

test.describe("Autopilot — Add Step modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autopilot?tab=custom");
    await waitForLoad(page);
    await page.getByRole("button", { name: /Add Step/ }).click();
  });

  test("opens modal with 'Add Step' title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Add Step" })).toBeVisible();
  });

  test("shows step type selector with Research, Generate, Post", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Research/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Generate/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Post/ })).toBeVisible();
  });

  test("Research is selected by default", async ({ page }) => {
    const researchBtn = page.getByRole("button", { name: /Research/ });
    const bg = await researchBtn.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    // Active: rgb(99, 102, 241) = #6366f1
    expect(bg).toBe("rgb(99, 102, 241)");
  });

  test("shows day chips Mon–Sun in modal", async ({ page }) => {
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      // There may be multiple Mon buttons (one in full autopilot on the page behind),
      // but modal renders on top. Use the modal container.
      const modal = page.locator("[style*='position: fixed']").last();
      await expect(modal.getByRole("button", { name: day })).toBeVisible();
    }
  });

  test("shows hour dropdown with 24 options in modal", async ({ page }) => {
    const modal = page.locator("[style*='position: fixed']").last();
    const select = modal.locator("select");
    await expect(select).toBeVisible();
    expect(await select.locator("option").count()).toBe(24);
  });

  test("Research type shows Sources and Keyword fields", async ({ page }) => {
    await expect(page.getByText("Sources")).toBeVisible();
    for (const source of ["YouTube", "Reddit", "HN", "News"]) {
      await expect(page.getByRole("button", { name: source }).first()).toBeVisible();
    }
    await expect(page.getByPlaceholder("e.g., claude code")).toBeVisible();
  });

  test("switching to Generate shows Content Types", async ({ page }) => {
    await page.getByRole("button", { name: /Generate/ }).click();
    await expect(page.getByText("Content Types")).toBeVisible();
    await expect(page.getByText("Auto-pick by priority")).toBeVisible();
  });

  test("switching to Post shows Platforms and Gate", async ({ page }) => {
    await page.getByRole("button", { name: /Post/ }).click();
    await expect(page.getByText("Platforms")).toBeVisible();
    await expect(page.getByLabel("Auto-post")).toBeVisible();
    await expect(page.getByLabel("Require approval")).toBeVisible();
  });

  test("Cancel button closes the modal", async ({ page }) => {
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Add Step" })).not.toBeVisible();
  });

  test("X button closes the modal", async ({ page }) => {
    // X button is the icon button in the modal header
    const modal = page.locator("[style*='position: fixed']").last();
    const closeBtn = modal.locator("button").first();
    await closeBtn.click();
    await expect(page.getByRole("heading", { name: "Add Step" })).not.toBeVisible();
  });

  test("saving without selecting a day shows alert", async ({ page }) => {
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Please select at least one day");
      await dialog.accept();
    });
    // Click "Add Step" (save) button in modal footer
    await page.getByRole("button", { name: "Add Step" }).last().click();
  });
});
