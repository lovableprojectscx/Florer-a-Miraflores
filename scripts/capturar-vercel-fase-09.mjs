import { chromium } from "playwright";
import { resolve } from "node:path";
import { loadEnv } from "vite";

const e2eEnv = loadEnv("e2e", process.cwd(), "");
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || e2eEnv.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || e2eEnv.E2E_ADMIN_PASSWORD;

const BASE_URL = "https://florer-a-miraflores.vercel.app";
const OUT_DIR = resolve("docs/evidencias/fase-09");

async function main() {
  console.log("Iniciando captura de producción en Vercel...");
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Captura de /blog en escritorio 1440
    console.log("Capturando /blog a 1440px...");
    const ctxDesktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const pageDesktop = await ctxDesktop.newPage();
    await pageDesktop.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
    await pageDesktop.goto(`${BASE_URL}/blog`, { waitUntil: "networkidle" });
    await pageDesktop.waitForTimeout(2000);
    await pageDesktop.screenshot({
      path: resolve(OUT_DIR, "postdeploy-blog-1440.png"),
      fullPage: false,
    });
    console.log("Capturado: postdeploy-blog-1440.png");

    // 2. Captura de artículo /blog/guia-cuidado-flores-frescas en escritorio 1440
    console.log("Capturando /blog/guia-cuidado-flores-frescas a 1440px...");
    await pageDesktop.goto(`${BASE_URL}/blog/guia-cuidado-flores-frescas`, {
      waitUntil: "networkidle",
    });
    await pageDesktop.waitForTimeout(2000);
    await pageDesktop.screenshot({
      path: resolve(OUT_DIR, "postdeploy-blog-articulo-1440.png"),
      fullPage: false,
    });
    console.log("Capturado: postdeploy-blog-articulo-1440.png");

    // 3. Captura de /blog en móvil 390
    console.log("Capturando /blog a 390px...");
    const ctxMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const pageMobile = await ctxMobile.newPage();
    await pageMobile.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
    await pageMobile.goto(`${BASE_URL}/blog`, { waitUntil: "networkidle" });
    await pageMobile.waitForTimeout(2000);
    await pageMobile.screenshot({
      path: resolve(OUT_DIR, "postdeploy-blog-390.png"),
      fullPage: false,
    });
    console.log("Capturado: postdeploy-blog-390.png");

    // 4. Captura de /admin/blog en escritorio 1440
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      console.log("Iniciando sesión en panel admin de producción...");
      const pageAdmin = await ctxDesktop.newPage();
      await pageAdmin.goto(`${BASE_URL}/admin-login`, { waitUntil: "networkidle" });
      await pageAdmin.locator("#email").fill(ADMIN_EMAIL);
      await pageAdmin.locator("#password").fill(ADMIN_PASSWORD);
      await pageAdmin.getByRole("button", { name: "Ingresar" }).click();
      await pageAdmin.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 });
      await pageAdmin.waitForTimeout(2000);

      console.log("Navegando a /admin/blog en producción...");
      const blogNavLink = pageAdmin
        .locator("aside nav")
        .getByRole("link", { name: "Blog", exact: true });
      await blogNavLink.click();
      await pageAdmin.waitForURL(/\/admin\/blog/, { timeout: 20_000 });
      await pageAdmin.waitForTimeout(2500);

      await pageAdmin.screenshot({
        path: resolve(OUT_DIR, "postdeploy-admin-blog-1440.png"),
        fullPage: false,
      });
      console.log("Capturado: postdeploy-admin-blog-1440.png");
    } else {
      console.warn("Sin credenciales admin en .env.e2e.local; omitiendo captura admin.");
    }

    console.log("Capturas de producción finalizadas exitosamente.");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Error al capturar producción:", err);
  process.exit(1);
});
