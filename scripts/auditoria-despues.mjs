import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE_URL = "http://localhost:8080";
const OUT_DIR = resolve("docs/evidencias/fase-06d/despues");
const VIEWPORTS = [
  { width: 360, height: 780, name: "360" },
  { width: 390, height: 844, name: "390" },
  { width: 414, height: 896, name: "414" },
];

const PAGES = [
  { name: "home", path: "/" },
  { name: "catalogo", path: "/catalogo" },
  { name: "categoria", path: "/categoria/tulipanes" },
  {
    name: "producto",
    path: "/producto/bouquet-armonia-de-girasoles-frescos-3ebb3652-4cfd-4889-9dd3-f984cacb8f34",
  },
];

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n=== Capturando viewport ${vp.name} (${vp.width}x${vp.height}) [DESPUÉS] ===`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });

      // 1. Páginas estándar
      for (const p of PAGES) {
        console.log(`Capturando ${p.name}-${vp.name}...`);
        const page = await context.newPage();
        await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(2000);

        // Scroll completo para asegurar lazy loading de imágenes
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

        const outPath = resolve(OUT_DIR, `${p.name}-${vp.name}.png`);
        await page.screenshot({ path: outPath, fullPage: true });
        console.log(`Guardado: ${outPath}`);
        await page.close();
      }

      // 2. Checkout (agregando producto para evitar redirect a /)
      console.log(`Capturando checkout-${vp.name}...`);
      const pageCheckout = await context.newPage();
      await pageCheckout.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
      await pageCheckout.goto(
        `${BASE_URL}/producto/bouquet-armonia-de-girasoles-frescos-3ebb3652-4cfd-4889-9dd3-f984cacb8f34`,
        {
          waitUntil: "networkidle",
        },
      );
      await pageCheckout.waitForTimeout(1500);

      // Clic en "Comprar ahora" para agregar al carrito e ir directo a checkout
      const comprarBtn = pageCheckout.locator("button:has-text('Comprar ahora')");
      if (await comprarBtn.isVisible()) {
        await comprarBtn.click();
      } else {
        await pageCheckout.locator("button:has-text('Agregar al carrito')").click();
        await pageCheckout.waitForTimeout(1000);
        await pageCheckout.goto(`${BASE_URL}/checkout`, { waitUntil: "networkidle" });
      }

      await pageCheckout.waitForURL("**/checkout", { timeout: 10000 });
      await pageCheckout.waitForTimeout(2000);

      const outCheckout = resolve(OUT_DIR, `checkout-${vp.name}.png`);
      await pageCheckout.screenshot({ path: outCheckout, fullPage: true });
      console.log(`Guardado: ${outCheckout}`);
      await pageCheckout.close();

      await context.close();
    }

    console.log("\n¡Todas las capturas 'después' completadas con éxito!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Error en auditoría después:", err);
  process.exit(1);
});
