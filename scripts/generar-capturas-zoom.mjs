import { chromium } from "playwright";
import { resolve } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const OUT_DIR = resolve("docs/evidencias/fase-06e");
mkdirSync(OUT_DIR, { recursive: true });

const NOVEDADES_PATH = resolve("src/components/Novedades.tsx");
const ZOOMS = ["1.00", "1.15", "1.25", "1.35"];
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844 },
];

function setZoomInFile(zoom) {
  let content = readFileSync(NOVEDADES_PATH, "utf8");
  content = content.replace(
    /export const ZOOM_FOTO_HOME = [0-9.]+;/,
    `export const ZOOM_FOTO_HOME = ${zoom};`,
  );
  writeFileSync(NOVEDADES_PATH, content, "utf8");
  console.log(`\n[Zoom actualizado en Novedades.tsx] -> ${zoom}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const zoom of ZOOMS) {
      setZoomInFile(zoom);
      // Esperar 1.5s para que Vite HMR procese el cambio
      await new Promise((r) => setTimeout(r, 1500));

      for (const vp of VIEWPORTS) {
        console.log(`Capturando zoom-${zoom} a ${vp.name}px...`);
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 2,
        });
        const page = await context.newPage();
        await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
        await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);

        // Ubicamos la sección #novedades (primer carrusel)
        const novedades = page.locator("#novedades").first();
        await novedades.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        const outPath = resolve(OUT_DIR, `zoom-${zoom}-${vp.name}.png`);
        await novedades.screenshot({ path: outPath });
        console.log(`  -> Guardado: ${outPath}`);

        await context.close();
      }
    }

    console.log("\nRestaurando ZOOM_FOTO_HOME = 1.25 por defecto...");
    setZoomInFile("1.25");
    console.log("¡Todas las 8 capturas generadas con éxito!");
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error(e);
  // Asegurar restauración ante error
  setZoomInFile("1.25");
  process.exit(1);
});
