import { Truck, Clock, MapPin } from "lucide-react";

const ZONES = [
  "Miraflores",
  "San Isidro",
  "Surco",
  "Barranco",
  "Lince",
  "La Molina",
  "Magdalena",
  "San Borja",
];

export function DeliveryZones() {
  return (
    <section
      id="delivery"
      className="px-5 md:px-10 lg:px-16 py-14 md:py-24 bg-ivory"
    >
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          <div>
            <p className="font-italic-serif text-rose-accent text-sm md:text-lg mb-2">
              — llevamos tus flores
            </p>
            <h2 className="font-display text-foreground text-3xl md:text-5xl lg:text-6xl leading-tight">
              Delivery el mismo día en Lima.
            </h2>
            <p className="mt-4 md:mt-8 font-body font-light text-foreground/70 text-sm md:text-base leading-relaxed max-w-lg">
              Cada arreglo viaja en condiciones especiales para preservar su frescura. Realizá tu
              pedido antes de las 5:00 p.m. y llegará ese mismo día.
            </p>

            {/* Íconos informativos */}
            <div className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-6 md:gap-10">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-rose-accent mt-0.5 shrink-0" strokeWidth={1.3} />
                <div>
                  <p className="font-body text-xs tracking-widest uppercase text-foreground/60 mb-1">
                    Entrega
                  </p>
                  <p className="font-display text-foreground text-base">Mismo día</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-rose-accent mt-0.5 shrink-0" strokeWidth={1.3} />
                <div>
                  <p className="font-body text-xs tracking-widest uppercase text-foreground/60 mb-1">
                    Hora límite
                  </p>
                  <p className="font-display text-foreground text-base">Antes de las 5 p.m.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-rose-accent mt-0.5 shrink-0" strokeWidth={1.3} />
                <div>
                  <p className="font-body text-xs tracking-widest uppercase text-foreground/60 mb-1">
                    Cobertura
                  </p>
                  <p className="font-display text-foreground text-base">Lima Metropolitana</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de distritos */}
          <div className="grid grid-cols-2 gap-3">
            {ZONES.map((z) => (
              <div
                key={z}
                className="border border-border/70 p-4 md:p-5 hover:border-rose-accent/40 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(196,132,138,0.12)] transition-all duration-300"
              >
                <p className="font-display text-foreground text-base md:text-lg">{z}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
