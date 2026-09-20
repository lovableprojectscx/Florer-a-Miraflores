import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cart";
import type { CategoriaRow, ConfigRow } from "@/types/database";
import logoImg from "@/assets/logo-miraflores.webp";

interface Props {
  categorias: CategoriaRow[];
  config?: ConfigRow | null;
}

function WhatsappIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.66a11.92 11.92 0 0 0 5.77 1.47h.01c6.57 0 11.91-5.34 11.92-11.91 0-3.18-1.24-6.17-3.48-8.42ZM12.08 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.88-9.9 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47a8.97 8.97 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function Header({ categorias, config }: Props) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/catalogo`;
  };

  return (
    <header className="bg-[#FFFFFF] sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Search overlay drawer */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-0 bg-[#FFFFFF] border-b border-[#E8DDD0] z-40 py-4 px-6 md:px-12 animate-fadeIn shadow-md">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="h-5 w-5 text-[#8A7A6E]" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Buscar ramos, flores, ocasiones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none font-body text-sm md:text-base text-[#2C2420] placeholder-[#8A7A6E]/70 py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#8A7A6E] hover:text-[#2C2420] text-xs font-body uppercase tracking-wider"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-1 text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
              aria-label="Cerrar búsqueda"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      )}

      {/* Top tier */}
      <div className="px-5 md:px-12 h-20 md:h-24 grid grid-cols-3 items-center">
        {/* Left: Mobile hamburger or Desktop search */}
        <div className="flex items-center">
          <button
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="md:hidden p-2 -ml-2 text-[#2C2420] hover:opacity-70 transition-opacity"
          >
            <Menu className="h-6 w-6" strokeWidth={1.25} />
          </button>
          <button
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className="hidden md:inline-flex items-center gap-2 p-2 -ml-2 text-[#2C2420]/80 hover:text-[#2C2420] hover:opacity-80 transition-all cursor-pointer group"
          >
            <Search className="h-5 w-5 text-[#2C2420]/70 group-hover:text-[#2C2420]" strokeWidth={1.25} />
            <span className="text-[11px] tracking-widest uppercase font-body font-light text-[#2C2420]/70 group-hover:text-[#2C2420]">
              Buscar
            </span>
          </button>
        </div>

        {/* Center: Brand Logo */}
        <Link to="/" className="flex flex-col items-center justify-center text-center group">
          <img
            src={logoImg}
            alt="Florería Miraflores"
            className="h-9 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>

        {/* Right: Contact & Cart */}
        <div className="flex items-center justify-end gap-2 md:gap-3">
          <button
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 text-[#2C2420] hover:opacity-70 transition-opacity"
          >
            <Search className="h-5 w-5" strokeWidth={1.25} />
          </button>
          <a
            href={`https://wa.me/${(config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "")}`}
            aria-label="WhatsApp"
            className="hidden sm:flex items-center gap-1.5 p-2 text-[#2C2420]/80 hover:text-[#2C2420] transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsappIcon className="h-4 w-4" />
            <span className="hidden lg:inline text-[11px] tracking-wider uppercase font-body font-light">
              WhatsApp
            </span>
          </a>
          <button
            aria-label={`Carrito${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
            onClick={abrirCarrito}
            className="relative p-2 -mr-2 text-[#2C2420] hover:opacity-70 transition-opacity cursor-pointer"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 flex items-center justify-center bg-[#2C2420] text-white text-[9px] font-body font-medium rounded-full leading-none shadow-sm">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Nav (Bottom Tier) */}
      <nav className="hidden md:block border-t border-[#E8DDD0]/60">
        <ul className="px-6 md:px-12 flex gap-7 lg:gap-10 justify-center items-center h-12 whitespace-nowrap text-[11px] lg:text-[12px] tracking-[0.16em] uppercase font-body font-light">
          <li>
            <Link
              to="/"
              className="text-[#2C2420]/80 hover:text-[#2C2420] transition-colors relative py-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#2C2420] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
              activeProps={{ className: "text-[#2C2420] font-normal after:scale-x-100" }}
            >
              Inicio
            </Link>
          </li>
          {padres.map((c) => {
            const hijas = hijasMap[c.id] ?? [];
            const hasSub = hijas.length > 0;
            return (
              <li
                key={c.slug}
                className="relative py-3 group"
                onMouseEnter={() => setHoveredCat(c.id)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <Link
                  to="/categoria/$slug"
                  params={{ slug: c.slug }}
                  className="text-[#2C2420]/80 hover:text-[#2C2420] transition-colors inline-flex items-center gap-1 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#2C2420] after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform"
                  activeProps={{ className: "text-[#2C2420] font-normal after:scale-x-100" }}
                >
                  {c.nombre}
                  {hasSub && <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />}
                </Link>

                {/* Dropdown for subcategories */}
                {hasSub && hoveredCat === c.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[200px] bg-white border border-[#E8DDD0] shadow-lg py-2 z-50 animate-fadeIn rounded-sm">
                    {hijas.map((sub) => (
                      <Link
                        key={sub.id}
                        to="/categoria/$slug/$sub"
                        params={{ slug: c.slug, sub: sub.slug }}
                        className="block px-5 py-2.5 text-[11px] tracking-wider uppercase font-body font-light text-[#2C2420]/80 hover:text-[#2C2420] hover:bg-[#FAF8F5] transition-colors text-left"
                      >
                        {sub.nombre}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
          <li>
            <Link
              to="/catalogo"
              className="text-[#2C2420]/80 hover:text-[#2C2420] transition-colors relative py-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#2C2420] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
              activeProps={{ className: "text-[#2C2420] font-normal after:scale-x-100" }}
            >
              Catálogo
            </Link>
          </li>
          <li>
            <a
              href="/#about"
              className="text-[#2C2420]/80 hover:text-[#2C2420] transition-colors relative py-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#2C2420] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Nosotros
            </a>
          </li>
          <li>
            <a
              href="/#faq"
              className="text-[#2C2420]/80 hover:text-[#2C2420] transition-colors relative py-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#2C2420] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              Preguntas
            </a>
          </li>
        </ul>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 animate-fadeIn"
            onClick={close}
            aria-hidden
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-[86%] max-w-sm bg-white z-50 shadow-2xl flex flex-col animate-fade-in">
            <div className="flex items-center justify-between h-16 px-5 border-b border-[#E8DDD0]">
              <span className="font-display text-[#2C2420] text-lg italic">Menú</span>
              <button
                aria-label="Cerrar menú"
                onClick={close}
                className="p-2 -mr-2 text-[#2C2420] hover:opacity-70"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto">
              <div className="border-b border-[#E8DDD0]/60">
                <Link
                  to="/"
                  onClick={close}
                  className="block px-5 py-3.5 font-body text-xs tracking-widest uppercase text-[#2C2420] hover:bg-[#FAF8F5]"
                >
                  Inicio
                </Link>
              </div>

              {padres.map((c) => {
                const isOpen = openCat === c.id;
                const hijas = hijasMap[c.id] ?? [];
                return (
                  <div key={c.id} className="border-b border-[#E8DDD0]/60">
                    <div className="flex items-stretch">
                      <Link
                        to="/categoria/$slug"
                        params={{ slug: c.slug }}
                        onClick={close}
                        className="flex-1 px-5 py-3.5 font-body text-xs tracking-widest uppercase text-[#2C2420] hover:bg-[#FAF8F5]"
                      >
                        {c.nombre}
                      </Link>
                      {hijas.length > 0 && (
                        <button
                          aria-label={`Expandir ${c.nombre}`}
                          aria-expanded={isOpen}
                          onClick={() => setOpenCat(isOpen ? null : c.id)}
                          className="px-5 text-[#8A7A6E] hover:text-[#2C2420]"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            strokeWidth={1.5}
                          />
                        </button>
                      )}
                    </div>
                    {hijas.length > 0 && isOpen && (
                      <ul className="bg-[#FAF8F5] pb-2 border-t border-[#E8DDD0]/40">
                        {hijas.map((s) => (
                          <li key={s.id}>
                            <Link
                              to="/categoria/$slug/$sub"
                              params={{ slug: c.slug, sub: s.slug }}
                              onClick={close}
                              className="block px-8 py-2.5 text-[12px] font-body font-light text-[#2C2420]/80 hover:text-[#2C2420]"
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

              <div className="border-b border-[#E8DDD0]/60">
                <Link
                  to="/catalogo"
                  onClick={close}
                  className="block px-5 py-3.5 font-body text-xs tracking-widest uppercase text-[#2C2420] hover:bg-[#FAF8F5]"
                >
                  Catálogo Completo
                </Link>
              </div>

              {[
                { label: "Sobre nosotros", href: "/#about" },
                { label: "Zonas de delivery", href: "/#delivery" },
                { label: "Preguntas frecuentes", href: "/#faq" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={close}
                  className="block px-5 py-3.5 font-body text-xs tracking-widest uppercase text-[#2C2420]/80 hover:text-[#2C2420] hover:bg-[#FAF8F5] border-b border-[#E8DDD0]/60"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="p-5 border-t border-[#E8DDD0] bg-[#FAF8F5]">
              <a
                href={`https://wa.me/${(config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 bg-[#2C2420] text-white text-xs font-body tracking-wider uppercase rounded-md shadow-sm"
              >
                <WhatsappIcon className="h-4 w-4" />
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
