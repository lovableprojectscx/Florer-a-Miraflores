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
    <section className="bg-ivory-soft px-5 md:px-10 lg:px-16 py-12 md:py-28">
      <div className="text-center mb-8 md:mb-20">
        <p className="font-italic-serif text-rose-accent text-sm md:text-lg mb-1 md:mb-2">
          -- ocasiones
        </p>
        <h2 className="font-display text-foreground text-3xl md:text-5xl lg:text-6xl">
          Flores para cada momento
        </h2>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
        {items.map((item) => {
          const IconComp = item.icono ? (ICON_MAP[item.icono] ?? Star) : Star;
          const cls =
            "group bg-card border border-border/80 aspect-square flex flex-col items-center justify-center gap-2 md:gap-4 md:hover:border-rose-accent/30 rounded-2xl md:hover:-translate-y-1.5 md:hover:shadow-[0_12px_30px_-8px_rgba(196,132,138,0.15)] transition-all duration-500";

          const inner = (
            <>
              <IconComp
                className="h-5 w-5 md:h-7 md:w-7 text-foreground/70 md:group-hover:text-rose-accent transform md:group-hover:scale-110 md:group-hover:-rotate-6 transition-all duration-300"
                strokeWidth={1.1}
              />
              <span className="text-[9px] md:text-[11px] tracking-wider-2 uppercase font-body font-light text-foreground/90 md:group-hover:text-foreground transition-colors text-center px-1">
                {item.nombre}
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
            <div key={item.id} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
