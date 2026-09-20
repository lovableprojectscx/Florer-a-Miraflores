import about from "@/assets/about-boutique.webp";
import { Check } from "lucide-react";

export function About() {
  return (
    <section id="about" className="px-5 md:px-12 lg:px-16 py-16 md:py-24 bg-white">
      <div className="max-w-[1536px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div>
          <p className="font-body text-[11px] md:text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-2.5 font-normal">
            — Nuestro atelier
          </p>
          <h2 className="font-display text-[#2C2420] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1]">
            Flores que hablan por ti.
          </h2>
          <p className="mt-4 md:mt-6 font-body font-light text-sm sm:text-base md:text-lg text-[#2C2420]/75 leading-relaxed max-w-xl">
            En Miraflores diseñamos arreglos únicos con flores de temporada, traídas frescas cada
            mañana. Cada ramo es una pequeña carta de amor, pensada para emocionar y crear memorias inolvidables.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              "Delivery el mismo día en Lima y Callao",
              "Arreglos únicos hechos a mano por maestros floristas",
              "Flores frescas de la más alta calidad seleccionadas cada mañana",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#2C2420] shrink-0 mt-0.5">
                  <Check className="w-3 h-3" strokeWidth={2} />
                </div>
                <span className="font-body font-light text-sm sm:text-base text-[#2C2420]/90">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-2xl shadow-md bg-[#FAF8F5] order-first lg:order-last aspect-[4/3]">
          <img
            src={about}
            alt="Florista arreglando flores en el atelier de Miraflores"
            loading="lazy"
            width={1000}
            height={1200}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          {/* Badge flotante de autenticidad */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md border border-[#E8DDD0]/80">
            <p className="font-body text-[10px] tracking-widest uppercase font-medium text-[#2C2420]">
              Atelier Miraflores
            </p>
            <p className="font-display text-xs sm:text-sm text-[#8A7A6E] italic">
              Flores 100% frescas cada mañana
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
