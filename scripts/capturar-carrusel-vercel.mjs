import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE_URL = "https://florer-a-miraflores.vercel.app";
const OUT_DIR = resolve("docs/evidencias/fase-06d");

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [name, width, height] of [
      ["1440", 1440, 900],
      ["1920", 1920, 1080],
    ]) {
      console.log(
        `\n=== Capturando carrusel en producción real a ${name}px (${width}x${height}) ===`,
      );
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);

      const section = page.locator("#novedades").first();
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);

      const outPath = resolve(OUT_DIR, `vercel-carrusel-${name}-despues.png`);
      await section.screenshot({ path: outPath });
      console.log(`Guardado en producción real: ${outPath}`);

      const cards = section.locator("article");
      const count = await cards.count();
      console.log(`En ${name}px en web real: ${count} tarjetas encontradas.`);
      for (let i = 0; i < Math.min(count, 5); i++) {
        const box = await cards.nth(i).boundingBox();
        if (box) {
          console.log(
            `  Card ${i + 1}: x=${box.x.toFixed(1)}, width=${box.width.toFixed(1)}, right=${(box.x + box.width).toFixed(1)}`,
          );
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
