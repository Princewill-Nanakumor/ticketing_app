import { expect, test } from "@playwright/test";

test("register → login → create ticket → comment → close", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `e2e.${stamp}@helix-test.invalid`;
  const password = "Password1!";
  const subject = `E2E printer ${stamp}`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(
    page.getByText("Account created successfully. Redirecting you to sign in…"),
  ).toBeVisible({ timeout: 20_000 });

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/tickets/, { timeout: 20_000 });

  await page.goto("/tickets/new");
  await page.getByLabel("Subject").fill(subject);
  await page
    .getByLabel("Description")
    .fill("Cannot print invoices from the shop floor today.");
  await page.getByRole("button", { name: "Low" }).click();
  await page.getByRole("option", { name: "High" }).click();
  await page.getByRole("button", { name: /submit ticket/i }).click();
  await expect(
    page.getByText(
      /ticket was created successfully|ticket submitted successfully/i,
    ),
  ).toBeVisible({ timeout: 20_000 });

  await page.goto("/tickets");
  const ticketRow = page.getByRole("listitem").filter({ hasText: subject });
  await expect(ticketRow).toBeVisible({ timeout: 20_000 });
  await ticketRow.getByRole("link", { name: "View" }).click();
  await expect(page).toHaveURL(/\/tickets\/[A-Z]{2}\d{7}/);

  await page
    .getByPlaceholder("Write an update for this ticket…")
    .fill("Still investigating the driver.");
  await page.getByRole("button", { name: /post reply/i }).click();
  await expect(page.getByText("Still investigating the driver.")).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: "Close ticket" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Close ticket?" }),
  ).toBeVisible();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Close ticket" })
    .click();

  await expect(page.getByText(/closed/i).first()).toBeVisible({
    timeout: 20_000,
  });
});

test("login rejects invalid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@helix-test.invalid");
  await page.locator("#password").fill("Password1!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible({
    timeout: 15_000,
  });
});
