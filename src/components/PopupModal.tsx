import { useState, useEffect, useRef } from "react";
import { X, Gift, Sparkles, Check, Copy, Loader2 } from "lucide-react";
import type { PopupRow, ConfigRow } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface Props {
  popup?: PopupRow | null;
  config?: ConfigRow | null;
}

const POPUP_SEEN_KEY = "fm_popup_seen";
const SUBSCRIBED_KEY = "fm_subscribed";
const SUBSCRIBER_PHONE_KEY = "fm_subscriber_phone";
const COUPON_CODE = "MIRAFLORES10";

export function PopupModal({ popup, config }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredRef = useRef(false);

  // Inicializar estado de suscripción desde localStorage
  useEffect(() => {
    try {
      const alreadySubscribed = localStorage.getItem(SUBSCRIBED_KEY) === "true";
      if (alreadySubscribed) {
        setIsSubscribed(true);
        const storedPhone = localStorage.getItem(SUBSCRIBER_PHONE_KEY);
        if (storedPhone) setPhone(storedPhone);
      }
    } catch {
      // Ignorar en entornos restringidos de storage
    }
  }, []);

  // Lógica de apertura automática (1 sola vez por sesión, sin duplicación)
  useEffect(() => {
    // Si ya está suscrito, no molestar con auto-popup
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY) === "true") return;
      // Si ya lo vio o cerró en esta sesión de navegación, no volver a abrir automáticamente
      if (sessionStorage.getItem(POPUP_SEEN_KEY) === "1") return;
    } catch {
      // continuar
    }

    // Si viene un objeto popup y está explícitamente inactivo o vencido, no auto-abrir
    if (popup) {
      if (popup.activo === false) return;
      if (popup.fecha_expiracion) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const expira = new Date(popup.fecha_expiracion + "T00:00:00");
        if (hoy > expira) return;
      }
    }

    // Evitar doble ejecución en React StrictMode o re-renders rápidos
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Delay no intrusivo de 3 segundos para dejar apreciar el hero banner
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
      try {
        sessionStorage.setItem(POPUP_SEEN_KEY, "1");
      } catch {
        // storage no disponible
      }
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [popup]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(POPUP_SEEN_KEY, "1");
    } catch {
      // storage no disponible
    }
  };

  const handleOpenFromRibbon = () => {
    setIsOpen(true);
    try {
      sessionStorage.setItem(POPUP_SEEN_KEY, "1");
    } catch {
      // storage no disponible
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = phone.replace(/\D/g, "");
    if (!clean) {
      setError("Por favor, ingresa tu número de celular.");
      return;
    }

    if (clean.length !== 9 || !clean.startsWith("9")) {
      setError("Ingresa un número móvil de 9 dígitos válido (ej: 999 000 000).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Intentar guardar en Supabase (tabla 'suscriptores')
      const { error: dbError } = await supabase
        .from("suscriptores")
        .insert([{ telefono: `+51${clean}`, origen: "popup_home" }]);

      if (dbError) {
        console.warn("[Suscriptores] Nota de inserción en BD:", dbError.message);
      }
    } catch (err) {
      console.warn("[Suscriptores] Error de red:", err);
    } finally {
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "true");
        localStorage.setItem(SUBSCRIBER_PHONE_KEY, clean);
        sessionStorage.setItem(POPUP_SEEN_KEY, "1");
      } catch {
        // storage no disponible
      }
      setIsSubscribed(true);
      setIsSubmitting(false);
    }
  };

  const handleCopyCoupon = () => {
    try {
      navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard fallback
    }
  };

  const floristPhone = (config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "");
  const userPhone = phone || (typeof window !== "undefined" ? localStorage.getItem(SUBSCRIBER_PHONE_KEY) ?? "" : "");
  const waMessage = encodeURIComponent(
    `¡Hola Florería Miraflores! Me acabo de suscribir con mi celular ${userPhone ? `+51 ${userPhone}` : ""} y deseo activar mi cupón de descuento ${COUPON_CODE} 🌸`
  );
  const waUrl = `https://wa.me/${floristPhone}?text=${waMessage}`;

  return (
    <>
      {/* ─── Listón lateral permanente a la izquierda (Rosa Miraflores #C4848A) ─── */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpenFromRibbon}
          aria-label="Suscríbete para recibir ofertas y novedades"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center bg-gradient-to-b from-[#C4848A] to-[#B76E79] text-white py-3.5 sm:py-4 px-2 sm:px-2.5 rounded-r-2xl shadow-lg shadow-[#C4848A]/35 hover:translate-x-1 hover:shadow-xl active:scale-95 transition-all duration-300 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#C4848A]/50"
          title="Suscríbete para recibir ofertas y novedades"
        >
          <div className="flex flex-col items-center gap-2">
            <Gift className="w-4 h-4 text-white/95 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
            <span
              className="text-[10px] sm:text-[11px] font-body font-medium tracking-widest uppercase select-none text-white drop-shadow-xs"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              Suscríbete para recibir ofertas y novedades
            </span>
          </div>
        </button>
      )}

      {/* ─── Modal Popup de Captura y Promoción ─── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden border border-[#E8DDD0]/60 animate-fade-in"
            style={{ animationDuration: "250ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar (X) */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-[#2C2420] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Cerrar modal de suscripción"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            {/* Cabecera / Imagen promocional */}
            {popup?.imagen_url ? (
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#FAF8F6] overflow-hidden">
                <img
                  src={popup.imagen_url}
                  alt="Promoción Florería Miraflores"
                  className="w-full h-full object-cover block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#FAF8F6] via-[#F5EFE6] to-[#FAF8F6] pt-8 pb-5 px-6 text-center border-b border-[#E8DDD0]/60">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C4848A]/15 text-[#C4848A] flex items-center justify-center mb-2.5 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#C4848A]">
                  Club Florería Miraflores
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-[#2C2420] mt-1 font-normal">
                  Ofertas y Novedades
                </h3>
              </div>
            )}

            {/* Texto de promoción o subtítulo */}
            <div className="px-6 pt-5 pb-2 text-center">
              {popup?.texto ? (
                <p className="font-body text-sm sm:text-base text-[#2C2420] leading-relaxed">
                  {popup.texto}
                </p>
              ) : (
                <p className="font-body text-xs sm:text-sm text-[#8C8A84] leading-relaxed">
                  Suscríbete con tu celular para recibir ofertas flash exclusivas, recordatorios de fechas especiales y un beneficio de bienvenida en tu primer arreglo floral.
                </p>
              )}
            </div>

            {/* Contenido: Formulario vs Estado Suscrito */}
            {!isSubscribed ? (
              <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3 space-y-4">
                <div>
                  <label
                    htmlFor="phone-input"
                    className="block text-[11px] font-body uppercase tracking-wider text-[#8C8A84] mb-1.5 font-medium"
                  >
                    Tu número de WhatsApp / Celular
                  </label>
                  <div className="flex rounded-xl border border-[#E8DDD0] overflow-hidden focus-within:border-[#C4848A] focus-within:ring-2 focus-within:ring-[#C4848A]/20 transition-all bg-white shadow-2xs">
                    <div className="flex items-center gap-1.5 px-3 bg-[#FAF8F6] border-r border-[#E8DDD0] text-xs font-medium text-[#2C2420] select-none">
                      <span role="img" aria-label="Bandera de Perú">
                        🇵🇪
                      </span>
                      <span>+51</span>
                    </div>
                    <input
                      id="phone-input"
                      type="tel"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="999 000 000"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 9) setPhone(val);
                        if (error) setError(null);
                      }}
                      className="w-full h-11 px-3 text-sm text-[#2C2420] placeholder:text-[#8C8A84]/50 focus:outline-none bg-transparent"
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-[#D64545] mt-1.5 font-body flex items-center gap-1">
                      <span>⚠</span> {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-gradient-to-r from-[#C4848A] to-[#B76E79] hover:opacity-95 text-white font-body text-xs tracking-widest uppercase font-medium rounded-xl shadow-md shadow-[#C4848A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Quiero recibir ofertas</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-[#8C8A84] font-light leading-snug">
                  🔒 Sin spam. Solo descuentos exclusivos y novedades florales.
                </p>
              </form>
            ) : (
              <div className="px-6 pb-6 pt-3 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Check className="w-6 h-6" strokeWidth={2.5} />
                </div>

                <div>
                  <h4 className="font-display text-xl text-[#2C2420] font-normal">
                    ¡Ya eres parte de nuestra comunidad!
                  </h4>
                  <p className="font-body text-xs text-[#8C8A84] mt-1">
                    Usa tu cupón de bienvenida o contáctanos por WhatsApp para hacer tu pedido:
                  </p>
                </div>

                {/* Cupón con botón copiar */}
                <div className="p-3 bg-[#FAF8F6] border border-dashed border-[#C4848A] rounded-xl flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-[#8C8A84] uppercase tracking-wider block">
                      Cupón 10% OFF
                    </span>
                    <span className="font-mono text-base font-bold text-[#C4848A] tracking-wider">
                      {COUPON_CODE}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCoupon}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF8F6] border border-[#E8DDD0] rounded-lg text-xs font-medium text-[#2C2420] transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#8C8A84]" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Botón WhatsApp */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 bg-[#25D366] hover:bg-[#20BD5A] text-white font-body text-xs tracking-wider uppercase font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.66a11.92 11.92 0 0 0 5.77 1.47h.01c6.57 0 11.91-5.34 11.92-11.91 0-3.18-1.24-6.17-3.48-8.42ZM12.08 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.88-9.9 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47a8.97 8.97 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35Z" />
                  </svg>
                  <span>Canjear por WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-[#8C8A84] hover:text-[#2C2420] underline transition-colors cursor-pointer"
                >
                  Continuar navegando
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
