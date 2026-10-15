import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "https://florer-a-miraflores.vercel.app";
const OUT_DIR = path.resolve("docs/evidencias/consolidado-deploy");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log(`Verificando despliegue en ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  // Esperar a que el deploy en Vercel esté activo con los cambios de la Fase 06-G
  const checkContext = await browser.newContext();
  const checkPage = await checkContext.newPage();
  let deployed = false;
  for (let intento = 1; intento <= 24; intento++) {
    try {
      console.log(`Intento ${intento}: verificando si Vercel tiene el nuevo deploy...`);
      await checkPage.goto(`${BASE_URL}/catalogo`, { waitUntil: "domcontentloaded", timeout: 15000 });
      // Verificar si ya tiene el nav compacto con aria-label="Ruta de navegación"
      const navCompacto = await checkPage.locator('nav[aria-label="Ruta de navegación"]').count();
      if (navCompacto > 0) {
        console.log("¡Nuevo deploy detectado con éxito!");
        deployed = true;
        break;
      }
    } catch (e) {
      console.log(`Error al chequear: ${e.message}`);
    }
    await checkPage.waitForTimeout(5000);
  }
  await checkPage.close();
  await checkContext.close();

  if (!deployed) {
    console.log("Aviso: Tomando capturas con la versión actual disponible en Vercel...");
  }

  const tasks = [
    // Paso 1: Colecciones Zoom + Marco en Home
    { url: `${BASE_URL}/`, name: "paso1-home-colecciones-1440.png", width: 1440, height: 900, selector: "#colecciones" },
    { url: `${BASE_URL}/`, name: "paso1-home-colecciones-390.png", width: 390, height: 844, selector: "#colecciones" },
    // Paso 2: Reseñas
    { url: `${BASE_URL}/resenas`, name: "paso2-resenas-1440.png", width: 1440, height: 900 },
    { url: `${BASE_URL}/resenas`, name: "paso2-resenas-390.png", width: 390, height: 844 },
    // Paso 3: Cabecera compacta
    { url: `${BASE_URL}/catalogo`, name: "paso3-catalogo-1366.png", width: 1366, height: 768 },
    { url: `${BASE_URL}/catalogo`, name: "paso3-catalogo-1440.png", width: 1440, height: 900 },
    { url: `${BASE_URL}/catalogo`, name: "paso3-catalogo-390.png", width: 390, height: 844 },
    { url: `${BASE_URL}/categoria/tulipanes`, name: "paso3-tulipanes-1366.png", width: 1366, height: 768 },
  ];

  for (const t of tasks) {
    const ctx = await browser.newContext({
      viewport: { width: t.width, height: t.height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
    try {
      console.log(`Capturando ${t.name} (${t.width}x${t.height})...`);
      await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);
      const filePath = path.join(OUT_DIR, t.name);

      if (t.selector) {
        const el = page.locator(t.selector);
        if ((await el.count()) > 0) {
          await el.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: filePath });
        } else {
          await page.screenshot({ path: filePath });
        }
      } else {
        await page.screenshot({ path: filePath });
      }
      console.log(`Guardado: ${filePath}`);
    } catch (err) {
      console.error(`Error al capturar ${t.name}:`, err.message);
    }
    await ctx.close();
  }

  await browser.close();
  console.log("Capturas post-deploy completadas.");
}

run().catch(console.error);
