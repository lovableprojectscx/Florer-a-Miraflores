import { chromium } from "playwright";
import { resolve } from "node:path";

const OUT_DIR = resolve("docs/evidencias/fase-06c");

async function capture() {
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop 1440
    console.log("--- Capturando en producción Vercel (1440) ---");
    const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page1440.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
    await page1440.goto("https://florer-a-miraflores.vercel.app/", { waitUntil: "networkidle" });
    await page1440.waitForTimeout(2000);

    // Banner
    const bannerSection = page1440.locator("section.w-full.bg-white").first();
    const bannerImg = bannerSection.locator("img").first();
    const liveBannerSrc = await bannerImg.evaluate((img) => img.currentSrc);
    console.log("Vercel Live Banner currentSrc:", liveBannerSrc);
    await bannerSection.screenshot({ path: resolve(OUT_DIR, "vercel-banner-1440.png") });

    // Colecciones
    const coleccionesSection = page1440.locator("#categorias");
    await coleccionesSection.scrollIntoViewIfNeeded();
    await page1440.waitForTimeout(1000);
    await coleccionesSection.screenshot({ path: resolve(OUT_DIR, "vercel-colecciones-1440.png") });

    // 2. Mobile 390
    console.log("--- Capturando en producción Vercel (390) ---");
    const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page390.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
    await page390.goto("https://florer-a-miraflores.vercel.app/", { waitUntil: "networkidle" });
    await page390.waitForTimeout(2000);

    const bannerMobile = page390.locator("section.w-full.bg-white").first();
    await bannerMobile.screenshot({ path: resolve(OUT_DIR, "vercel-banner-390.png") });

    const colMobile = page390.locator("#categorias");
    await colMobile.scrollIntoViewIfNeeded();
    await page390.waitForTimeout(1000);
    await colMobile.screenshot({ path: resolve(OUT_DIR, "vercel-colecciones-390.png") });

    await page1440.close();
    await page390.close();
    console.log("¡Capturas en producción guardadas exitosamente!");
  } finally {
    await browser.close();
  }
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
