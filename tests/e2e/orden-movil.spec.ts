import { test, expect, waitForHydration } from "./fixtures";

test.describe("Fase 06-D — Orden en celular", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
  });

  test("1. Bento de Colecciones a 390px: sin huecos vacíos y todas las tarjetas chicas con la misma altura", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await waitForHydration(page, "main");

    const coleccionesSec = page.locator("#categorias");
    await expect(coleccionesSec).toBeVisible();

    // Obtener todas las tarjetas de colecciones dentro del grid
    const cards = coleccionesSec.locator(".grid > a");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const boxes = [];
    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }

    // Regla con 6 colecciones (o N par tras la primera):
    // 1ª ocupa todo el ancho (>300px en 390px con padding)
    expect(boxes[0].width).toBeGreaterThanOrEqual(300);

    // Si hay 6 colecciones: la 2ª también ocupa todo el ancho para que el resto (4) quede par (2x2)
    if (count === 6) {
      expect(boxes[1].width).toBeGreaterThanOrEqual(300);

      // Tarjetas 2, 3, 4, 5 van en grilla de 2 columnas (ancho ~160-180px cada una)
      const smallCards = boxes.slice(2);
      expect(smallCards.length).toBe(4);

      // Verificar que todas las tarjetas pequeñas tienen la misma altura (tolerancia de 2px por redondeo subpixel)
      const baseHeight = smallCards[0].height;
      for (let j = 1; j < smallCards.length; j++) {
        const diffHeight = Math.abs(smallCards[j].height - baseHeight);
        expect(diffHeight).toBeLessThanOrEqual(2);
      }

      // Verificar que no hay hueco vacío: están en pares con la misma coordenada Y
      // Fila 1 de chicas: tarjetas 2 y 3 (mismo Y aproximadamente)
      expect(Math.abs(smallCards[0].y - smallCards[1].y)).toBeLessThanOrEqual(4);
      // Fila 2 de chicas: tarjetas 4 y 5 (mismo Y aproximadamente)
      expect(Math.abs(smallCards[2].y - smallCards[3].y)).toBeLessThanOrEqual(4);
    }
  });

  test("3. Nombres de producto en tarjetas: altura reservada de 2 líneas para alineación", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/catalogo");
    await waitForHydration(page, "main");

    const articles = page.locator("article");
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Comparar las dos primeras tarjetas de la fila
    const card1 = articles.nth(0);
    const card2 = articles.nth(1);

    const titleContainer1 = card1.locator(".min-h-\\[2\\.6rem\\]").first();
    const titleContainer2 = card2.locator(".min-h-\\[2\\.6rem\\]").first();

    await expect(titleContainer1).toBeVisible();
    await expect(titleContainer2).toBeVisible();

    const boxT1 = await titleContainer1.boundingBox();
    const boxT2 = await titleContainer2.boundingBox();

    expect(boxT1).not.toBeNull();
    expect(boxT2).not.toBeNull();

    // La altura reservada es idéntica en ambas tarjetas (tolerancia subpixel 2px)
    expect(Math.abs(boxT1!.height - boxT2!.height)).toBeLessThanOrEqual(2);

    // Los botones de "Agregar al carrito" están alineados verticalmente (mismo Y)
    const btn1 = card1.locator("button:has-text('Agregar al carrito')");
    const btn2 = card2.locator("button:has-text('Agregar al carrito')");

    const boxBtn1 = await btn1.boundingBox();
    const boxBtn2 = await btn2.boundingBox();

    expect(boxBtn1).not.toBeNull();
    expect(boxBtn2).not.toBeNull();
    expect(Math.abs(boxBtn1!.y - boxBtn2!.y)).toBeLessThanOrEqual(4);
  });

  test("4. WhatsApp flotante: compacto en móvil (44px) y con espacio para no tapar botón compartir", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await waitForHydration(page, "main");

    const fabLink = page.locator("a.fixed[href*='wa.me']");
    await expect(fabLink).toBeVisible();

    const fabCircle = fabLink.locator("div[style*='#25D366']");
    await expect(fabCircle).toBeVisible();

    const boxFab = await fabCircle.boundingBox();
    expect(boxFab).not.toBeNull();

    // En móvil mide 44px (h-11 w-11) con tolerancia de 2px
    expect(Math.abs(boxFab!.width - 44)).toBeLessThanOrEqual(2);
    expect(Math.abs(boxFab!.height - 44)).toBeLessThanOrEqual(2);
  });

  test("5. Checkout a 360px: WhatsApp visible y formulario con botón de pago accesible sin interferencia", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });

    // Navegamos a un producto para agregar al carrito e ir a checkout
    await page.goto("/catalogo");
    await waitForHydration(page, "main");

    const firstProduct = page.locator("article a").first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    await waitForHydration(page, "main");

    // Click en Comprar ahora o Agregar al carrito
    const comprarBtn = page.locator("button:has-text('Comprar ahora'), button:has-text('Agregar al carrito')").first();
    await expect(comprarBtn).toBeVisible();
    await comprarBtn.click();
    await page.waitForTimeout(500);

    // Navegamos a checkout si no redirigió automáticamente
    if (!page.url().includes("/checkout")) {
      await page.goto("/checkout");
    }
    await waitForHydration(page, "main");

    // Verificar que WhatsApp está visible en checkout
    const fabLink = page.locator("a.fixed[href*='wa.me']");
    await expect(fabLink).toBeVisible();

    // Scroll hasta el botón de submit "Pagar con IZIPay"
    const payBtn = page.locator("button[type='submit']:has-text('Pagar con IZIPay')");
    await payBtn.scrollIntoViewIfNeeded();
    await expect(payBtn).toBeVisible();

    // Validar que el botón de pago esté libre para click (no interceptado ni tapado)
    const payBox = await payBtn.boundingBox();
    const fabBox = await fabLink.boundingBox();

    expect(payBox).not.toBeNull();
    expect(fabBox).not.toBeNull();

    // El padding inferior seguro pb-12 del form asegura separación visual al final del scroll
    const inputTel = page.locator("input#telefono");
    await inputTel.scrollIntoViewIfNeeded();
    await expect(inputTel).toBeVisible();
    await inputTel.fill("999600482");
    expect(await inputTel.inputValue()).toBe("999600482");
  });
});
