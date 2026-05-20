import { create } from "zustand";

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Acciones
  agregarItem: (producto: Omit<CartItem, "cantidad"> & { cantidad?: number }) => void;
  quitarItem: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  abrirCarrito: () => void;
  cerrarCarrito: () => void;

  // Derivados
  total: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isOpen: false,

  agregarItem: (producto) => {
    set((state) => {
      const existente = state.items.find((i) => i.id === producto.id);
      if (existente) {
        return {
          items: state.items.map((i) =>
            i.id === producto.id ? { ...i, cantidad: i.cantidad + (producto.cantidad ?? 1) } : i,
          ),
        };
      }
      return {
        items: [...state.items, { ...producto, cantidad: producto.cantidad ?? 1 }],
      };
    });
  },

  quitarItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  actualizarCantidad: (id, cantidad) => {
    if (cantidad < 1) return;
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, cantidad } : i)),
    }));
  },

  vaciarCarrito: () => set({ items: [] }),

  abrirCarrito: () => set({ isOpen: true }),

  cerrarCarrito: () => set({ isOpen: false }),

  total: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  },

  totalItems: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + i.cantidad, 0);
  },
}));
