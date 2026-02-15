/**
 * Login flow tests - her giriş tipi ayrı ayrı çalışıyor mu kontrol eder.
 * 
 * Gerçek giriş test etmek için .env.test veya ortam değişkenleri:
 *   E2E_CUSTOMER_EMAIL, E2E_CUSTOMER_PASSWORD
 *   E2E_DRIVER_EMAIL, E2E_DRIVER_PASSWORD
 *   E2E_AGENCY_EMAIL, E2E_AGENCY_PASSWORD
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 */

import { test, expect } from "@playwright/test";

test.describe("Login sayfaları yükleniyor", () => {
  test("Customer/Unified login (/login) sayfası açılıyor", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    // Rol seçimi - Müşteri/Driver/Agency butonlarından biri görünmeli
    await expect(
      page.getByRole("button", { name: /Müşteri Girişi|Customer Login/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Driver login (/login/driver) sayfası açılıyor", async ({ page }) => {
    await page.goto("/login/driver");
    await expect(page).toHaveURL(/\/login\/driver/);
    await expect(page.getByPlaceholder(/email|@/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/password|••••/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("Agency login (/login/agency) sayfası açılıyor", async ({ page }) => {
    await page.goto("/login/agency");
    await expect(page).toHaveURL(/\/login\/agency/);
    await expect(page.getByPlaceholder(/email|@/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/password|••••/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("Admin login (/auth) sayfası açılıyor", async ({ page }) => {
    await page.goto("/auth");
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByPlaceholder(/email|@/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Customer giriş akışı", () => {
  test("Login sayfasında Müşteri Girişi seçilip form gösteriliyor", async ({ page }) => {
    await page.goto("/login");
    const customerBtn = page.getByRole("button", { name: /Müşteri Girişi|Customer Login/i });
    await customerBtn.click();
    await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email|@/i))).toBeVisible({ timeout: 5000 });
  });

  test("Email/şifre ile customer girişi (credentials varsa)", async ({ page }) => {
    const email = process.env.E2E_CUSTOMER_EMAIL;
    const password = process.env.E2E_CUSTOMER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await page.goto("/login");
    const customerBtn = page.getByRole("button", { name: /Müşteri Girişi|Customer Login/i });
    await customerBtn.click();
    await page.getByPlaceholder(/email|@/i).first().fill(email);
    await page.getByPlaceholder(/password|••••/i).first().fill(password);
    await page.getByRole("button", { name: /Giriş Yap|Login/i }).click();
    await expect(page).toHaveURL(/\/customer/, { timeout: 15000 });
  });
});

test.describe("Driver giriş akışı", () => {
  test("Driver login formu doldurulup gönderilebiliyor (credentials varsa)", async ({ page }) => {
    const email = process.env.E2E_DRIVER_EMAIL;
    const password = process.env.E2E_DRIVER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await page.goto("/login/driver");
    await page.getByPlaceholder(/email|@/i).first().fill(email);
    await page.getByPlaceholder(/password|••••/i).first().fill(password);
    await page.getByRole("button", { name: /Giriş Yap|Login/i }).click();
    await expect(page).toHaveURL(/\/driver/, { timeout: 15000 });
  });
});

test.describe("Agency giriş akışı", () => {
  test("Agency login formu doldurulup gönderilebiliyor (credentials varsa)", async ({ page }) => {
    const email = process.env.E2E_AGENCY_EMAIL;
    const password = process.env.E2E_AGENCY_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await page.goto("/login/agency");
    await page.getByPlaceholder(/email|@/i).first().fill(email);
    await page.getByPlaceholder(/password|••••/i).first().fill(password);
    await page.getByRole("button", { name: /Giriş Yap|Login/i }).click();
    // Trusted device: /agency veya 2FA OTP ekranı (güvenilmeyen cihaz)
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    const url = page.url();
    const hasAgency = url.includes("/agency");
    const otpInput = page.locator('input[inputmode="numeric"], input[type="text"][maxlength]').first();
    const hasOtp = await otpInput.isVisible().catch(() => false);
    expect(hasAgency || hasOtp).toBeTruthy();
  });
});

test.describe("Admin giriş akışı", () => {
  test("Admin login formu doldurulup gönderilebiliyor (credentials varsa)", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }
    await page.goto("/auth");
    await page.getByPlaceholder(/email|@/i).first().fill(email);
    await page.getByPlaceholder(/password|••••/i).first().fill(password);
    await page.getByRole("button", { name: /Giriş|Login|Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });
});
