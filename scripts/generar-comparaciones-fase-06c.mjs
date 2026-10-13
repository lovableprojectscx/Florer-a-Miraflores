import { chromium } from "playwright";
import { resolve } from "node:path";
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";

const COMP_DIR = resolve("docs/evidencias/fase-06c/comparacion");
const FASE_DIR = resolve("docs/evidencias/fase-06c");

if (!existsSync(COMP_DIR)) mkdirSync(COMP_DIR, { recursive: true });

async function scrollPage(page) {
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
  await page.waitForTimeout(1000);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // ── 1. Banner 1440 Después ──
    console.log("--- Capturando Banner 1440 Después ---");
    const pageBanner = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageBanner.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
    await pageBanner.goto("http://localhost:8080/", { waitUntil: "networkidle" });
    await pageBanner.waitForTimeout(2000);

    const heroSection = pageBanner.locator("section.w-full.bg-white").first();
    const bannerImg = heroSection.locator("img").first();
    const despuesSrc = await bannerImg.evaluate((img) => img.currentSrc);
    console.log("Banner currentSrc DESPUES:", despuesSrc);

    const bannerDespuesPath = resolve(FASE_DIR, "banner-1440-despues.png");
    await heroSection.screenshot({ path: bannerDespuesPath });
    console.log("Banner guardado en:", bannerDespuesPath);
    await pageBanner.close();

    // ── 2. Capturas Comparativas Home y Producto ──
    const viewports = [
      { name: "1440", width: 1440, height: 900 },
      { name: "390", width: 390, height: 844 },
    ];

    const targets = [
      { type: "home", path8080: "/", path8085: "/" },
      {
        type: "producto",
        path8080: "/producto/box-romantico",
        path8085: "/producto/box-romantico",
      },
    ];

    for (const vp of viewports) {
      for (const tgt of targets) {
        console.log(`--- Capturando ${tgt.type} en ${vp.name} ---`);

        // Origin/main (8085)
        const pMain = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        await pMain.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
        await pMain.goto(`http://localhost:8085${tgt.path8085}`, { waitUntil: "networkidle" });
        await scrollPage(pMain);
        const pathMain = resolve(COMP_DIR, `${tgt.type}-${vp.name}-origin-main.png`);
        await pMain.screenshot({ path: pathMain, fullPage: tgt.type === "home" });
        await pMain.close();

        // Master / fase-06c (8080)
        const pMaster = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        await pMaster.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
        await pMaster.goto(`http://localhost:8080${tgt.path8080}`, { waitUntil: "networkidle" });
        await scrollPage(pMaster);
        const pathMaster = resolve(COMP_DIR, `${tgt.type}-${vp.name}-master.png`);
        await pMaster.screenshot({ path: pathMaster, fullPage: tgt.type === "home" });
        await pMaster.close();

        // Stitching side by side con Sharp
        console.log(`Uniendo imágenes lado a lado: ${tgt.type}-${vp.name}...`);
        const metaMain = await sharp(pathMain).metadata();
        const metaMaster = await sharp(pathMaster).metadata();

        const targetHeight = Math.min(metaMain.height || 0, metaMaster.height || 0, 4000);
        const resizedMain = await sharp(pathMain)
          .resize({ width: metaMain.width, height: targetHeight, fit: "cover", position: "top" })
          .toBuffer();
        const resizedMaster = await sharp(pathMaster)
          .resize({ width: metaMaster.width, height: targetHeight, fit: "cover", position: "top" })
          .toBuffer();

        const totalWidth = (metaMain.width || 0) + (metaMaster.width || 0) + 20; // 20px gap

        const sideBySide = await sharp({
          create: {
            width: totalWidth,
            height: targetHeight,
            channels: 4,
            background: { r: 240, g: 240, b: 240, alpha: 1 },
          },
        })
          .composite([
            { input: resizedMain, top: 0, left: 0 },
            { input: resizedMaster, top: 0, left: (metaMain.width || 0) + 20 },
          ])
          .png()
          .toFile(resolve(COMP_DIR, `comparacion-${tgt.type}-${vp.name}.png`));

        console.log(`Generado: comparacion-${tgt.type}-${vp.name}.png`);
      }
    }

    console.log("¡Todas las capturas y comparaciones generadas con éxito!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Error en generación:", err);
  process.exit(1);
});
