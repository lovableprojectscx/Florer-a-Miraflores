import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/store/cart";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
  });

  it("agrega un item nuevo con cantidad por defecto 1", () => {
    useCartStore.getState().agregarItem({
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
      cantidad: 1,
    });
  });

  it("suma la cantidad al agregar un item ya existente", () => {
    const store = useCartStore.getState();
    store.agregarItem({
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
      cantidad: 2,
    });
    store.agregarItem({
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
      cantidad: 3,
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].cantidad).toBe(5);
  });

  it("quita un item por id", () => {
    const store = useCartStore.getState();
    store.agregarItem({
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
    });
    store.agregarItem({
      id: "prod-2",
      nombre: "Velvet Box",
      precio: 220,
      imagen: "/img/velvet.webp",
    });

    store.quitarItem("prod-1");

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("prod-2");
  });

  it("actualizarCantidad cambia la cantidad y ignora valores menores a 1", () => {
    const store = useCartStore.getState();
    store.agregarItem({
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
      cantidad: 2,
    });

    store.actualizarCantidad("prod-1", 4);
    expect(useCartStore.getState().items[0].cantidad).toBe(4);

    store.actualizarCantidad("prod-1", 0);
    expect(useCartStore.getState().items[0].cantidad).toBe(4);

    store.actualizarCantidad("prod-1", -3);
    expect(useCartStore.getState().items[0].cantidad).toBe(4);
  });

  it("vacía el carrito por completo", () => {
    const store = useCartStore.getState();
    store.agregarItem({
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
    });
    store.vaciarCarrito();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("calcula total() y totalItems() correctamente", () => {
    const store = useCartStore.getState();
    store.agregarItem({
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 100,
      imagen: "/img/ramo.webp",
      cantidad: 2,
    });
    store.agregarItem({
      id: "prod-2",
      nombre: "Velvet Box",
      precio: 150,
      imagen: "/img/velvet.webp",
      cantidad: 3,
    });

    expect(useCartStore.getState().total()).toBe(200 + 450);
    expect(useCartStore.getState().totalItems()).toBe(5);
  });

  it("abre y cierra el drawer del carrito", () => {
    const store = useCartStore.getState();
    expect(useCartStore.getState().isOpen).toBe(false);
    store.abrirCarrito();
    expect(useCartStore.getState().isOpen).toBe(true);
    store.cerrarCarrito();
    expect(useCartStore.getState().isOpen).toBe(false);
  });
});
