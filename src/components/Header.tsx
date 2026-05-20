import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cart";
import type { CategoriaRow } from "@/types/database";

interface Props {
  categorias: CategoriaRow[];
}

function WhatsappIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.66a11.92 11.92 0 0 0 5.77 1.47h.01c6.57 0 11.91-5.34 11.92-11.91 0-3.18-1.24-6.17-3.48-8.42ZM12.08 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.88-9.9 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47a8.97 8.97 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function Header({ categorias }: Props) {
  const [open, setOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const close = () => {
    setOpen(false);
    setOpenCat(null);
  };

  const { totalItems, abrirCarrito } = useCartStore();
  const itemCount = totalItems();

  const padres = categorias.filter((c) => !c.parent_id);
  const hijasMap = categorias.reduce<Record<string, CategoriaRow[]>>((acc, c) => {
    if (c.parent_id) acc[c.parent_id] = [...(acc[c.parent_id] ?? []), c];
    return acc;
  }, {});

  return (
    <header className="bg-ivory">
      <div className="px-6 md:px-10 h-20 grid grid-cols-3 items-center">
        <div className="flex items-center">
          <button
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
            className="md:hidden p-2 -ml-2 hover:opacity-60 transition-opacity"
          >
            <Menu className="h-6 w-6" strokeWidth={1.25} />
          </button>
          <button
            aria-label="Buscar"
            className="hidden md:inline-flex p-2 -ml-2 hover:opacity-60 transition-opacity"
          >
            <Search className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </div>

        <Link to="/" className="flex flex-col items-center justify-center text-center leading-none">
          <span className="font-display italic font-bold text-3xl md:text-4xl tracking-tight">
            Miraflores
          </span>
          <span className="mt-1 text-[10px] tracking-widest uppercase font-body font-light text-muted-foreground">
            boutique floral
          </span>
        </Link>

        <div className="flex items-center justify-end gap-1">
          <a
            href="https://wa.me/51999600482"
            aria-label="WhatsApp"
            className="p-2 hover:opacity-60 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsappIcon className="h-5 w-5" />
          </a>
          <button
            aria-label={`Carrito${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
            onClick={abrirCarrito}
            className="relative p-2 -mr-2 hover:opacity-60 transition-opacity"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-[#C4956A] text-white text-[9px] font-body font-medium rounded-full leading-none">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:block border-t border-b border-border">
        <ul className="px-6 md:px-10 flex gap-6 md:gap-8 justify-center items-center h-12 whitespace-nowrap text-[12px] tracking-widest uppercase font-body font-light">
          <li>
            <Link to="/" className="text-foreground hover:opacity-70 transition-opacity">
              Inicio
            </Link>
          </li>
          {padres.map((c) => (
            <li key={c.slug}>
              <Link
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{ className: "text-foreground" }}
              >
                {c.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-foreground/40 z-40"
            onClick={close}
            aria-hidden
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-[86%] max-w-sm bg-background z-50 shadow-xl flex flex-col">
            <div className="flex items-center justify-between h-16 px-5 border-b border-border">
              <span className="font-italic-serif text-rose-accent text-lg">Catalogo</span>
              <button
                aria-label="Cerrar"
                onClick={close}
                className="p-2 -mr-2 text-foreground hover:opacity-70"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto">
              {padres.map((c) => {
                const isOpen = openCat === c.id;
                const hijas = hijasMap[c.id] ?? [];
                return (
                  <div key={c.id} className="border-b border-border/60">
                    <div className="flex items-stretch">
                      <Link
                        to="/categoria/$slug"
                        params={{ slug: c.slug }}
                        onClick={close}
                        className="flex-1 px-5 py-4 font-display text-foreground text-lg"
                      >
                        {c.nombre}
                      </Link>
                      {hijas.length > 0 && (
                        <button
                          aria-label={`Expandir ${c.nombre}`}
                          aria-expanded={isOpen}
                          onClick={() => setOpenCat(isOpen ? null : c.id)}
                          className="px-5 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown
                            className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            strokeWidth={1.5}
                          />
                        </button>
                      )}
                    </div>
                    {hijas.length > 0 && isOpen && (
                      <ul className="bg-ivory-soft/60 pb-2">
                        {hijas.map((s) => (
                          <li key={s.id}>
                            <Link
                              to="/categoria/$slug/$sub"
                              params={{ slug: c.slug, sub: s.slug }}
                              onClick={close}
                              className="block px-8 py-3 text-[13px] font-body font-light text-foreground/80 hover:text-foreground"
                            >
                              {s.nombre}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              {[
                { label: "Sobre nosotros", href: "/#about" },
                { label: "Preguntas frecuentes", href: "/#faq" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={close}
                  className="block px-5 py-4 font-display text-foreground text-lg border-b border-border/60"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
