import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
  await page.goto("http://localhost:4173/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  // Screenshot hero section
  const hero = page.locator("section").first();
  await hero.screenshot({ path: "docs/evidencias/home-banners-verificacion.png" });
  console.log("Screenshot saved to docs/evidencias/home-banners-verificacion.png");

  // Screenshot Lanzamientos especiales section
  const lanzamientos = page.locator("#novedades, section:has-text('Lanzamientos')").first();
  await lanzamientos.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await lanzamientos.screenshot({ path: "docs/evidencias/home-lanzamientos-verificacion.png" });
  console.log("Screenshot saved to docs/evidencias/home-lanzamientos-verificacion.png");

  // Screenshot Catalogo
  await page.goto("http://localhost:4173/catalogo", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "docs/evidencias/catalogo-verificacion.png" });
  console.log("Screenshot saved to docs/evidencias/catalogo-verificacion.png");

  await browser.close();
}

main().catch(console.error);
