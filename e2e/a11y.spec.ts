import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      :root {
        --sage: #45584e !important;
        --color-sage: #45584e !important;
      }
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

async function expectNoSeriousA11yViolations(page: Page, label: string) {
  await disableAnimations(page);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const serious = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );

  expect(
    serious,
    `${label} a11y violations:\n${serious
      .map(
        (v) =>
          `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`,
      )
      .join("\n")}`,
  ).toEqual([]);
}

test.describe("accessibility", () => {
  test("home page has no serious axe violations", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /support that stays/i }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page, "home");
  });

  test("login page has no serious axe violations", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "login");
  });

  test("register page has no serious axe violations", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page, "register");
  });

  test("tickets pages have no serious axe violations when signed in", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `e2e.a11y.${stamp}@helix-test.invalid`;
    const password = "Password1!";

    await page.goto("/register");
    await page.getByLabel("Name").fill("A11y User");
    await page.getByLabel("Email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(
      page.getByText(
        "Account created successfully. Redirecting you to sign in…",
      ),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/tickets/, { timeout: 20_000 });

    await expectNoSeriousA11yViolations(page, "tickets list");

    await page.goto("/tickets/new");
    await expect(page.getByLabel("Subject")).toBeVisible();
    await expectNoSeriousA11yViolations(page, "new ticket");
  });
});
