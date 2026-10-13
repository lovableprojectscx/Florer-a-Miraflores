import { chromium } from "playwright";
import { resolve } from "node:path";
import sharp from "sharp";
import { existsSync } from "node:fs";

const OUT_DIR = resolve("docs/evidencias/fase-06c/tarjetas");

const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
  { name: "390", width: 390, height: 844 },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const vp of viewports) {
      console.log(`\n--- Capturando Novedades en ${vp.name} (${vp.width}x${vp.height}) ---`);
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      });
      await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
      await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const firstSection = page.locator("#novedades section").first();
      await firstSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);

      // Esperar a que las primeras tarjetas visibles carguen sus imágenes
      await page.waitForFunction(
        () => {
          const imgs = Array.from(
            document.querySelectorAll("#novedades section:first-of-type img"),
          );
          if (imgs.length === 0) return false;
          const visibleImgs = imgs.slice(0, 5);
          return visibleImgs.every((img) => img.complete && img.naturalWidth > 0);
        },
        { timeout: 10000 },
      );

      const despuesPath = resolve(OUT_DIR, `miraflores-${vp.name}-despues.png`);
      await firstSection.screenshot({ path: despuesPath });
      console.log(`Guardado: miraflores-${vp.name}-despues.png`);

      await page.close();

      // Stitching comparativo con limafloralco
      const limaPath = resolve(OUT_DIR, `limafloralco-${vp.name}.png`);
      if (existsSync(limaPath)) {
        console.log(`Generando comparativa-${vp.name}.png con referencia limafloralco...`);
        const metaLima = await sharp(limaPath).metadata();
        const metaDespues = await sharp(despuesPath).metadata();

        const maxHeight = Math.max(metaLima.height || 0, metaDespues.height || 0);
        const gap = 24;
        const totalWidth = (metaLima.width || 0) + (metaDespues.width || 0) + gap;

        // Componer lado a lado
        await sharp({
          create: {
            width: totalWidth,
            height: maxHeight,
            channels: 4,
            background: { r: 248, g: 248, b: 248, alpha: 1 },
          },
        })
          .composite([
            { input: limaPath, top: 0, left: 0 },
            { input: despuesPath, top: 0, left: (metaLima.width || 0) + gap },
          ])
          .png()
          .toFile(resolve(OUT_DIR, `comparativa-${vp.name}.png`));

        console.log(`Guardado: comparativa-${vp.name}.png`);
      }
    }

    console.log("\n¡Todas las capturas 'despues' y comparativas fueron regeneradas con éxito!");
  } finally {
    await browser.close();
  }
}

capture().catch((e) => {
  console.error("Error al capturar:", e);
  process.exit(1);
});
