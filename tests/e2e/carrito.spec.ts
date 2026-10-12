import { test, expect, waitForHydration } from "./fixtures";

function parseCurrency(text: string): number {
  const match = text.match(/S\/\.\s*([\d.]+)/);
  return match ? Number(match[1]) : NaN;
}

test.describe("Carrito E2E — Drawer y operaciones", () => {
  test("agregar producto abre el drawer, actualiza contador del header, +/- cambia subtotal y eliminar vacía", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await waitForHydration(page, "main article button");

    const firstCard = page.locator("main article").first();
    await expect(firstCard).toBeVisible();

    await firstCard.getByRole("button", { name: /agregar al carrito/i }).click();

    const drawer = page.getByRole("dialog", { name: "Carrito de compras" });
    await expect(drawer).toHaveClass(/translate-x-0/);
    await expect(drawer.getByRole("heading", { name: "Tu carrito" })).toBeVisible();

    // Verificar contador en el header (1 item)
    await expect(page.getByRole("button", { name: "Carrito (1 items)" })).toBeVisible();

    // Leer subtotal inicial
    const subtotalRow = drawer
      .locator("div")
      .filter({ hasText: /^Subtotal estimado/ })
      .first();
    const initialSubtotalText = await subtotalRow.innerText();
    const unitPrice = parseCurrency(initialSubtotalText);
    expect(unitPrice).toBeGreaterThan(0);

    // Aumentar cantidad (+)
    await drawer.getByRole("button", { name: "Aumentar cantidad" }).click();
    await expect(page.getByRole("button", { name: "Carrito (2 items)" })).toBeVisible();
    await expect(subtotalRow).toContainText(`S/. ${(unitPrice * 2).toFixed(2)}`);

    // Reducir cantidad (-)
    await drawer.getByRole("button", { name: "Reducir cantidad" }).click();
    await expect(page.getByRole("button", { name: "Carrito (1 items)" })).toBeVisible();
    await expect(subtotalRow).toContainText(`S/. ${unitPrice.toFixed(2)}`);

    // Eliminar item
    await drawer.getByRole("button", { name: /^Eliminar /i }).click();
    await expect(drawer.getByText("Tu carrito está vacío")).toBeVisible();
  });
});
