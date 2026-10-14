import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const OUT_DIR = resolve("docs/evidencias/fase-06e");
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844 },
];

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\nCapturando sección colecciones a ${vp.name}px...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
      await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Ubicamos la sección #categorias
      const categorias = page.locator("#categorias").first();
      await categorias.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);

      const outPath = resolve(OUT_DIR, `colecciones-${vp.name}.png`);
      await categorias.screenshot({ path: outPath });
      console.log(`  -> Guardado: ${outPath}`);

      await context.close();
    }

    console.log("\n¡Capturas de colecciones generadas con éxito!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
