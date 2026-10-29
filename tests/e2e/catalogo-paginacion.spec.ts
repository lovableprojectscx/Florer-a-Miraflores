import { test, expect, waitForHydration } from "./fixtures";

test.describe("Catálogo E2E — Paginación 'Ver más' y layout de tarjetas", () => {
  test("muestra máximo 24 tarjetas al inicio, 'Ver más' carga lotes hasta el total y desaparece, y cambiar filtro reinicia a 24", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/catalogo");
    await waitForHydration(page, "main select");

    const cards = page.locator("main article");
    await expect(cards.first()).toBeVisible();

    // Extraer N real del contador superior "Mostrando N productos"
    const topCounter = page.locator("main").getByText(/Mostrando \d+ producto/);
    await expect(topCounter).toBeVisible();
    const topText = (await topCounter.innerText()).trim();
    const matchTotal = topText.match(/Mostrando\s+(\d+)\s+producto/);
    const totalReal = matchTotal ? Number(matchTotal[1]) : 0;
    expect(totalReal).toBeGreaterThan(24);

    // Al inicio se muestran 24 tarjetas y el texto "Mostrando 24 de N"
    await expect(cards).toHaveCount(24);
    const footerCounter = page.locator('main [aria-live="polite"]');
    await expect(footerCounter).toHaveText(`Mostrando 24 de ${totalReal}`);

    const btnVerMas = page.getByRole("button", { name: /^Ver más$/i });
    await expect(btnVerMas).toBeVisible();

    // Primer clic en "Ver más" -> agrega hasta 24 más (48 o totalReal)
    await btnVerMas.click();
    const esperadoTras1Clic = Math.min(48, totalReal);
    await expect(cards).toHaveCount(esperadoTras1Clic);
    await expect(footerCounter).toHaveText(`Mostrando ${esperadoTras1Clic} de ${totalReal}`);

    // Cambiar el filtro de orden vuelve a 24 tarjetas
    const sortSelect = page.getByLabel("Ordenar por");
    await sortSelect.selectOption("precio_asc");
    await expect(cards).toHaveCount(24);
    await expect(footerCounter).toHaveText(`Mostrando 24 de ${totalReal}`);

    // Hacer clic en "Ver más" hasta llegar al totalReal y verificar que el botón desaparece
    let actual = 24;
    while (actual < totalReal) {
      await expect(btnVerMas).toBeVisible();
      await btnVerMas.scrollIntoViewIfNeeded();
      await btnVerMas.click();
      actual = Math.min(actual + 24, totalReal);
      await expect(cards).toHaveCount(actual);
      await expect(footerCounter).toHaveText(`Mostrando ${actual} de ${totalReal}`);
    }

    await expect(btnVerMas).toBeHidden();
  });

  test("respeta columnas por viewport (mobile: 2 cols >=165px; desktop 1440: 4 cols) y sin scroll horizontal", async ({
    page,
  }, testInfo) => {
    await page.goto("/catalogo");
    await waitForHydration(page, "main select");

    const cards = page.locator("main article");
    await expect(cards.first()).toBeVisible();

    // Ninguna página tiene scroll horizontal (scrollWidth <= clientWidth)
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();
    const box3 = await cards.nth(2).boundingBox();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();
    expect(box3).not.toBeNull();

    if (testInfo.project.name === "mobile") {
      // En mobile: exactamente 2 columnas (tarjetas 1 y 2 en la misma fila; tarjeta 3 en la siguiente fila)
      expect(Math.abs(box1!.y - box2!.y)).toBeLessThan(2);
      expect(box3!.y).toBeGreaterThan(box1!.y + 50);

      // Una tarjeta en mobile tiene al menos ~165 px de ancho
      expect(box1!.width).toBeGreaterThanOrEqual(165);
    } else {
      // En desktop (1440px): como máximo 4 por fila (tarjetas 1..4 en la primera fila, tarjeta 5 en la segunda)
      const box4 = await cards.nth(3).boundingBox();
      const box5 = await cards.nth(4).boundingBox();
      expect(box4).not.toBeNull();
      expect(box5).not.toBeNull();

      expect(Math.abs(box1!.y - box2!.y)).toBeLessThan(2);
      expect(Math.abs(box1!.y - box3!.y)).toBeLessThan(2);
      expect(Math.abs(box1!.y - box4!.y)).toBeLessThan(2);
      expect(box5!.y).toBeGreaterThan(box1!.y + 50);
    }
  });

  test("al hacer scroll hasta el final del primer lote, todas las <img> de las 24 tarjetas cargan con naturalWidth > 0", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await waitForHydration(page, "main select");

    const cards = page.locator("main article");
    await expect(cards).toHaveCount(24);

    const images = page.locator("main article img");
    await expect(images).toHaveCount(24);

    // Hacer scroll progresivo por todas las tarjetas del primer lote hasta el final
    for (let i = 0; i < 24; i++) {
      await cards.nth(i).scrollIntoViewIfNeeded();
      if (i % 4 === 0) {
        await page.waitForTimeout(100);
      }
    }

    const footerCounter = page.locator('main [aria-live="polite"]');
    await footerCounter.scrollIntoViewIfNeeded();

    // Esperar a que todas las 24 imágenes terminen de cargar y tengan naturalWidth > 0
    await expect
      .poll(
        async () => {
          return await images.evaluateAll(
            (imgs) =>
              imgs.filter((img) => {
                const el = img as HTMLImageElement;
                return el.complete && el.naturalWidth > 0;
              }).length,
          );
        },
        { timeout: 20000 },
      )
      .toBe(24);

    const naturalWidths = await images.evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).naturalWidth),
    );

    expect(naturalWidths).toHaveLength(24);
    for (let i = 0; i < naturalWidths.length; i++) {
      expect(
        naturalWidths[i],
        `La imagen de la tarjeta #${i + 1} debería tener naturalWidth > 0`,
      ).toBeGreaterThan(0);
    }
  });
});
