import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface StaticFaq {
  id: string;
  pregunta: string;
  respuesta: string;
}

const FAQS_PREDETERMINADAS: StaticFaq[] = [
  {
    id: "1",
    pregunta: "¿Realizan envíos de flores el mismo día en Lima?",
    respuesta:
      "Sí. Ofrecemos servicio de entrega el mismo día en Miraflores, San Isidro, Surco, Barranco y Lince. Para garantizar la máxima frescura de nuestras flores y asegurar el despacho oportuno, le sugerimos completar su pedido antes de las 5:00 p.m.",
  },
  {
    id: "2",
    pregunta: "¿Cuál es el costo y cobertura del delivery?",
    respuesta:
      "Mantenemos una tarifa fija de S/ 10.00 para todos nuestros distritos de cobertura directa (Miraflores, Surco, Barranco, Lince y San Isidro). Cada arreglo es trasladado en vehículos especialmente acondicionados para preservar su frescura e integridad estructural durante todo el trayecto.",
  },
  {
    id: "3",
    pregunta: "¿Cómo puedo asegurar la máxima duración de mis flores?",
    respuesta:
      "Cada uno de nuestros arreglos incluye una selecta guía de cuidado. Le aconsejamos colocar las flores en un jarrón con agua limpia y fresca, recortar los tallos 1 cm en diagonal cada dos días y mantener el diseño en un ambiente fresco, alejado de corrientes de aire directas y de la exposición directa al sol.",
  },
  {
    id: "4",
    pregunta: "¿Los arreglos entregados son idénticos a los mostrados en las fotografías?",
    respuesta:
      "Nuestras creaciones se elaboran con flores frescas seleccionadas rigurosamente cada mañana. Al tratarse de elementos naturales, pueden presentar sutiles variaciones en el tono o grado de apertura. No obstante, le garantizamos que el estilo conceptual, el volumen y la sofisticación del diseño final serán equivalentes o superiores a lo ilustrado.",
  },
  {
    id: "5",
    pregunta: "¿Qué métodos de pago tienen disponibles?",
    respuesta:
      "Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, American Express y Diners Club) procesadas a través de la pasarela ultra segura de IZIPay. También puede realizar su pago de manera rápida mediante Yape, Plin o mediante transferencia bancaria directa a nuestras cuentas del BCP o BBVA.",
  },
  {
    id: "6",
    pregunta: "¿Es posible personalizar un diseño o añadir una dedicatoria especial?",
    respuesta:
      "Por supuesto. Todos nuestros arreglos florales y cajas de regalo incluyen de cortesía una fina tarjeta de dedicatoria impresa en papel texturado de alto gramaje. Si desea un diseño exclusivo a medida o flores muy específicas, nuestro equipo de floristas en el atelier estará encantado de asesorarle de manera personalizada a través de WhatsApp.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="px-5 md:px-10 lg:px-16 py-12 md:py-24 bg-[#F5EFE6]/40">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="lg:col-span-5 sticky top-24">
            <p className="font-italic-serif text-[#C4956A] text-sm md:text-lg mb-2">
              — resolvemos sus dudas
            </p>
            <h2 className="font-display text-[#2C2420] text-3xl md:text-5xl lg:text-6xl leading-[1.1]">
              Preguntas frecuentes.
            </h2>
            <p className="mt-4 md:mt-6 font-body font-light text-[#2C2420]/80 max-w-md text-sm md:text-base leading-relaxed">
              Descubra todo lo que necesita saber para asegurar una experiencia de compra impecable
              en nuestra boutique. Si requiere asistencia inmediata, nuestro equipo está siempre
              disponible para ayudarle.
            </p>
          </div>

          <div className="lg:col-span-7">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {FAQS_PREDETERMINADAS.map((item, i) => (
                <AccordionItem
                  key={item.id}
                  value={`item-${i}`}
                  className="border-b border-[#2C2420]/10"
                >
                  <AccordionTrigger className="text-left font-display text-base md:text-xl text-[#2C2420] hover:text-[#C4956A] hover:no-underline py-4 md:py-6 transition-colors">
                    {item.pregunta}
                  </AccordionTrigger>
                  <AccordionContent className="font-body font-light text-[#2C2420]/70 text-sm md:text-base pb-4 md:pb-6 leading-relaxed">
                    {item.respuesta}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
