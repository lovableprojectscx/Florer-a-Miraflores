import { useEffect, useState } from "react";
import type { ConfigRow } from "@/types/database";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FALLBACK_MESSAGES = [
  "Pide hasta las 6 PM y recibelo el mismo dia!",
  "Delivery en Miraflores, Surco, Barranco, Lince y San Isidro",
  "Consulta por WhatsApp +51 999 600 482",
];

interface Props {
  config: ConfigRow | null;
}

export function AnnouncementBar({ config }: Props) {
  const messages: string[] = [];
  if (config?.anuncio_barra) messages.push(config.anuncio_barra);
  if (config?.whatsapp) messages.push(`WhatsApp ${config.whatsapp}`);
  const finalMessages = messages.length > 0 ? messages : FALLBACK_MESSAGES;

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (finalMessages.length <= 1) return;
    const t = setInterval(() => setIdx((n) => (n + 1) % finalMessages.length), 4000);
    return () => clearInterval(t);
  }, [finalMessages.length]);

  const handlePrev = () => {
    setIdx((n) => (n - 1 + finalMessages.length) % finalMessages.length);
  };

  const handleNext = () => {
    setIdx((n) => (n + 1) % finalMessages.length);
  };

  return (
    <div className="bg-[#FAF8F5] text-[#2C2420] border-b border-[#E8DDD0]/70 py-2.5 px-3 sm:px-8 relative flex items-center justify-between select-none transition-colors duration-300">
      {finalMessages.length > 1 ? (
        <button
          onClick={handlePrev}
          aria-label="Anuncio anterior"
          className="p-1 text-[#2C2420]/60 hover:text-[#2C2420] hover:bg-black/5 rounded-full transition-colors cursor-pointer flex-shrink-0"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
        </button>
      ) : (
        <div className="w-5" />
      )}

      <div className="flex-1 text-center px-2 overflow-hidden">
        <p className="font-body text-[11px] sm:text-xs tracking-[0.2em] uppercase font-normal text-[#2C2420]/90 truncate">
          {finalMessages[idx]}
        </p>
      </div>

      {finalMessages.length > 1 ? (
        <button
          onClick={handleNext}
          aria-label="Siguiente anuncio"
          className="p-1 text-[#2C2420]/60 hover:text-[#2C2420] hover:bg-black/5 rounded-full transition-colors cursor-pointer flex-shrink-0"
        >
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
        </button>
      ) : (
        <div className="w-5" />
      )}
    </div>
  );
}
