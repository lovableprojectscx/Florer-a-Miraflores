import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE_URL = "https://florer-a-miraflores.vercel.app";
const OUT_DIR = resolve("docs/evidencias/fase-06d");

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));

    // Captura de catálogo con tarjetas alineadas
    await page.goto(`${BASE_URL}/catalogo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const catPath = resolve(OUT_DIR, "vercel-despues-catalogo-390.png");
    await page.screenshot({ path: catPath, fullPage: true });
    console.log(`Catálogo guardado en: ${catPath}`);
  } finally {
    await browser.close();
  }
}

run();
