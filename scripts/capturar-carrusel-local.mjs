import { chromium } from "playwright";
import { resolve } from "node:path";

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [name, width, height] of [
      ["1440", 1440, 900],
      ["1920", 1920, 1080],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
      await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const section = page.locator("#novedades").first();
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      const outPath = resolve(`docs/evidencias/fase-06d/carrusel-${name}-despues.png`);
      await section.screenshot({ path: outPath });
      console.log(`Guardado localmente: ${outPath}`);

      // Imprimir mediciones de las tarjetas
      const cards = section.locator("article");
      const count = await cards.count();
      console.log(`En ${name}px: ${count} tarjetas encontradas.`);
      for (let i = 0; i < Math.min(count, 5); i++) {
        const box = await cards.nth(i).boundingBox();
        console.log(`  Card ${i + 1}: x=${box.x.toFixed(1)}, width=${box.width.toFixed(1)}, right=${(box.x + box.width).toFixed(1)}`);
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
