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

const FAQS_ESTABLES: StaticFaq[] = [
  { 
    id: "1", 
    pregunta: "¿Hacen envíos de flores el mismo día?",          
    respuesta: "Sí. Para entregas el mismo día en Lima Metropolitana, asegúrate de realizar tu pedido antes de las 5:00 p.m. Nos esforzamos por entregar tus arreglos con la máxima frescura." 
  },
  { 
    id: "2", 
    pregunta: "¿Cómo cuido mis flores para que duren más tiempo?", 
    respuesta: "Recomendamos cambiar el agua del florero cada 48 horas, recortar los tallos 1 cm en diagonal y mantener el arreglo alejado de la luz solar directa o corrientes fuertes de aire. Así tus flores lucirán perfectas de 5 a 8 días." 
  },
  { 
    id: "3", 
    pregunta: "¿Puedo solicitar un ramo totalmente personalizado?",           
    respuesta: "¡Por supuesto! Nos encanta crear piezas exclusivas. Escríbenos directamente por WhatsApp indicando la ocasión especial, tu paleta de colores preferida y el presupuesto estimado para asesorarte de manera personalizada." 
  },
  { 
    id: "4", 
    pregunta: "¿Atienden eventos corporativos, bodas y banquetes?",   
    respuesta: "Sí, diseñamos la decoración floral completa para bodas, bautizos, aniversarios y activaciones corporativas. Te sugerimos agendar una asesoría de diseño con al menos 15 a 30 días de anticipación." 
  },
  { 
    id: "5", 
    pregunta: "¿Qué métodos de pago tienen disponibles?",          
    respuesta: "Aceptamos Yape, Plin, transferencias bancarias directas (BCP, BBVA, Interbank) y pagos seguros con tarjetas de crédito o débito Visa, Mastercard y American Express." 
  },
  { 
    id: "6", 
    pregunta: "¿Cuentan con garantía o políticas de cambio?",           
    respuesta: "La calidad es nuestra prioridad. Si tus flores sufren algún inconveniente crítico durante el transporte, por favor contáctanos con una foto del arreglo dentro de las primeras 12 horas para gestionar un reemplazo sin costo." 
  },
];

export function Faq() {
  return (
    <section id="faq" className="px-5 md:px-10 lg:px-16 py-12 md:py-16 bg-ivory-soft/60">
      <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-5">
          <p className="font-italic-serif text-rose-accent text-sm md:text-lg mb-1 md:mb-2">
            — resolvemos tus dudas
          </p>
          <h2 className="font-display text-foreground text-3xl md:text-5xl lg:text-6xl leading-tight">
            Preguntas frecuentes.
          </h2>
          <p className="mt-3 md:mt-6 font-body font-light text-foreground/80 max-w-md text-sm md:text-base">
            Todo lo que necesitas saber antes de tu compra. Si tienes alguna consulta adicional, nuestro equipo está listo para ayudarte por WhatsApp.
          </p>
        </div>

        <div className="lg:col-span-7">
          <Accordion type="single" collapsible className="w-full">
            {FAQS_ESTABLES.map((item, i) => (
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
      </div>
    </section>
  );
}
