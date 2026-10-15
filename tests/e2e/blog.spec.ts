import { test, expect } from "./fixtures";

test.describe("Fase 09 / Pivote Recuerdos — Redirecciones 301 de Blog", () => {
  test("Redirección 301: /blog redirige hacia /recuerdos", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveURL(/\/recuerdos/);
  });

  test("Redirección 301: /blog/$slug redirige hacia /recuerdos/$slug", async ({ page }) => {
    await page.goto("/blog/sorpresa-cumpleanos-globos-flores");
    await expect(page).toHaveURL(/\/recuerdos\/sorpresa-cumpleanos-globos-flores/);
  });
});
