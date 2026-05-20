import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqRow } from "@/types/database";

const FALLBACK: FaqRow[] = [
  { id: "1", pregunta: "Hacen delivery el mismo dia?",          respuesta: "Si. Los pedidos realizados antes de las 2:00 p.m. se entregan el mismo dia en Lima Metropolitana.", orden: 0, activo: true },
  { id: "2", pregunta: "Como cuido mis flores para que duren?", respuesta: "Cambia el agua cada 48 horas, recorta los tallos en diagonal y mantenlos lejos de la luz directa. Con estos cuidados duran entre 5 y 8 dias.", orden: 1, activo: true },
  { id: "3", pregunta: "Puedo personalizar un ramo?",           respuesta: "Por supuesto. Escribenos por WhatsApp con la ocasion, paleta de colores y presupuesto.", orden: 2, activo: true },
  { id: "4", pregunta: "Trabajan eventos, bodas y empresas?",   respuesta: "Si. Atendemos bodas, bautizos, aniversarios y decoracion corporativa. Solicita asesoria con al menos 30 dias de anticipacion.", orden: 3, activo: true },
  { id: "5", pregunta: "Que metodos de pago aceptan?",          respuesta: "Aceptamos Yape, Plin, transferencia bancaria, tarjetas Visa y Mastercard.", orden: 4, activo: true },
  { id: "6", pregunta: "Tienen politica de cambios?",           respuesta: "Si el arreglo llega en mal estado, lo reemplazamos sin costo dentro de las 24 horas siguientes.", orden: 5, activo: true },
];

interface Props {
  faqs: FaqRow[];
}

export function Faq({ faqs }: Props) {
  const items = faqs.length > 0 ? faqs : FALLBACK;

  return (
    <section id="faq" className="px-5 md:px-10 lg:px-16 py-12 md:py-28 bg-ivory-soft/60">
      <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-5">
          <p className="font-italic-serif text-rose-accent text-sm md:text-lg mb-1 md:mb-2">
            -- resolvemos tus dudas
          </p>
          <h2 className="font-display text-foreground text-3xl md:text-5xl lg:text-6xl leading-tight">
            Preguntas frecuentes.
          </h2>
          <p className="mt-3 md:mt-6 font-body font-light text-foreground/80 max-w-md text-sm md:text-base">
            Todo lo que necesitas saber antes de tu compra. Si no encuentras tu respuesta, escribenos por WhatsApp.
          </p>
        </div>

        <div className="lg:col-span-7">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, i) => (
              <AccordionItem key={item.id} value={`item-${i}`} className="border-b border-foreground/15">
                <AccordionTrigger className="text-left font-display text-base md:text-2xl text-foreground hover:no-underline py-4 md:py-6">
                  {item.pregunta}
                </AccordionTrigger>
                <AccordionContent className="font-body font-light text-foreground/70 text-sm md:text-base pb-4 md:pb-6">
                  {item.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
