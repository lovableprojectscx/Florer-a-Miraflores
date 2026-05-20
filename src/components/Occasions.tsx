import { Link } from "@tanstack/react-router";
import { Cake, Heart, Gem, Flower2, GraduationCap, Briefcase, Star } from "lucide-react";
import type { OcasionHomeRow } from "@/types/database";

const ICON_MAP: Record<string, React.ElementType> = {
  Cake, Heart, Gem, Flower2, GraduationCap, Briefcase, Star,
};

const FALLBACK = [
  { id: "1", nombre: "Cumpleanos",   icono: "Cake",          categoria_id: null, orden: 0, activo: true },
  { id: "2", nombre: "San Valentin", icono: "Heart",         categoria_id: null, orden: 1, activo: true },
  { id: "3", nombre: "Aniversario",  icono: "Gem",           categoria_id: null, orden: 2, activo: true },
  { id: "4", nombre: "Duelo",        icono: "Flower2",       categoria_id: null, orden: 3, activo: true },
  { id: "5", nombre: "Graduacion",   icono: "GraduationCap", categoria_id: null, orden: 4, activo: true },
  { id: "6", nombre: "Corporativo",  icono: "Briefcase",     categoria_id: null, orden: 5, activo: true },
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

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {items.map((item) => {
          const IconComp = item.icono ? (ICON_MAP[item.icono] ?? Star) : Star;
          const cls = "group bg-ivory border border-border aspect-square flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-rose-accent transition-colors duration-300";

          const inner = (
            <>
              <IconComp className="h-5 w-5 md:h-7 md:w-7 text-foreground/80 group-hover:text-rose-accent transition-colors" strokeWidth={1.2} />
              <span className="text-[9px] md:text-[11px] tracking-wider-2 uppercase font-body font-light text-foreground text-center px-1">
                {item.nombre}
              </span>
            </>
          );

          if (item.categoria_id) {
            return (
              <Link key={item.id} to="/categoria/$slug" params={{ slug: item.categoria_id }} className={cls}>
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
