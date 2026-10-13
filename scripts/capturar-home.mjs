import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE_URL = "http://127.0.0.1:4173";
const SUFFIX = process.argv[2] || "antes"; // "antes" o "despues"

async function capturar() {
  const browser = await chromium.launch();

  for (const viewport of [
    { name: "390", width: 390, height: 844 },
    { name: "1440", width: 1440, height: 900 },
  ]) {
    console.log(
      `\n--- Capturando viewport ${viewport.name} (${viewport.width}x${viewport.height}) [${SUFFIX}] ---`,
    );
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });

    const page = await context.newPage();

    // Desactivar modal de popup
    await page.addInitScript(() => {
      localStorage.setItem("fm_popup_seen", "true");
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("main", { timeout: 10000 });

    // Scroll gradual hacia abajo para activar el lazy loading de todas las secciones
    console.log("Haciendo scroll gradual por toda la página...");
    await page.evaluate(async () => {
      const scrollStep = 350;
      const delay = 100;
      while (window.scrollY + window.innerHeight < document.body.scrollHeight) {
        window.scrollBy(0, scrollStep);
        await new Promise((r) => setTimeout(r, delay));
      }
      // Pequeña pausa al final
      await new Promise((r) => setTimeout(r, 500));
      // Scroll hacia arriba
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });

    // Esperar a que todas las imágenes en el documento hayan cargado
    console.log("Esperando carga completa de imágenes...");
    await page
      .waitForFunction(
        () => {
          const imgs = Array.from(document.querySelectorAll("main img"));
          // Verificar que al menos las imágenes de las primeras secciones tengan naturalWidth > 0
          return (
            imgs.length > 0 &&
            imgs.slice(0, 15).every((img) => img.complete && img.naturalWidth > 0)
          );
        },
        { timeout: 15000 },
      )
      .catch((e) => console.log("Aviso en waitForFunction:", e.message));

    // Revisión detallada de imágenes en "Globos para enamorar"
    const globosData = await page.evaluate(() => {
      const seccion = document.querySelector("#tag-globos_para_enamorar");
      if (!seccion) return { found: false, count: 0, imgs: [] };
      const imgs = Array.from(seccion.querySelectorAll("img"));
      return {
        found: true,
        count: imgs.length,
        imgs: imgs.map((img) => ({
          alt: img.alt,
          src: img.src,
          currentSrc: img.currentSrc,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        })),
      };
    });

    console.log(`Estado 'Globos para enamorar' (${viewport.name}):`, {
      found: globosData.found,
      totalImg: globosData.count,
      cargadasConExito: globosData.imgs.filter((i) => i.naturalWidth > 0).length,
    });

    // Captura del HOME completo
    const homePath = resolve(
      process.cwd(),
      `docs/evidencias/fase-06b/home-espaciado-${viewport.name}-${SUFFIX}.png`,
    );
    await page.screenshot({ path: homePath, fullPage: true });
    console.log(`Guardada captura completa del home en: ${homePath}`);

    // Si es "despues" o se pide re-hacer novedades:
    if (SUFFIX === "despues") {
      const novLocator = page.locator("#novedades");
      if ((await novLocator.count()) > 0) {
        const novPath = resolve(
          process.cwd(),
          `docs/evidencias/fase-06b/novedades-${viewport.name}-despues.png`,
        );
        await novLocator.screenshot({ path: novPath });
        console.log(`Guardada captura de novedades en: ${novPath}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nCapturas [${SUFFIX}] completadas exitosamente.`);
}

capturar().catch((err) => {
  console.error("Error en capturas:", err);
  process.exit(1);
});
