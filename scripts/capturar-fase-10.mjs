import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve("docs/evidencias/fase-10");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log("Iniciando captura de evidencias Fase 10 en", BASE_URL);
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { width: 1440, height: 900, suffix: "1440" },
    { width: 390, height: 844, suffix: "390" },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    // 1. Términos y condiciones
    console.log(`Capturando /terminos (${vp.suffix})...`);
    await page.goto(`${BASE_URL}/terminos`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, `terminos-${vp.suffix}.png`),
      fullPage: false,
    });

    // 2. Política de privacidad
    console.log(`Capturando /privacidad (${vp.suffix})...`);
    await page.goto(`${BASE_URL}/privacidad`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, `privacidad-${vp.suffix}.png`),
      fullPage: false,
    });

    // 3. Política de cambios y devoluciones
    console.log(`Capturando /cambios-y-devoluciones (${vp.suffix})...`);
    await page.goto(`${BASE_URL}/cambios-y-devoluciones`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, `cambios-y-devoluciones-${vp.suffix}.png`),
      fullPage: false,
    });

    // 4. Checkout con casilla obligatoria
    console.log(`Capturando /checkout con casilla (${vp.suffix})...`);
    await page.goto(`${BASE_URL}/catalogo`, { waitUntil: "domcontentloaded" });
    const firstAddBtn = page.locator("main article button").first();
    await firstAddBtn.waitFor({ state: "visible", timeout: 10000 });
    await firstAddBtn.click();
    await page.waitForTimeout(500);

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });
    const terminosCheckbox = page.locator("#acepto_terminos");
    await terminosCheckbox.waitFor({ state: "visible", timeout: 10000 });
    await terminosCheckbox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, `checkout-casilla-${vp.suffix}.png`),
      fullPage: false,
    });

    // 5. Popup Club Florería Miraflores (sin cupón, con nombre y casilla)
    console.log(`Capturando Popup Modal (${vp.suffix})...`);
    const popupPage = await context.newPage();
    await popupPage.route("**/rest/v1/popup*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "popup-10",
            activo: true,
            texto: null,
            imagen_url: null,
            fecha_expiracion: null,
          },
        ]),
      });
    });
    await popupPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    const popupDialog = popupPage.locator('div[role="dialog"]');
    await popupDialog.waitFor({ state: "visible", timeout: 10000 });
    await popupPage.waitForTimeout(500);
    await popupPage.screenshot({
      path: path.join(OUT_DIR, `popup-${vp.suffix}.png`),
      fullPage: false,
    });
    await popupPage.close();

    // 6. Admin Suscriptores
    console.log(`Capturando /admin/suscriptores (${vp.suffix})...`);
    const adminPage = await context.newPage();
    await adminPage.addInitScript(() => {
      const session = {
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "mock-refresh",
        user: { id: "admin-uuid", email: "admin@floreriamiraflores.com" },
      };
      window.localStorage.setItem("sb-sdrkiomeesoctsxeidmu-auth-token", JSON.stringify(session));
    });
    await adminPage.route("**/rest/v1/suscriptores*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "11111111-1111-1111-1111-111111111111",
            nombre: "Sofía Martínez",
            telefono: "+51999600482",
            consentimiento: true,
            consentimiento_texto:
              "Acepto que Florería Miraflores me envíe promociones y novedades por WhatsApp. Puedo darme de baja cuando quiera. Ver Política de privacidad.",
            origen: "popup_home",
            activo: true,
            baja_at: null,
            created_at: "2026-10-15T15:30:00Z",
          },
          {
            id: "22222222-2222-2222-2222-222222222222",
            nombre: "Carlos Gómez",
            telefono: "+51988776655",
            consentimiento: true,
            consentimiento_texto:
              "Acepto que Florería Miraflores me envíe promociones y novedades por WhatsApp. Puedo darme de baja cuando quiera. Ver Política de privacidad.",
            origen: "popup_home",
            activo: false,
            baja_at: "2026-10-15T16:00:00Z",
            created_at: "2026-10-14T10:00:00Z",
          },
        ]),
      });
    });

    await adminPage.goto(`${BASE_URL}/admin/suscriptores`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(800);
    await adminPage.screenshot({
      path: path.join(OUT_DIR, `admin-suscriptores-${vp.suffix}.png`),
      fullPage: false,
    });
    await adminPage.close();

    await context.close();
  }

  await browser.close();
  console.log("¡Todas las capturas se generaron exitosamente en:", OUT_DIR);
}

capture().catch((err) => {
  console.error("Error al capturar evidencias:", err);
  process.exit(1);
});
