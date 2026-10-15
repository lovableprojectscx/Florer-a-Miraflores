import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Check, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { PopupRow, ConfigRow } from "@/types/database";
import { insertarSuscriptor } from "@/lib/queries";

interface Props {
  popup?: PopupRow | null;
  config?: ConfigRow | null;
}

const POPUP_SEEN_KEY = "fm_popup_seen";
const SUBSCRIBED_KEY = "fm_subscribed";
const SUBSCRIBER_NAME_KEY = "fm_subscriber_name";
const SUBSCRIBER_PHONE_KEY = "fm_subscriber_phone";

export const CONSENTIMIENTO_TEXTO =
  "Acepto que Florería Miraflores me envíe promociones y novedades por WhatsApp. Puedo darme de baja cuando quiera. Ver Política de privacidad.";

// Activado en Fase 10 tras verificación de SQL 011
export const POPUP_ACTIVO = true;

export function PopupModal(props: Props) {
  // Mostrar el popup solo si POPUP_ACTIVO && la fila de popup existe y activo = true (si no hay fila, NO se muestra)
  if (!POPUP_ACTIVO) return null;
  if (!props.popup || props.popup.activo !== true) return null;

  return <PopupModalInner {...props} />;
}

function PopupModalInner({ popup, config }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberName, setSubscriberName] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredRef = useRef(false);

  // Inicializar estado de suscripción desde localStorage
  useEffect(() => {
    try {
      const alreadySubscribed = localStorage.getItem(SUBSCRIBED_KEY) === "true";
      if (alreadySubscribed) {
        setIsSubscribed(true);
        const storedName = localStorage.getItem(SUBSCRIBER_NAME_KEY);
        if (storedName) setSubscriberName(storedName);
      }
    } catch {
      // Ignorar en entornos restringidos de storage
    }
  }, []);

  // Apertura automática (1 sola vez por sesión, sin duplicación)
  useEffect(() => {
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY) === "true") return;
      if (sessionStorage.getItem(POPUP_SEEN_KEY) === "1") return;
    } catch {
      // continuar
    }

    if (popup) {
      if (popup.activo !== true) return;
      if (popup.fecha_expiracion) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const expira = new Date(popup.fecha_expiracion + "T00:00:00");
        if (hoy > expira) return;
      }
    }

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre || cleanNombre.length < 2 || cleanNombre.length > 60) {
      setError("Por favor ingresa tu nombre (entre 2 y 60 caracteres).");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 9 || !cleanPhone.startsWith("9")) {
      setError("Ingresa un número móvil de 9 dígitos válido que empiece en 9.");
      return;
    }

    if (!consent) {
      setError("Debes aceptar la autorización para recibir novedades por WhatsApp.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedPhone = `+51${cleanPhone}`;
      const res = await insertarSuscriptor({
        nombre: cleanNombre,
        telefono: formattedPhone,
        consentimiento_texto: CONSENTIMIENTO_TEXTO,
        origen: "popup_home",
      });

      if (!res.ok) {
        setError("No pudimos registrar tu suscripción en este momento.");
        return;
      }

      // Tanto éxito regular como 23505 (número ya registrado) muestran el mismo mensaje de éxito
      setSubscriberName(cleanNombre);
      setIsSubscribed(true);

      try {
        localStorage.setItem(SUBSCRIBED_KEY, "true");
        localStorage.setItem(SUBSCRIBER_NAME_KEY, cleanNombre);
        localStorage.setItem(SUBSCRIBER_PHONE_KEY, cleanPhone);
        sessionStorage.setItem(POPUP_SEEN_KEY, "1");
      } catch {
        // storage no disponible
      }
    } catch (err) {
      console.warn("[Suscriptores] Error de red:", err);
      setError("Ocurrió un error al registrar tu suscripción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const floristPhone = (config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "");
  const waHelpMessage = encodeURIComponent(
    "Hola Florería Miraflores! Deseo recibir novedades y promociones por WhatsApp.",
  );
  const waHelpUrl = `https://wa.me/${floristPhone}?text=${waHelpMessage}`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Club Florería Miraflores"
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
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            {/* Cabecera / Imagen promocional */}
            {popup?.imagen_url ? (
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#FAF8F6] overflow-hidden">
                <img
                  src={popup.imagen_url}
                  alt="Club Florería Miraflores"
                  className="w-full h-full object-cover block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#FAF8F6] via-[#F5EFE6] to-[#FAF8F6] pt-8 pb-5 px-6 text-center border-b border-[#E8DDD0]/60">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C4848A]/15 text-[#9B4850] flex items-center justify-center mb-2.5 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#9B4850]">
                  Club Florería Miraflores
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-[#2C2420] mt-1 font-normal">
                  Únete a nuestro Club
                </h3>
              </div>
            )}

            {/* Texto del popup */}
            <div className="px-6 pt-5 pb-2 text-center">
              {popup?.imagen_url && (
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#9B4850] block mb-1">
                  Club Florería Miraflores
                </span>
              )}
              <h3 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal mb-2">
                Club Florería Miraflores
              </h3>
              <p className="font-body text-xs sm:text-sm text-[#595753] leading-relaxed">
                Recibe novedades, promociones y recordatorios de fechas especiales por WhatsApp.
              </p>
            </div>

            {/* Contenido: Formulario vs Estado Suscrito */}
            {!isSubscribed ? (
              <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3 space-y-4">
                {/* Campo Nombre */}
                <div>
                  <label
                    htmlFor="subscriber-name-input"
                    className="block text-[11px] font-body uppercase tracking-wider text-[#595753] mb-1.5 font-medium"
                  >
                    Nombre completo <span className="text-[#C4956A]">*</span>
                  </label>
                  <input
                    id="subscriber-name-input"
                    type="text"
                    autoComplete="name"
                    maxLength={60}
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full h-11 px-3 text-sm text-[#2C2420] placeholder:text-[#8C8A84]/50 border border-[#E8DDD0] rounded-xl focus:border-[#C4848A] focus:ring-2 focus:ring-[#C4848A]/20 outline-none bg-white transition-all shadow-2xs"
                    autoFocus
                  />
                </div>

                {/* Campo Teléfono WhatsApp */}
                <div>
                  <label
                    htmlFor="subscriber-phone-input"
                    className="block text-[11px] font-body uppercase tracking-wider text-[#595753] mb-1.5 font-medium"
                  >
                    Número de WhatsApp <span className="text-[#C4956A]">*</span>
                  </label>
                  <div className="flex rounded-xl border border-[#E8DDD0] overflow-hidden focus-within:border-[#C4848A] focus-within:ring-2 focus-within:ring-[#C4848A]/20 transition-all bg-white shadow-2xs">
                    <div className="flex items-center gap-1.5 px-3 bg-[#FAF8F6] border-r border-[#E8DDD0] text-xs font-medium text-[#2C2420] select-none">
                      <span role="img" aria-label="Bandera de Perú">
                        🇵🇪
                      </span>
                      <span>+51</span>
                    </div>
                    <input
                      id="subscriber-phone-input"
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
                    />
                  </div>
                </div>

                {/* Casilla de Consentimiento */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-left">
                    <input
                      type="checkbox"
                      id="consent-checkbox"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (error) setError(null);
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-[#E8DDD0] text-[#2C2420] focus:ring-[#2C2420] accent-[#2C2420] cursor-pointer"
                    />
                    <span className="font-body text-[11px] sm:text-xs text-[#595753] leading-snug">
                      Acepto que Florería Miraflores me envíe promociones y novedades por WhatsApp.
                      Puedo darme de baja cuando quiera. Ver{" "}
                      <Link
                        to="/privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2C2420] underline underline-offset-2 hover:text-[#C4848A]"
                      >
                        Política de privacidad
                      </Link>
                      . <span className="text-[#C4956A]">*</span>
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-[#D64545] font-body flex items-center justify-center gap-1 text-center">
                      <span>⚠</span> {error}
                    </p>
                    <a
                      href={waHelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-9 bg-[#25D366] hover:bg-[#20BD5A] text-white font-body text-xs tracking-wider uppercase font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.66a11.92 11.92 0 0 0 5.77 1.47h.01c6.57 0 11.91-5.34 11.92-11.91 0-3.18-1.24-6.17-3.48-8.42ZM12.08 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.88-9.9 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47a8.97 8.97 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35Z" />
                      </svg>
                      <span>Escríbenos por WhatsApp</span>
                    </a>
                  </div>
                )}

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
                    <span>Quiero recibir novedades</span>
                  )}
                </button>

                <p className="text-[11px] text-center text-[#595753] font-light leading-snug">
                  🔒 Cero spam. Respetamos tu privacidad y puedes darte de baja en cualquier
                  momento.
                </p>
              </form>
            ) : (
              <div className="px-6 pb-6 pt-3 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Check className="w-6 h-6" strokeWidth={2.5} />
                </div>

                <div>
                  <h4 className="font-display text-xl text-[#2C2420] font-normal">
                    ¡Listo{subscriberName ? `, ${subscriberName}` : ""}!
                  </h4>
                  <p className="font-body text-xs sm:text-sm text-[#595753] mt-2 leading-relaxed">
                    Te escribiremos con novedades y promociones exclusivas por WhatsApp.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full h-11 bg-[#2C2420] hover:bg-[#1A1513] text-white font-body text-xs tracking-wider uppercase font-medium rounded-xl shadow-md transition-all cursor-pointer"
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
