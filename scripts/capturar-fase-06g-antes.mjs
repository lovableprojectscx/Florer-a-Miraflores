import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function run() {
  const browser = await chromium.launch();
  const dir = path.resolve("docs/evidencias/fase-06g/antes");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const viewports = [
    { name: "1366", width: 1366, height: 768 },
    { name: "1440", width: 1440, height: 900 },
    { name: "390", width: 390, height: 844, isMobile: true },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: !!vp.isMobile,
      hasTouch: !!vp.isMobile,
    });
    const page = await context.newPage();

    // 1. Catálogo
    await page.goto("http://localhost:8080/catalogo");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(dir, `catalogo-${vp.name}-antes.png`) });
    console.log(`Captured catalogo-${vp.name}-antes.png`);

    // 2. Categoría padre
    await page.goto("http://localhost:8080/categoria/tulipanes");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(dir, `categoria-tulipanes-${vp.name}-antes.png`) });
    console.log(`Captured categoria-tulipanes-${vp.name}-antes.png`);

    // 3. Subcategoría
    await page.goto("http://localhost:8080/categoria/tulipanes/tulipanes-floreros");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(dir, `subcategoria-${vp.name}-antes.png`) });
    console.log(`Captured subcategoria-${vp.name}-antes.png`);

    await context.close();
  }

  await browser.close();
  console.log("Capturas ANTES completadas.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
