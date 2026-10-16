import { Link } from "@tanstack/react-router";
import { MapPin, ArrowRight, Heart } from "lucide-react";
import type { RecuerdoRow, CategoriaRow, DistritoRow } from "@/types/database";
import { ResponsiveImage } from "@/components/ResponsiveImage";

interface RecuerdoCardProps {
  recuerdo: RecuerdoRow;
  categorias?: CategoriaRow[];
  distritos?: DistritoRow[];
}

export function RecuerdoCard({ recuerdo, categorias = [], distritos = [] }: RecuerdoCardProps) {
  const categoria = categorias.find((c) => c.id === recuerdo.categoria_relacionada_id);
  const distrito = distritos.find((d) => d.id === recuerdo.distrito_id);

  return (
    <article className="group bg-[#FFFFFF] border border-[#E8DDD0] rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-[#C4956A]/60 transition-all duration-300 flex flex-col">
      {/* Marco de imagen tipo Polaroid / Galería */}
      <Link
        to="/recuerdos/$slug"
        params={{ slug: recuerdo.slug }}
        className="block relative aspect-[4/5] overflow-hidden bg-[#FAF8F5]"
        aria-label={`Ver historia de entrega: ${recuerdo.titulo}`}
      >
        {recuerdo.imagen_portada_url ? (
          <ResponsiveImage
            url={recuerdo.imagen_portada_url}
            alt={recuerdo.titulo}
            anchoMiniatura={480}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#8A7A6E]">
            <Heart className="w-10 h-10 stroke-[1.2] text-[#C4956A]/60 mb-2" />
            <span className="font-body text-xs font-light">Momento Florería Miraflores</span>
          </div>
        )}

        {/* Overlay degradado sutil al hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges superiores sobre la imagen: solo si realmente existen */}
        {(categoria || distrito) && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            {categoria && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-body tracking-wider uppercase bg-[#FDFAF6]/90 backdrop-blur-sm text-[#2C2420] border border-[#E8DDD0]/80 shadow-xs">
                {categoria.nombre}
              </span>
            )}
            {distrito && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-body tracking-wider uppercase bg-[#2C2420]/80 backdrop-blur-sm text-[#FDFAF6] shadow-xs ml-auto">
                <MapPin className="w-2.5 h-2.5 text-rose-accent" />
                {distrito.nombre}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Contenido descriptivo del recuerdo */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-[#FFFFFF]">
        <div>
          {/* Título emotivo */}
          <h2 className="font-display text-base sm:text-lg text-[#2C2420] group-hover:text-rose-accent transition-colors line-clamp-2 leading-snug">
            <Link to="/recuerdos/$slug" params={{ slug: recuerdo.slug }}>
              {recuerdo.titulo}
            </Link>
          </h2>

          {/* Frase destacada o dedicatoria auténtica */}
          {recuerdo.resumen && (
            <p className="mt-2 font-body font-light text-xs sm:text-sm text-[#5C5046] line-clamp-2 italic">
              "{recuerdo.resumen}"
            </p>
          )}
        </div>

        {/* Pie con enlace de acción */}
        <div className="mt-4 pt-3 border-t border-[#E8DDD0]/60 flex items-center justify-between">
          <span className="text-[11px] font-body tracking-wider uppercase text-[#8A7A6E] group-hover:text-[#2C2420] transition-colors">
            Ver entrega & arreglo
          </span>
          <span className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#2C2420] group-hover:bg-[#2C2420] group-hover:text-white group-hover:border-[#2C2420] transition-all">
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </article>
  );
}
