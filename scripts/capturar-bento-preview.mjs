import { chromium } from "playwright";
import { resolve } from "node:path";

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [name, width, height] of [
      ["1440", 1440, 900],
      ["390", 390, 844],
    ]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
      await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      const section = page.locator("#categorias");
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      const outPath = resolve(`docs/evidencias/fase-06c/bento-sin-sombreado-${name}.png`);
      await section.screenshot({ path: outPath });
      console.log(`Guardado: ${outPath}`);
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
