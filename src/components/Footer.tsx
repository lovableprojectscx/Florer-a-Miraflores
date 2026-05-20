import { Instagram, Facebook, BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ConfigRow } from "@/types/database";

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
  const horario = config?.horario ?? "Lunes a Domingo, 9am a 9pm";
  const instagram = config?.instagram_url ?? "https://www.instagram.com/floreriamirafloreslima";
  const tiktok = config?.tiktok_url ?? "https://www.tiktok.com/@floreriamirafloreslima";
  const facebook = config?.facebook_url ?? null;

  return (
    <footer className="bg-ivory border-t border-border">
      <div className="px-6 md:px-10 lg:px-16 py-16 grid md:grid-cols-3 gap-12">
        {/* Marca */}
        <div>
          <div className="flex flex-col leading-none">
            <span className="font-display italic font-bold text-3xl">Miraflores</span>
            <span className="mt-1 text-[10px] tracking-widest uppercase font-body font-light text-muted-foreground">
              boutique floral
            </span>
          </div>
          <p className="mt-6 font-italic-serif text-foreground/80 text-lg max-w-xs">
            Flores frescas, arreglos hechos con amor en el corazon de Lima.
          </p>
        </div>

        {/* Tienda */}
        <div>
          <h4 className="font-display text-lg mb-5 text-foreground">Tienda</h4>
          <ul className="space-y-3 font-body font-light text-sm text-muted-foreground">
            {["Ramos", "Box Florales", "Arreglos", "Coronas", "Ocasiones", "Delivery"].map((l) => (
              <li key={l}>
                <a href="/#catalogo" className="hover:text-foreground transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="font-display text-lg mb-5 text-foreground">Contacto</h4>
          <ul className="space-y-3 font-body font-light text-sm text-muted-foreground">
            <li>Miraflores, Lima, Peru</li>
            <li>
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {whatsapp}
              </a>
            </li>
            <li>
              <a href={`mailto:${correo}`} className="hover:text-foreground transition-colors">
                {correo}
              </a>
            </li>
            <li>{horario}</li>
          </ul>

          {/* Redes sociales */}
          <div className="mt-6 flex gap-4">
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              <Instagram className="h-5 w-5" strokeWidth={1.25} />
            </a>
            {tiktok && (
              <a
                href={tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-foreground/60 hover:text-foreground transition-colors"
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
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" strokeWidth={1.25} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border px-6 md:px-10 lg:px-16 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="font-body font-light text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Floreria Miraflores. Todos los derechos reservados.
        </p>
        {config?.libro_reclamaciones_activo !== false && (
          <Link
            to="/libro-de-reclamaciones"
            className="flex items-center gap-2 font-body font-light text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
            Libro de Reclamaciones
          </Link>
        )}
      </div>
    </footer>
  );
}
