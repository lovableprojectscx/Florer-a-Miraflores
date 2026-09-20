import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCartStore } from "@/store/cart";

export function CartDrawer() {
  const { items, isOpen, cerrarCarrito, quitarItem, actualizarCantidad, total } = useCartStore();

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
        className={`fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrito de compras"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8DDD0]">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-normal text-[#2C2420]">Tu carrito</h2>
            {items.length > 0 && (
              <span className="font-body text-xs text-[#8A7A6E]">
                ({items.length} {items.length === 1 ? "producto" : "productos"})
              </span>
            )}
          </div>
          <button
            onClick={cerrarCarrito}
            aria-label="Cerrar carrito"
            className="p-2 -mr-2 text-[#8A7A6E] hover:text-[#2C2420] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Contenido */}
        {items.length === 0 ? (
          /* Carrito vacío */
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#8A7A6E]">
              <ShoppingBag className="h-7 w-7" strokeWidth={1.25} />
            </div>
            <div>
              <p className="font-display text-lg text-[#2C2420]">Tu carrito está vacío</p>
              <p className="font-body font-light text-[#8A7A6E] text-xs mt-1">
                Descubre nuestros arreglos florales frescos del día
              </p>
            </div>
            <Link
              to="/catalogo"
              onClick={cerrarCarrito}
              className="px-7 py-3 bg-[#2C2420] text-white text-xs tracking-widest uppercase font-body font-medium rounded-md hover:bg-[#1A1A1A] transition-colors shadow-xs"
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <>
            {/* Lista de items */}
            <ul className="flex-1 overflow-y-auto divide-y divide-[#E8DDD0]/70">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-4 items-center">
                  {/* Imagen */}
                  <div className="w-20 h-20 flex-shrink-0 bg-[#FAF8F5] rounded-lg overflow-hidden border border-[#E8DDD0]/50">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base font-normal text-[#2C2420] truncate">
                      {item.nombre}
                    </p>
                    <p className="font-body font-semibold text-xs sm:text-sm text-[#2C2420] mt-0.5">
                      S/. {item.precio.toFixed(2)} <span className="text-[10px] font-normal text-[#8A7A6E]">PEN</span>
                    </p>

                    {/* Selector de cantidad */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                        aria-label="Reducir cantidad"
                        className="w-7 h-7 flex items-center justify-center border border-[#E8DDD0] text-[#2C2420] hover:bg-[#FAF8F5] transition-colors rounded-md cursor-pointer"
                      >
                        <Minus className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                      <span className="font-body text-xs font-medium w-5 text-center text-[#2C2420]">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                        aria-label="Aumentar cantidad"
                        className="w-7 h-7 flex items-center justify-center border border-[#E8DDD0] text-[#2C2420] hover:bg-[#FAF8F5] transition-colors rounded-md cursor-pointer"
                      >
                        <Plus className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Precio total + eliminar */}
                  <div className="flex flex-col items-end justify-between h-20 py-1 flex-shrink-0">
                    <button
                      onClick={() => quitarItem(item.id)}
                      aria-label={`Eliminar ${item.nombre}`}
                      className="p-1 text-[#8A7A6E] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.25} />
                    </button>
                    <p className="font-body font-semibold text-xs sm:text-sm text-[#2C2420]">
                      S/. {(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-[#E8DDD0] px-6 py-5 space-y-3 bg-[#FAF8F5]/40">
              <div className="flex justify-between items-center">
                <span className="font-body text-xs uppercase tracking-wider text-[#8A7A6E]">Subtotal estimado</span>
                <span className="font-body text-lg font-semibold text-[#2C2420]">
                  S/. {subtotal.toFixed(2)} <span className="text-xs font-normal text-[#8A7A6E]">PEN</span>
                </span>
              </div>
              <p className="font-body font-light text-xs text-[#8A7A6E] leading-relaxed">
                El costo de delivery se calcula en el checkout según el distrito de entrega.
              </p>
              <Link
                to="/checkout"
                onClick={cerrarCarrito}
                className="block w-full py-3.5 text-center bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-xs tracking-widest uppercase font-body font-medium rounded-md transition-colors shadow-sm"
              >
                Continuar al checkout →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
