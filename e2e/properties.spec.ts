import { test, expect } from "@playwright/test";

test.describe("Property Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/auth/login");
    await page.fill('input[id="email"]', "playwright-test@vcc-crm.com");
    await page.fill('input[id="password"]', "Password123!");
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard/protected area
    await expect(page).toHaveURL(/.*protected/, { timeout: 15000 });

    // Handle Cookie Consent if it appears
    const cookieButton = page.locator('button').filter({ hasText: /ยอมรับ|Accept/i });
    if (await cookieButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cookieButton.click();
        await expect(cookieButton).not.toBeVisible();
    }
  });

  test("should create a new property through the 7-step form", async ({ page }) => {
    // Go to New Property page
    await page.goto("/protected/properties/new");

    // --- STEP 1: Basic Info ---
    // Use more specific button selectors
    await page.locator('button').filter({ hasText: /^ขาย$|Sale/i }).click();
    await page.locator('button').filter({ hasText: /^คอนโด$|Condo/i }).click();
    
    // Wait for the "Quick Info" section to appear (common in Step 1)
    await expect(page.locator('text=/ข้อมูลพื้นฐานของทรัพย์|Basic Information/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/ชื่อทรัพย์|Property Title/i')).toBeVisible();
    await page.fill('input[name="title"]', "E2E Test Condo - Sukhumvit 24");
    
    await page.click('button:has-text("ถัดไป"), button:has-text("Next")');

    // --- STEP 2: Details ---
    // Increase timeout for Step 2 elements
    await expect(page.locator('input[name="original_price"]')).toBeVisible({ timeout: 10000 });
    await page.fill('input[name="original_price"]', "5000000");
    await page.fill('input[name="commission_sale_percentage"]', "3");
    
    // Fill description in SmartEditor (Tiptap)
    // Wait for the editor to initialize
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 15000 });
    await editor.click();
    await page.keyboard.type("This is a high-end condo located in the heart of Sukhumvit. Features include a private lift and a stunning city view.");
    
    // Capture any validation error if Next fails
    await page.click('button:has-text("ถัดไป"), button:has-text("Next")');
    
    // --- STEP 3: Location ---
    // The header is actually "ที่ตั้งและทำเล"
    await expect(page.locator('text=/ที่ตั้งและทำเล|Location/i')).toBeVisible({ timeout: 15000 });
    await page.fill('input[name="address_line1"]', "Sukhumvit 24, Khlong Toei");
    
    // Custom Selects for Province/District/Subdistrict
    // 1. Province
    await page.click('button:has-text("เลือกจังหวัด"), button:has-text("Select Province")');
    await page.locator('div[role="option"]').filter({ hasText: /^กรุงเทพมหานคร$/ }).click();
    
    // 2. District
    // Wait for district options to load based on province
    await page.waitForTimeout(1000); 
    await page.click('button:has-text("เลือกอำเภอ"), button:has-text("Select District")');
    await page.locator('div[role="option"]').filter({ hasText: /^คลองเตย$/ }).click();
    
    // 3. Subdistrict
    await page.waitForTimeout(500);
    await page.click('button:has-text("เลือกตำบล"), button:has-text("Select Subdistrict")');
    await page.locator('div[role="option"]').filter({ hasText: /^คลองตัน$/ }).click();
    
    await page.fill('input[name="google_maps_link"]', "https://goo.gl/maps/example");

    await page.click('button:has-text("ถัดไป"), button:has-text("Next")');

    // --- STEP 4: Media & Management ---
    // Header is "คลังรูปภาพ (Media Gallery)"
    await expect(page.locator('text=/คลังรูปภาพ|Media Gallery/i')).toBeVisible({ timeout: 15000 });
    // Skip image upload in smoke test
    await page.click('button:has-text("ถัดไป"), button:has-text("Next")');

    // --- STEP 5: Features ---
    await expect(page.locator('text=/สิ่งอำนวยความสะดวก|Features/i')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("ถัดไป"), button:has-text("Next")');

    // --- STEP 6: Review ---
    // The Review page is heavy, give it more time
    await expect(page.locator('text=/ตรวจสอบหน้าประกาศ|Review & Publish/i')).toBeVisible({ timeout: 20000 });
    await page.click('button:has-text("ถัดไป"), button:has-text("Next")');

    // --- STEP 7: Syndication & Submit ---
    // Header is "Social Media Listing"
    await expect(page.locator('text=/Social Media Listing/i')).toBeVisible({ timeout: 15000 });
    
    // Click Confirm/Final Submit button
    await page.click('button:has-text("ยืนยันสร้างประกาศ"), button:has-text("Confirm")');

    // --- VERIFICATION ---
    // Success dialog has "บันทึกข้อมูลสำเร็จ"
    await expect(page.locator('text=/บันทึกข้อมูลสำเร็จ|Successfully/i')).toBeVisible({ timeout: 20000 });
    
    // Check if "กลับหน้ารายการ" button is there
    await expect(page.locator('button:has-text("กลับหน้ารายการ"), button:has-text("Back to List")')).toBeVisible();
  });
});
