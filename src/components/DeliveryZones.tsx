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
      className="px-5 md:px-12 lg:px-16 py-16 md:py-24 bg-[#FAF8F5]/60"
    >
      <div className="max-w-[1536px] mx-auto">
        {/* Encabezado */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div>
            <p className="font-body text-[11px] md:text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-2.5 font-normal">
              — Llevamos tus flores
            </p>
            <h2 className="font-display text-[#2C2420] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-tight">
              Delivery el mismo día en Lima.
            </h2>
            <p className="mt-4 md:mt-6 font-body font-light text-[#2C2420]/75 text-sm sm:text-base md:text-lg leading-relaxed max-w-lg">
              Cada arreglo viaja en condiciones especiales de hidratación y cuidado para preservar su frescura intacta. Realiza tu pedido antes de las 5:00 p.m. y llegará ese mismo día.
            </p>

            {/* Íconos informativos */}
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-6 md:gap-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center shrink-0 shadow-xs">
                  <Truck className="h-5 w-5 text-[#2C2420]" strokeWidth={1.25} />
                </div>
                <div>
                  <p className="font-body text-[10px] tracking-widest uppercase text-[#8A7A6E] mb-0.5">
                    Entrega
                  </p>
                  <p className="font-body font-medium text-[#2C2420] text-sm sm:text-base">Mismo día</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="h-5 w-5 text-[#2C2420]" strokeWidth={1.25} />
                </div>
                <div>
                  <p className="font-body text-[10px] tracking-widest uppercase text-[#8A7A6E] mb-0.5">
                    Hora límite
                  </p>
                  <p className="font-body font-medium text-[#2C2420] text-sm sm:text-base">Antes de las 5 p.m.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center shrink-0 shadow-xs">
                  <MapPin className="h-5 w-5 text-[#2C2420]" strokeWidth={1.25} />
                </div>
                <div>
                  <p className="font-body text-[10px] tracking-widest uppercase text-[#8A7A6E] mb-0.5">
                    Cobertura
                  </p>
                  <p className="font-body font-medium text-[#2C2420] text-sm sm:text-base">Lima y Callao</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de distritos */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            {ZONES.map((z) => (
              <div
                key={z}
                className="bg-white border border-[#E8DDD0]/80 rounded-xl p-4 sm:p-5 flex items-center justify-between hover:border-[#2C2420] hover:shadow-xs transition-all duration-300 group cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#A7A18C] group-hover:bg-[#2C2420] transition-colors" />
                  <p className="font-body font-medium text-[#2C2420] text-sm sm:text-base">{z}</p>
                </div>
                <span className="text-[10px] tracking-wider uppercase font-body font-light text-[#8A7A6E] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                  Activo
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
