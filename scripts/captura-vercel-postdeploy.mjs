import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE_URL = "https://florer-a-miraflores.vercel.app";
const OUT_DIR = resolve("docs/evidencias/fase-06d");

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });

    console.log("Accediendo a la web real de Vercel a 390px...");
    const page = await context.newPage();
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Scroll completo para asegurar carga de imágenes
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 100);
      });
    });
    await page.waitForTimeout(1500);

    const outPath = resolve(OUT_DIR, "vercel-despues-390.png");
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Captura guardada en: ${outPath}`);

    // También una captura enfocada del Bento en móvil para verificación precisa
    const bentoSection = page
      .locator("section:has-text('Colecciones'), section:has-text('COLECCIONES')")
      .first();
    if ((await bentoSection.count()) > 0) {
      await bentoSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const bentoPath = resolve(OUT_DIR, "vercel-despues-bento-390.png");
      await bentoSection.screenshot({ path: bentoPath });
      console.log(`Bento screenshot guardado en: ${bentoPath}`);
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
