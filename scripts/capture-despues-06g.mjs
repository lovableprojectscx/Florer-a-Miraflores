import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = path.resolve("docs/evidencias/fase-06g/despues");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  { url: "http://localhost:8080/catalogo", prefix: "catalogo" },
  { url: "http://localhost:8080/categoria/tulipanes", prefix: "categoria-tulipanes" },
  { url: "http://localhost:8080/categoria/ocasion/cumpleanos", prefix: "subcategoria" },
];

const viewports = [
  { width: 1366, height: 768, name: "1366" },
  { width: 1440, height: 900, name: "1440" },
  { width: 390, height: 844, name: "390" },
];

async function run() {
  const browser = await chromium.launch();
  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });
    for (const target of targets) {
      console.log(`Capturing ${target.prefix} at ${vp.name}...`);
      await page.goto(target.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const filePath = path.join(outDir, `${target.prefix}-${vp.name}-despues.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved: ${filePath}`);
    }
    await page.close();
  }
  await browser.close();
  console.log("All screenshots captured successfully.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
