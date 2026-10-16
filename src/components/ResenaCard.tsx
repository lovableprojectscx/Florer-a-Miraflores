import { useState } from "react";
import { Star, MessageCircle, ExternalLink, Image as ImageIcon } from "lucide-react";
import type { TestimonioRow } from "@/types/database";
import { formatTestimonioFecha } from "@/lib/resenas-utils";

interface ResenaCardProps {
  testimonio: TestimonioRow;
  clampText?: boolean;
}

function FuenteBadge({
  fuente,
  enlace,
}: {
  fuente: TestimonioRow["fuente"];
  enlace: string | null;
}) {
  const content = (() => {
    switch (fuente) {
      case "google":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4285F4] bg-[#4285F4]/10 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </span>
        );
      case "whatsapp":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-full">
            <MessageCircle className="w-3 h-3" />
            WhatsApp
          </span>
        );
      case "facebook":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1877F2] bg-[#1877F2]/10 px-2 py-0.5 rounded-full">
            Facebook
          </span>
        );
      case "directo":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8A7A6E] bg-[#E8DDD0]/50 px-2 py-0.5 rounded-full">
            Cliente verificado
          </span>
        );
    }
  })();

  if (enlace) {
    return (
      <a
        href={enlace}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity inline-flex items-center gap-1"
        title="Ver reseña original"
      >
        {content}
        <ExternalLink className="w-2.5 h-2.5 text-[#8A7A6E]" />
      </a>
    );
  }

  return content;
}

export function ResenaCard({ testimonio, clampText = true }: ResenaCardProps) {
  const [expandido, setExpandido] = useState(false);
  const [modalFoto, setModalFoto] = useState(false);

  const textoLargo = testimonio.texto.length > 200;

  const fechaFormateada = formatTestimonioFecha(testimonio.fecha);

  return (
    <>
      <article className="h-full bg-white border border-[#E8DDD0]/70 rounded-lg p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow duration-300">
        <div>
          {/* Header de la tarjeta: Estrellas y Fuente */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div
              className="flex items-center gap-1"
              aria-label={`${testimonio.estrellas} de 5 estrellas`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < testimonio.estrellas
                      ? "fill-[#E0A96D] text-[#E0A96D]"
                      : "fill-[#E8DDD0]/40 text-[#E8DDD0]"
                  }`}
                  strokeWidth={1}
                />
              ))}
            </div>
            <FuenteBadge fuente={testimonio.fuente} enlace={testimonio.enlace_original} />
          </div>

          {/* Texto de la reseña */}
          <div className="text-[#2C2420]/85 font-body text-sm leading-relaxed mb-4">
            <p className={clampText && !expandido && textoLargo ? "line-clamp-6" : ""}>
              “{testimonio.texto}”
            </p>
            {clampText && textoLargo && (
              <button
                type="button"
                onClick={() => setExpandido(!expandido)}
                className="mt-2 text-xs font-medium text-[#C4848A] hover:underline cursor-pointer"
              >
                {expandido ? "Leer menos" : "Leer más"}
              </button>
            )}
          </div>
        </div>

        {/* Footer de la tarjeta: Autor, Fecha y Foto si hay */}
        <div className="pt-3 border-t border-[#E8DDD0]/50 flex items-center justify-between gap-3 mt-auto">
          <div className="min-w-0">
            <h4 className="font-body font-medium text-sm text-[#2C2420] truncate">
              {testimonio.nombre}
            </h4>
            {fechaFormateada && (
              <p className="font-body text-xs text-[#8A7A6E]">{fechaFormateada}</p>
            )}
          </div>

          {testimonio.imagen_url && (
            <button
              type="button"
              onClick={() => setModalFoto(true)}
              className="relative shrink-0 w-12 h-12 rounded overflow-hidden border border-[#E8DDD0] hover:opacity-90 transition-opacity group cursor-pointer"
              title="Ver foto del arreglo"
              aria-label="Ver foto del arreglo"
            >
              <img
                src={testimonio.imagen_url}
                alt={`Foto compartida por ${testimonio.nombre}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ImageIcon className="w-4 h-4" />
              </span>
            </button>
          )}
        </div>
      </article>

      {/* Modal visor de foto opcional */}
      {modalFoto && testimonio.imagen_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fadeIn"
          onClick={() => setModalFoto(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-lg overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={testimonio.imagen_url}
              alt={`Foto compartida por ${testimonio.nombre}`}
              className="w-full h-auto max-h-[75vh] object-contain rounded"
            />
            <div className="p-3 text-center">
              <p className="font-body text-sm font-medium text-[#2C2420]">{testimonio.nombre}</p>
              <button
                type="button"
                onClick={() => setModalFoto(false)}
                className="mt-2 text-xs font-medium text-[#8A7A6E] hover:text-[#2C2420] underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
