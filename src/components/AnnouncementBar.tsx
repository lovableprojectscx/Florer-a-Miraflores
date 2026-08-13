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
    <div className="bg-[#F77278] text-white py-2 px-3 sm:px-6 relative flex items-center justify-between select-none">
      {finalMessages.length > 1 ? (
        <button
          onClick={handlePrev}
          aria-label="Anuncio anterior"
          className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : (
        <div className="w-6" />
      )}

      <div className="flex-1 text-center px-2 overflow-hidden">
        <p className="font-body text-[11px] sm:text-xs tracking-widest uppercase font-light truncate">
          {finalMessages[idx]}
        </p>
      </div>

      {finalMessages.length > 1 ? (
        <button
          onClick={handleNext}
          aria-label="Siguiente anuncio"
          className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : (
        <div className="w-6" />
      )}
    </div>
  );
}
