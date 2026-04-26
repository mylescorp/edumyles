import { expect, test } from "@playwright/test";

const LANDING_BASE_URL = process.env.PLAYWRIGHT_LANDING_BASE_URL ?? "http://localhost:3001";

test.describe("Landing CTA flows", () => {
  test("navbar Book Demo CTA carries attribution into the demo request payload", async ({ page }) => {
    let capturedRequest: any = null;

    await page.route("**/api/demo-request", async (route) => {
      capturedRequest = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          demoRequestId: "demo_test_123",
          crmLeadId: "lead_test_123",
        }),
      });
    });

    await page.goto(
      `${LANDING_BASE_URL}/?utm_source=google&utm_medium=cpc&utm_campaign=april-demo-push&gclid=test-gclid`
    );

    await page.getByRole("link", { name: "Book a Demo" }).click();
    await expect(page).toHaveURL(/\/book-demo\?/);
    await expect(page).toHaveURL(/cta=navbar_book_demo/);
    await expect(page).toHaveURL(/utm_campaign=april-demo-push/);

    await page.locator('input[name="firstName"]').fill("Mary");
    await page.locator('input[name="lastName"]').fill("Wanjiru");
    await page.locator('input[name="email"]').fill("mary.demo@example.com");
    await page.locator('input[name="phone"]').fill("+254700000001");
    await page.locator('input[name="schoolName"]').fill("Green Valley School");
    await page.locator('input[name="jobTitle"]').fill("Principal");
    await page.locator('input[name="preferredDemoDate"]').fill("2026-05-12");
    await page.locator('textarea[name="needs"]')
      .fill("We want a guided SIS and finance walkthrough.");
    await page.getByRole("button", { name: "Request Demo" }).click();

    await expect(page.getByText("Demo request received")).toBeVisible();
    expect(capturedRequest).toBeTruthy();
    expect(capturedRequest.schoolName).toBe("Green Valley School");
    expect(capturedRequest.marketingAttribution).toMatchObject({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "april-demo-push",
      gclid: "test-gclid",
      ctaSource: "navbar_book_demo",
      ctaLabel: "Book Demo",
      landingPage: "/book-demo",
      originPath: "/",
    });
  });

  test("navbar Join Waitlist CTA carries attribution into the waitlist payload", async ({ page }) => {
    let capturedRequest: any = null;

    await page.route("**/api/waitlist", async (route) => {
      capturedRequest = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          waitlistId: "waitlist_test_123",
          alreadyExists: false,
        }),
      });
    });

    await page.goto(
      `${LANDING_BASE_URL}/?utm_source=meta&utm_medium=paid-social&utm_campaign=school-waitlist&fbclid=test-fbclid`
    );

    await page.getByRole("link", { name: "Join Waitlist" }).first().click();
    await expect(page).toHaveURL(/\/waitlist\?/);
    await expect(page).toHaveURL(/cta=navbar_waitlist/);
    await expect(page).toHaveURL(/utm_campaign=school-waitlist/);

    await page.locator('input[name="firstName"]').fill("Grace");
    await page.locator('input[name="lastName"]').fill("Atieno");
    await page.locator('input[name="email"]').fill("grace.waitlist@example.com");
    await page.locator('input[name="phone"]').fill("+254700000002");
    await page.locator('select[name="country"]').selectOption("Kenya");
    await page.locator('input[name="county"]').fill("Nairobi");
    await page.locator('input[name="schoolName"]').fill("Bright Future Academy");
    await page.locator('input[name="studentCount"]').fill("480");
    await page.locator('select[name="currentSystem"]').selectOption("Excel/Spreadsheets");
    await page.locator('textarea[name="biggestChallenge"]')
      .fill("We need admissions, fees, and guardian communication in one place.");
    await page.getByRole("button", { name: "Join the waitlist" }).click();

    await expect(page).toHaveURL(/\/waitlist\/success\?/);
    expect(capturedRequest).toBeTruthy();
    expect(capturedRequest.schoolName).toBe("Bright Future Academy");
    expect(capturedRequest.marketingAttribution).toMatchObject({
      utmSource: "meta",
      utmMedium: "paid-social",
      utmCampaign: "school-waitlist",
      fbclid: "test-fbclid",
      ctaSource: "navbar_waitlist",
      ctaLabel: "Join Waitlist",
      landingPage: "/waitlist",
      originPath: "/",
    });
  });
});
