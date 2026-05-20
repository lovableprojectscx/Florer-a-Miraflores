import about from "@/assets/about-boutique.jpg";

export function About() {
  return (
    <section className="px-5 md:px-10 lg:px-16 py-10 md:py-16">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div>
          <p className="font-italic-serif text-rose-accent text-sm md:text-lg mb-2 md:mb-4">
            — sobre nosotros
          </p>
          <h2 className="font-display italic text-foreground text-3xl md:text-5xl lg:text-6xl leading-[1.05]">
            Flores que hablan por ti.
          </h2>
          <p className="mt-4 md:mt-8 font-body font-light text-sm md:text-lg text-muted-foreground leading-relaxed max-w-lg">
            En Miraflores diseñamos arreglos únicos con flores de temporada, traídas frescas cada
            mañana. Cada ramo es una pequeña carta de amor, pensada para emocionar.
          </p>

          <ul className="mt-6 md:mt-10 space-y-3 md:space-y-4">
            {[
              "Delivery el mismo día en Lima y Callao",
              "Arreglos únicos hechos a mano",
              "Flores frescas seleccionadas cada mañana",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-2 h-px w-6 bg-rose-accent shrink-0" />
                <span className="font-body font-light text-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="relative overflow-hidden bg-ivory-soft order-first lg:order-last"
          style={{ aspectRatio: "4/3" }}
        >
          <img
            src={about}
            alt="Florista arreglando flores en el atelier de Miraflores"
            loading="lazy"
            width={1000}
            height={1200}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
