import { useEffect, useState } from "react";
import type { ConfigRow } from "@/types/database";

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
  if (config?.whatsapp)      messages.push(`WhatsApp ${config.whatsapp}`);
  const finalMessages = messages.length > 0 ? messages : FALLBACK_MESSAGES;

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (finalMessages.length <= 1) return;
    const t = setInterval(() => setIdx((n) => (n + 1) % finalMessages.length), 4000);
    return () => clearInterval(t);
  }, [finalMessages.length]);

  return (
    <div className="bg-[#C4956A] text-white text-center py-2 px-4">
      <p className="font-body text-[11px] tracking-widest uppercase font-light">
        {finalMessages[idx]}
      </p>
    </div>
  );
}
