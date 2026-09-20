import { type ElementType } from "react";
import { Link } from "@tanstack/react-router";
import { Cake, Heart, Gem, Flower2, GraduationCap, Briefcase, Star } from "lucide-react";
import type { OcasionHomeRow } from "@/types/database";

const ICON_MAP: Record<string, ElementType> = {
  Cake,
  Heart,
  Gem,
  Flower2,
  GraduationCap,
  Briefcase,
  Star,
};

const FALLBACK = [
  { id: "1", nombre: "Cumpleanos", icono: "Cake", categoria_id: null, orden: 0, activo: true },
  { id: "2", nombre: "San Valentin", icono: "Heart", categoria_id: null, orden: 1, activo: true },
  { id: "3", nombre: "Aniversario", icono: "Gem", categoria_id: null, orden: 2, activo: true },
  { id: "4", nombre: "Duelo", icono: "Flower2", categoria_id: null, orden: 3, activo: true },
  {
    id: "5",
    nombre: "Graduacion",
    icono: "GraduationCap",
    categoria_id: null,
    orden: 4,
    activo: true,
  },
  {
    id: "6",
    nombre: "Corporativo",
    icono: "Briefcase",
    categoria_id: null,
    orden: 5,
    activo: true,
  },
];

interface Props {
  ocasiones: OcasionHomeRow[];
}

export function Occasions({ ocasiones }: Props) {
  const items = ocasiones.length > 0 ? ocasiones : (FALLBACK as OcasionHomeRow[]);

  return (
    <section className="bg-[#FAF8F5]/70 px-5 md:px-12 lg:px-16 py-16 md:py-24">
      <div className="max-w-[1536px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
          <p className="font-body text-[11px] md:text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-2 font-normal">
            — Momentos especiales
          </p>
          <h2 className="font-display text-[#2C2420] text-3xl md:text-5xl lg:text-6xl font-normal leading-tight">
            Flores para cada momento
          </h2>
          <p className="mt-3 font-body font-light text-[#2C2420]/70 text-sm md:text-base leading-relaxed">
            Encuentra el arreglo perfecto diseñado para celebrar, agradecer o sorprender a quien más quieres.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
          {items.map((item) => {
            const IconComp = item.icono ? (ICON_MAP[item.icono] ?? Star) : Star;
            const cls =
              "group bg-white border border-[#E8DDD0]/80 hover:border-[#2C2420] p-6 sm:p-7 flex flex-col items-center justify-center text-center rounded-xl shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[180px]";

            const inner = (
              <>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FAF8F5] group-hover:bg-[#2C2420] flex items-center justify-center transition-all duration-300 mb-3 sm:mb-4 shadow-xs">
                  <IconComp
                    className="h-5 w-5 sm:h-6 sm:w-6 text-[#2C2420] group-hover:text-white transition-colors duration-300"
                    strokeWidth={1.25}
                  />
                </div>
                <span className="text-[11px] sm:text-xs tracking-[0.14em] uppercase font-body font-normal text-[#2C2420] group-hover:text-[#2C2420] transition-colors">
                  {item.nombre}
                </span>
                <span className="text-[10px] font-body font-light text-[#8A7A6E] tracking-wider uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explorar →
                </span>
              </>
            );

            if (item.categoria_id) {
              return (
                <Link
                  key={item.id}
                  to="/categoria/$slug"
                  params={{ slug: item.categoria_id }}
                  className={cls}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                to="/catalogo"
                className={cls}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
