import { chromium } from "playwright";
import { resolve } from "node:path";

const OUT_DIR = resolve("docs/evidencias/fase-06c");

async function waitForSectionImages(page, selector, maxCount = 10) {
  await page.waitForFunction(
    ({ sel, count }) => {
      const imgs = Array.from(document.querySelectorAll(`${sel} img`)).slice(0, count);
      if (imgs.length === 0) return false;
      return imgs.every((img) => img.complete && img.naturalWidth > 0);
    },
    { sel: selector, count: maxCount },
    { timeout: 15000 },
  );
}

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
    const naturalW = await bannerImg.evaluate((img) => img.naturalWidth);
    console.log("Vercel Live Banner currentSrc:", liveBannerSrc, "naturalWidth:", naturalW);
    await bannerSection.screenshot({ path: resolve(OUT_DIR, "vercel-banner-1440.png") });

    // Colecciones (Bento)
    const coleccionesSection = page1440.locator("#categorias");
    await coleccionesSection.scrollIntoViewIfNeeded();
    await page1440.waitForTimeout(1000);
    await waitForSectionImages(page1440, "#categorias", 9);
    await coleccionesSection.screenshot({ path: resolve(OUT_DIR, "vercel-colecciones-1440.png") });

    // Novedades (Carrusel de tarjetas 1:1, borde a borde)
    const novedadesSection = page1440.locator("#novedades section").first();
    await novedadesSection.scrollIntoViewIfNeeded();
    await page1440.waitForTimeout(1000);
    await waitForSectionImages(page1440, "#novedades section:first-of-type", 6);
    await novedadesSection.screenshot({ path: resolve(OUT_DIR, "vercel-novedades-1440.png") });

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
    await waitForSectionImages(page390, "#categorias", 9);
    await colMobile.screenshot({ path: resolve(OUT_DIR, "vercel-colecciones-390.png") });

    const novMobile = page390.locator("#novedades section").first();
    await novMobile.scrollIntoViewIfNeeded();
    await page390.waitForTimeout(1000);
    await waitForSectionImages(page390, "#novedades section:first-of-type", 4);
    await novMobile.screenshot({ path: resolve(OUT_DIR, "vercel-novedades-390.png") });

    await page1440.close();
    await page390.close();
    console.log("¡Capturas en producción Vercel guardadas exitosamente!");
  } finally {
    await browser.close();
  }
}

capture().catch((e) => {
  console.error("Error al capturar en Vercel:", e);
  process.exit(1);
});
