import { test, expect, waitForHydration } from "./fixtures";

async function extractPrices(page: import("@playwright/test").Page): Promise<number[]> {
  const texts = await page.locator("main article").allInnerTexts();
  return texts.map((t) => {
    const match = t.match(/S\/\.\s*([\d.]+)/);
    return match ? Number(match[1]) : NaN;
  });
}

test.describe("Catálogo E2E — Filtros y ordenamiento", () => {
  test("muestra productos, filtra por categoría cambiando el contador y ordena por precio real", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await waitForHydration(page, "main select");

    const cards = page.locator("main article");
    await expect(cards.first()).toBeVisible();
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Verificar que el contador muestra el total inicial
    const counterText = page.locator("main").getByText(/Mostrando \d+ producto/);
    await expect(counterText).toContainText(String(initialCount));

    // Filtrar por la primera categoría específica disponible
    const catSelect = page
      .locator("label")
      .filter({ hasText: /^Categoría/ })
      .locator("select");
    const optionValues = await catSelect
      .locator("option")
      .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
    expect(optionValues.length).toBeGreaterThan(1);

    await catSelect.selectOption(optionValues[1]);
    await expect(counterText).not.toContainText(`Mostrando ${initialCount} `);

    // Volver a "todas" para probar el ordenamiento sobre el catálogo
    await catSelect.selectOption("todas");
    await expect(counterText).toContainText(String(initialCount));

    // Ordenar de menor a mayor precio
    const sortSelect = page.getByLabel("Ordenar por");
    await sortSelect.selectOption("precio_asc");

    const ascPrices = await extractPrices(page);
    expect(ascPrices.length).toBeGreaterThan(1);
    for (let i = 0; i < ascPrices.length - 1; i++) {
      expect(ascPrices[i]).toBeLessThanOrEqual(ascPrices[i + 1]);
    }

    // Ordenar de mayor a menor precio
    await sortSelect.selectOption("precio_desc");

    const descPrices = await extractPrices(page);
    expect(descPrices.length).toBeGreaterThan(1);
    for (let i = 0; i < descPrices.length - 1; i++) {
      expect(descPrices[i]).toBeGreaterThanOrEqual(descPrices[i + 1]);
    }
  });
});
