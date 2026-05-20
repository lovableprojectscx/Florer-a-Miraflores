import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCartStore } from "@/store/cart";

export function CartDrawer() {
  const { items, isOpen, cerrarCarrito, quitarItem, actualizarCantidad, total } =
    useCartStore();

  const subtotal = total();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={cerrarCarrito}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#FDFAF6] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrito de compras"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8DDD0]">
          <h2 className="font-display italic text-2xl text-[#2C2420]">Tu carrito</h2>
          <button
            onClick={cerrarCarrito}
            aria-label="Cerrar carrito"
            className="p-2 -mr-2 text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Contenido */}
        {items.length === 0 ? (
          /* Carrito vacío */
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
            <ShoppingBag className="h-14 w-14 text-[#E8DDD0]" strokeWidth={1} />
            <p className="font-body text-[#8A7A6E] text-sm text-center">
              Tu carrito está vacío
            </p>
            <Link
              to="/"
              onClick={cerrarCarrito}
              className="px-6 py-3 border border-[#C4956A] text-[#C4956A] text-xs tracking-widest uppercase font-body font-medium hover:bg-[#C4956A] hover:text-white transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            {/* Lista de items */}
            <ul className="flex-1 overflow-y-auto divide-y divide-[#E8DDD0]">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-4">
                  {/* Imagen */}
                  <div className="w-20 h-20 flex-shrink-0 bg-[#F5EFE6] rounded-xl overflow-hidden">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-[#2C2420] truncate">
                      {item.nombre}
                    </p>
                    <p className="font-body text-sm text-[#C4956A] mt-0.5">
                      S/ {item.precio.toFixed(2)}
                    </p>

                    {/* Selector de cantidad */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                        aria-label="Reducir cantidad"
                        className="w-7 h-7 flex items-center justify-center border border-[#E8DDD0] text-[#8A7A6E] hover:border-[#C4956A] hover:text-[#C4956A] transition-colors rounded"
                      >
                        <Minus className="h-3 w-3" strokeWidth={2} />
                      </button>
                      <span className="font-body text-sm w-5 text-center text-[#2C2420]">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                        aria-label="Aumentar cantidad"
                        className="w-7 h-7 flex items-center justify-center border border-[#E8DDD0] text-[#8A7A6E] hover:border-[#C4956A] hover:text-[#C4956A] transition-colors rounded"
                      >
                        <Plus className="h-3 w-3" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* Precio total + eliminar */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    <p className="font-body text-sm font-medium text-[#2C2420]">
                      S/ {(item.precio * item.cantidad).toFixed(2)}
                    </p>
                    <button
                      onClick={() => quitarItem(item.id)}
                      aria-label={`Eliminar ${item.nombre}`}
                      className="p-1 text-[#8A7A6E] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-[#E8DDD0] px-6 py-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-[#8A7A6E]">Subtotal</span>
                <span className="font-body text-base font-medium text-[#2C2420]">
                  S/ {subtotal.toFixed(2)}
                </span>
              </div>
              <p className="font-body text-xs text-[#8A7A6E]">
                Delivery se calcula al confirmar tu dirección.
              </p>
              <Link
                to="/checkout"
                onClick={cerrarCarrito}
                className="block w-full py-4 text-center bg-[#C4956A] hover:bg-[#9E7347] text-white text-xs tracking-widest uppercase font-body font-medium transition-colors"
              >
                Ir al checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
