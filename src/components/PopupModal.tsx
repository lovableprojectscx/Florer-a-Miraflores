import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { PopupRow } from "@/types/database";

interface Props {
  popup: PopupRow | null;
}

export function PopupModal({ popup }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!popup) return;
    if (!popup.activo) return;

    // Verificar fecha de expiración en el cliente
    if (popup.fecha_expiracion) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const expira = new Date(popup.fecha_expiracion + "T00:00:00");
      if (hoy > expira) return; // ya venció
    }

    // Mostrar popup con ligero delay para no bloquear el LCP
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [popup]);

  if (!visible || !popup) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      onClick={() => setVisible(false)}
    >
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" aria-hidden />

      {/* Modal */}
      <div
        className="relative bg-white shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in"
        style={{ animationDuration: "350ms" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 hover:bg-white text-[#2C2420] transition-colors shadow"
          aria-label="Cerrar popup"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        {/* Imagen */}
        {popup.imagen_url && (
          <img
            src={popup.imagen_url}
            alt="Promoción Florería Miraflores"
            className="w-full h-auto block"
          />
        )}

        {/* Texto */}
        {popup.texto && (
          <div className="px-6 py-5">
            <p className="font-body text-sm text-[#2C2420] text-center leading-relaxed">
              {popup.texto}
            </p>
          </div>
        )}

        {/* Botón cerrar visible */}
        <div className="px-6 pb-5 text-center">
          <button
            onClick={() => setVisible(false)}
            className="inline-flex items-center justify-center px-8 h-10 bg-[#2C2420] hover:bg-[#2C2420]/80 text-white font-body text-[11px] tracking-widest uppercase transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
