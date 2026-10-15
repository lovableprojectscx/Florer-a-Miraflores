import { test, expect } from "./fixtures";

test.describe("Categorías públicas — visibilidad y navegación sin categorías vacías", () => {
  test("Todas las categorías y subcategorías visibles en el menú abren sin 404, tienen >= 1 producto y ninguna muestra 'próximamente'", async ({
    page,
    isMobile,
  }) => {
    test.setTimeout(120_000);

    await page.goto("/catalogo");
    await expect(page.locator("header").first()).toBeVisible();

    const urlsMenu = new Set<string>();

    if (isMobile) {
      const menuBtn = page.getByRole("button", { name: /abrir menú/i });
      await menuBtn.click();

      // Recolectar padres visibles en el drawer móvil
      const parentHrefs = await page
        .locator('header a[href^="/categoria/"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? "").filter(Boolean));
      for (const href of parentHrefs) urlsMenu.add(href);

      // Expandir cada categoría con subcategorías para recolectar sus hijas visibles
      const expandBtns = page.locator('header button[aria-label^="Expandir "]');
      const count = await expandBtns.count();
      for (let i = 0; i < count; i++) {
        await expandBtns.nth(i).click();
        const subHrefs = await page
          .locator('header ul a[href^="/categoria/"]')
          .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? "").filter(Boolean));
        for (const href of subHrefs) urlsMenu.add(href);
      }
    } else {
      const navItems = page.locator("header nav ul > li");
      const itemCount = await navItems.count();

      for (let i = 0; i < itemCount; i++) {
        const li = navItems.nth(i);
        await li.hover();
        const hrefs = await li
          .locator('a[href^="/categoria/"]')
          .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? "").filter(Boolean));
        for (const href of hrefs) urlsMenu.add(href);
      }
    }

    const listaUrls = Array.from(urlsMenu);
    expect(listaUrls.length).toBeGreaterThan(0);

    // Nacimientos ahora es padre en el menú principal (39 productos activos)
    expect(listaUrls).toContain("/categoria/nacimientos");

    // Subcategorías vacías (0 productos) no deben aparecer en el menú
    expect(listaUrls).not.toContain("/categoria/tulipanes/ramos-tulipanes");
    expect(listaUrls).not.toContain("/categoria/nacimientos/nacimientos-nino");
    expect(listaUrls).not.toContain("/categoria/nacimientos/nacimientos-nina");
    expect(listaUrls).not.toContain("/categoria/defuncion/lagrimas");

    for (const url of listaUrls) {
      const response = await page.goto(url);
      expect(response?.status(), `Status HTTP inesperado en ${url}`).toBeLessThan(400);

      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.getByText(/categoría no encontrada|page not found/i)).toHaveCount(0);
      await expect(
        page.getByText(/próximamente/i),
        `La URL del menú ${url} no debe mostrar 'próximamente'`,
      ).toHaveCount(0);

      const productLinks = page.locator('main a[href^="/producto/"]');
      await expect(
        productLinks.first(),
        `La categoría visible ${url} debe mostrar al menos 1 producto`,
      ).toBeVisible();
    }
  });

  test("/categoria/ocasion/nacimientos no da 404 (funciona antes de SQL 003 y redirige a /categoria/nacimientos después)", async ({
    page,
  }) => {
    const response = await page.goto("/categoria/ocasion/nacimientos");
    expect(response?.status()).toBeLessThan(400);

    await expect(page).toHaveURL(/\/categoria\/nacimientos$/);
    await expect(page.getByRole("heading", { name: /nacimientos/i })).toBeVisible();
    await expect(page.getByText(/no encontrado|page not found/i)).toHaveCount(0);

    const productLinks = page.locator('main a[href^="/producto/"]');
    await expect(productLinks.first()).toBeVisible();
  });

  test("Entrar directo por URL a una subcategoría vacía (/categoria/defuncion/lagrimas) no da 404, muestra 'próximamente'", async ({
    page,
  }) => {
    const response = await page.goto("/categoria/defuncion/lagrimas");
    expect(response?.status()).toBeLessThan(400);

    await expect(page.getByRole("heading", { name: /lágrimas/i })).toBeVisible();
    await expect(page.getByText(/próximamente/i)).toBeVisible();
  });
});
