import { Instagram, Facebook, BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ConfigRow } from "@/types/database";
import logoImg from "@/assets/logo-miraflores.webp";

interface Props {
  config: ConfigRow | null;
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.56V6.78a4.85 4.85 0 0 1-1.07-.09z" />
    </svg>
  );
}

export function Footer({ config }: Props) {
  const whatsapp = config?.whatsapp ?? "+51 999 600 482";
  const correo = config?.correo ?? "pedidos@floreriamiraflores.com";
  const horario = config?.horario ?? "Lunes a Domingo, 8:00 am a 8:00 pm";
  const instagram = config?.instagram_url ?? "https://www.instagram.com/floreriamirafloreslima";
  const tiktok = config?.tiktok_url ?? "https://www.tiktok.com/@floreriamirafloreslima";
  const facebook = config?.facebook_url ?? null;

  return (
    <footer className="bg-[#FFFFFF] border-t border-[#E8DDD0]/80">
      <div className="max-w-[1536px] mx-auto px-5 md:px-12 lg:px-16 py-16 md:py-20">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
          {/* Columna 1: Marca e Identidad */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img
                src={logoImg}
                alt="Florería Miraflores"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </Link>
            <p className="font-body font-light text-xs sm:text-sm text-[#2C2420]/75 leading-relaxed max-w-xs">
              Boutique floral especializada en arreglos de autor, ramos de rosas y detalles para ocasiones inolvidables en Lima.
            </p>
            <div className="pt-2">
              <p className="text-[10px] tracking-widest uppercase font-body text-[#8A7A6E] mb-1">
                Atención Inmediata
              </p>
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body font-medium text-sm text-[#2C2420] hover:text-[#8A7A6E] transition-colors"
              >
                {whatsapp}
              </a>
            </div>
          </div>

          {/* Columna 2: Tienda & Colecciones */}
          <div>
            <h4 className="font-body text-xs tracking-[0.2em] uppercase font-medium text-[#2C2420] mb-5">
              Colecciones
            </h4>
            <ul className="space-y-2.5 font-body font-light text-xs sm:text-sm text-[#2C2420]/75">
              {[
                { label: "Ramos y Bouquets", href: "/#categorias" },
                { label: "Box Florales de Lujo", href: "/#categorias" },
                { label: "Arreglos Especiales", href: "/#categorias" },
                { label: "Novedades de Temporada", href: "/#novedades" },
                { label: "Flores para Ocasiones", href: "/#ocasiones" },
                { label: "Catálogo Completo", href: "/catalogo" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="hover:text-[#2C2420] hover:translate-x-1 inline-block transition-all duration-200"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Información & Atelier */}
          <div>
            <h4 className="font-body text-xs tracking-[0.2em] uppercase font-medium text-[#2C2420] mb-5">
              Sobre Nosotros
            </h4>
            <ul className="space-y-2.5 font-body font-light text-xs sm:text-sm text-[#2C2420]/75">
              {[
                { label: "Nuestro Atelier", href: "/#about" },
                { label: "Zonas de Delivery y Cobertura", href: "/#delivery" },
                { label: "Preguntas Frecuentes", href: "/#faq" },
                { label: "Términos del Servicio", href: "/#faq" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="hover:text-[#2C2420] hover:translate-x-1 inline-block transition-all duration-200"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <span className="text-[#8A7A6E]">Email: </span>
                <a href={`mailto:${correo}`} className="hover:text-[#2C2420] transition-colors">
                  {correo}
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Horario & Redes Sociales */}
          <div>
            <h4 className="font-body text-xs tracking-[0.2em] uppercase font-medium text-[#2C2420] mb-5">
              Visítanos & Horarios
            </h4>
            <div className="space-y-3 font-body font-light text-xs sm:text-sm text-[#2C2420]/75">
              <p>Miraflores, Lima, Perú</p>
              <p className="text-xs text-[#8A7A6E]">
                Horario de atención:<br />
                <span className="text-[#2C2420] font-medium">{horario}</span>
              </p>
            </div>

            {/* Redes sociales */}
            <div className="mt-6">
              <p className="text-[10px] tracking-widest uppercase font-body text-[#8A7A6E] mb-3">
                Síguenos
              </p>
              <div className="flex gap-3">
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#2C2420] hover:bg-[#2C2420] hover:text-white transition-all duration-300 shadow-xs"
                >
                  <Instagram className="h-4 w-4" strokeWidth={1.5} />
                </a>
                {tiktok && (
                  <a
                    href={tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#2C2420] hover:bg-[#2C2420] hover:text-white transition-all duration-300 shadow-xs"
                  >
                    <TikTokIcon />
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#2C2420] hover:bg-[#2C2420] hover:text-white transition-all duration-300 shadow-xs"
                  >
                    <Facebook className="h-4 w-4" strokeWidth={1.5} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Franja de Medios de Pago & Seguridad */}
        <div className="mt-14 pt-8 border-t border-[#E8DDD0]/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-body text-[#8A7A6E]">
            <span>Pagos seguros con:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 border border-[#E8DDD0] rounded text-[10px] font-medium text-[#2C2420] bg-[#FAF8F5]">
                VISA
              </span>
              <span className="px-2 py-0.5 border border-[#E8DDD0] rounded text-[10px] font-medium text-[#2C2420] bg-[#FAF8F5]">
                Mastercard
              </span>
              <span className="px-2 py-0.5 border border-[#E8DDD0] rounded text-[10px] font-medium text-[#2C2420] bg-[#FAF8F5]">
                AMEX
              </span>
              <span className="px-2 py-0.5 border border-[#E8DDD0] rounded text-[10px] font-medium text-[#2C2420] bg-[#FAF8F5]">
                YAPE
              </span>
              <span className="px-2 py-0.5 border border-[#E8DDD0] rounded text-[10px] font-medium text-[#2C2420] bg-[#FAF8F5]">
                PLIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <p className="font-body font-light text-xs text-[#8A7A6E]">
              &copy; {new Date().getFullYear()} Florería Miraflores. Todos los derechos reservados.
            </p>
            {config?.libro_reclamaciones_activo !== false && (
              <Link
                to="/libro-de-reclamaciones"
                className="flex items-center gap-1.5 font-body font-medium text-xs text-[#2C2420] hover:text-[#8A7A6E] transition-colors border-b border-[#2C2420]/30 hover:border-[#2C2420] pb-0.5"
              >
                <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
                Libro de Reclamaciones
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
