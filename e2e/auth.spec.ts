import { test, expect } from "@playwright/test";

test.describe("Authentication Smoke Tests", () => {
  test("should load the login page", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should load the sign-up page", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show error on invalid login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[id="email"]', "wrong@example.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Check for error toast or message (adjust selector as needed)
    await expect(page.locator('text=/อีเมลหรือรหัสผ่านไม่ถูกต้อง/i').or(page.locator('text=/Invalid login credentials/i'))).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[id="email"]', "playwright-test@vcc-crm.com");
    await page.fill('input[id="password"]', "Password123!");
    await page.click('button[type="submit"]');
    
    // Wait for redirect to protected dashboard or show error
    try {
        await expect(page).toHaveURL(/\/protected/, { timeout: 10000 });
    } catch (e) {
        const errorText = await page.locator('.p-3.rounded-lg.bg-red-50 p').innerText().catch(() => 'No error message found');
        console.error('Login failed. Page URL:', page.url(), 'Error on page:', errorText);
        throw e;
    }
    await expect(page.locator("text=/ยินดีต้อนรับ/i").or(page.locator("nav"))).toBeVisible();
  });
});
