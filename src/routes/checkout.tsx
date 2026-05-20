import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, CheckCircle2, ShoppingBag } from "lucide-react";

import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { useCartStore } from "@/store/cart";
import { getDistritos, getCategorias, getConfig, crearPedido } from "@/lib/queries";
import type { DistritoRow } from "@/types/database";

// ─── Fecha mínima: mañana ─────────────────────────────────────────────────────

function getFechaMinima() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ─── Schema de validación ─────────────────────────────────────────────────────

const checkoutSchema = z.object({
  nombre: z.string().min(2, "Ingresa tu nombre completo"),
  telefono: z
    .string()
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .regex(/^\d+$/, "Solo números"),
  email: z.string().email("Ingresa un email válido"),
  distrito_id: z.string().min(1, "Selecciona un distrito"),
  direccion: z.string().min(5, "Ingresa tu dirección completa"),
  referencia: z.string().optional(),
  fecha_entrega: z
    .string()
    .min(1, "Selecciona una fecha de entrega")
    .refine((f) => f >= getFechaMinima(), "La fecha mínima de entrega es mañana"),
  hora_entrega: z.enum(["manana", "tarde", "noche"], {
    errorMap: () => ({ message: "Selecciona una hora de entrega" }),
  }),
  notas: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

// ─── Loader ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/checkout")({
  loader: async () => {
    const [distritos, categorias, config] = await Promise.all([
      getDistritos().catch(() => [] as DistritoRow[]),
      getCategorias().catch(() => []),
      getConfig().catch(() => null),
    ]);
    return { distritos, categorias, config };
  },
  head: () => ({
    meta: [{ title: "Checkout | Florería Miraflores" }, { name: "robots", content: "noindex" }],
  }),
  component: CheckoutPage,
});

// ─── Página ───────────────────────────────────────────────────────────────────

function CheckoutPage() {
  const { distritos, categorias, config } = Route.useLoaderData();
  const navigate = useNavigate();
  const { items, total, vaciarCarrito } = useCartStore();

  // Estado local — todos los hooks ANTES de cualquier early return
  const [modalOpen, setModalOpen] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect si el carrito está vacío — no redirigir si ya hay un pedido procesado
  useEffect(() => {
    if (items.length === 0 && !modalOpen && !numeroPedido) {
      navigate({ to: "/" });
    }
  }, [items.length, navigate, modalOpen, numeroPedido]);

  const subtotal = total();

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur",
  });

  // Actualiza delivery al cambiar distrito
  const watchDistritoId = watch("distrito_id");
  const distritoActual = distritos.find((d: DistritoRow) => d.id === watchDistritoId);
  const delivery = distritoActual ? Number(distritoActual.precio_delivery) : null;
  const totalConDelivery = delivery !== null ? subtotal + delivery : null;

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CheckoutForm) => {
    setSubmitError(null);

    try {
      const numero = await crearPedido({
        nombre_cliente: data.nombre,
        telefono: data.telefono,
        email: data.email,
        distrito_id: data.distrito_id,
        direccion: data.direccion,
        referencia: data.referencia,
        fecha_entrega: data.fecha_entrega,
        hora_entrega: data.hora_entrega,
        notas: data.notas,
        productos: items.map((item) => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          imagen: item.imagen,
          cantidad: item.cantidad,
        })),
        subtotal,
        delivery: delivery ?? 0,
        total: totalConDelivery ?? subtotal,
      });

      setNumeroPedido(numero);
      setModalOpen(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ocurrió un error. Intenta nuevamente.");
    }
  };

  // ── Cierre del modal → navegar a confirmación ─────────────────────────────
  const irAConfirmacion = () => {
    const email = watch("email");
    setModalOpen(false);
    // Navegar primero — vaciar el carrito después para evitar que el
    // useEffect de redirect a "/" se dispare antes de llegar a /confirmacion
    navigate({
      to: "/confirmacion",
      search: { numero: numeroPedido, email },
    }).then(() => vaciarCarrito());
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <AnnouncementBar config={config} />
      <Header categorias={categorias} config={config} />

      <main className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 py-10 md:py-16">
        {/* Título */}
        <h1 className="font-display italic text-4xl md:text-5xl text-[#2C2420] mb-10">Checkout</h1>

        <div className="flex flex-col-reverse lg:flex-row gap-10 lg:gap-16 items-start">
          {/* ══════════════════════════════════════════
              FORMULARIO — izquierda en desktop
          ══════════════════════════════════════════ */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="w-full lg:w-[60%] space-y-10"
          >
            {/* ── Datos del cliente ── */}
            <fieldset>
              <legend className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-5 pb-3 border-b border-[#E8DDD0] w-full">
                Datos del cliente
              </legend>
              <div className="space-y-5">
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block font-body text-sm text-[#2C2420] mb-1.5">
                    Nombre completo <span className="text-[#C4956A]">*</span>
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    autoComplete="name"
                    placeholder="María García"
                    {...register("nombre")}
                    className={`w-full h-12 px-4 bg-white border font-body text-sm text-[#2C2420] placeholder:text-[#8A7A6E]/60 outline-none transition-colors focus:border-[#C4956A] ${
                      errors.nombre ? "border-red-400" : "border-[#E8DDD0]"
                    }`}
                  />
                  {errors.nombre && (
                    <p className="mt-1.5 text-xs font-body text-red-500">{errors.nombre.message}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label
                    htmlFor="telefono"
                    className="block font-body text-sm text-[#2C2420] mb-1.5"
                  >
                    Teléfono <span className="text-[#C4956A]">*</span>
                  </label>
                  <div className="flex">
                    <span className="flex-shrink-0 flex items-center px-3 h-12 bg-[#F5EFE6] border border-r-0 border-[#E8DDD0] font-body text-sm text-[#8A7A6E]">
                      +51
                    </span>
                    <input
                      id="telefono"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="999 600 482"
                      {...register("telefono")}
                      className={`flex-1 h-12 px-4 bg-white border font-body text-sm text-[#2C2420] placeholder:text-[#8A7A6E]/60 outline-none transition-colors focus:border-[#C4956A] ${
                        errors.telefono ? "border-red-400" : "border-[#E8DDD0]"
                      }`}
                    />
                  </div>
                  {errors.telefono && (
                    <p className="mt-1.5 text-xs font-body text-red-500">
                      {errors.telefono.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block font-body text-sm text-[#2C2420] mb-1.5">
                    Email <span className="text-[#C4956A]">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="maria@correo.com"
                    {...register("email")}
                    className={`w-full h-12 px-4 bg-white border font-body text-sm text-[#2C2420] placeholder:text-[#8A7A6E]/60 outline-none transition-colors focus:border-[#C4956A] ${
                      errors.email ? "border-red-400" : "border-[#E8DDD0]"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-body text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* ── Datos de entrega ── */}
            <fieldset>
              <legend className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-5 pb-3 border-b border-[#E8DDD0] w-full">
                Datos de entrega
              </legend>
              <div className="space-y-5">
                {/* Distrito */}
                <div>
                  <label
                    htmlFor="distrito_id"
                    className="block font-body text-sm text-[#2C2420] mb-1.5"
                  >
                    Distrito <span className="text-[#C4956A]">*</span>
                  </label>
                  <select
                    id="distrito_id"
                    {...register("distrito_id")}
                    className={`w-full h-12 px-4 bg-white border font-body text-sm text-[#2C2420] outline-none transition-colors focus:border-[#C4956A] appearance-none cursor-pointer ${
                      errors.distrito_id ? "border-red-400" : "border-[#E8DDD0]"
                    }`}
                  >
                    <option value="">Selecciona tu distrito</option>
                    {distritos.map((d: DistritoRow) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} — delivery S/ {Number(d.precio_delivery).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {errors.distrito_id && (
                    <p className="mt-1.5 text-xs font-body text-red-500">
                      {errors.distrito_id.message}
                    </p>
                  )}
                </div>

                {/* Dirección */}
                <div>
                  <label
                    htmlFor="direccion"
                    className="block font-body text-sm text-[#2C2420] mb-1.5"
                  >
                    Dirección completa <span className="text-[#C4956A]">*</span>
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    autoComplete="street-address"
                    placeholder="Av. Larco 1234, piso 3"
                    {...register("direccion")}
                    className={`w-full h-12 px-4 bg-white border font-body text-sm text-[#2C2420] placeholder:text-[#8A7A6E]/60 outline-none transition-colors focus:border-[#C4956A] ${
                      errors.direccion ? "border-red-400" : "border-[#E8DDD0]"
                    }`}
                  />
                  {errors.direccion && (
                    <p className="mt-1.5 text-xs font-body text-red-500">
                      {errors.direccion.message}
                    </p>
                  )}
                </div>

                {/* Referencia (opcional) */}
                <div>
                  <label
                    htmlFor="referencia"
                    className="block font-body text-sm text-[#2C2420] mb-1.5"
                  >
                    Referencia <span className="text-[#8A7A6E] font-light">(opcional)</span>
                  </label>
                  <input
                    id="referencia"
                    type="text"
                    placeholder="Frente al parque, edificio azul…"
                    {...register("referencia")}
                    className="w-full h-12 px-4 bg-white border border-[#E8DDD0] font-body text-sm text-[#2C2420] placeholder:text-[#8A7A6E]/60 outline-none transition-colors focus:border-[#C4956A]"
                  />
                </div>

                {/* Fecha y hora — grid 2 cols en sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Fecha de entrega */}
                  <div>
                    <label
                      htmlFor="fecha_entrega"
                      className="block font-body text-sm text-[#2C2420] mb-1.5"
                    >
                      Fecha de entrega <span className="text-[#C4956A]">*</span>
                    </label>
                    <input
                      id="fecha_entrega"
                      type="date"
                      min={getFechaMinima()}
                      {...register("fecha_entrega")}
                      className={`w-full h-12 px-4 bg-white border font-body text-sm text-[#2C2420] outline-none transition-colors focus:border-[#C4956A] cursor-pointer ${
                        errors.fecha_entrega ? "border-red-400" : "border-[#E8DDD0]"
                      }`}
                    />
                    {errors.fecha_entrega && (
                      <p className="mt-1.5 text-xs font-body text-red-500">
                        {errors.fecha_entrega.message}
                      </p>
                    )}
                  </div>

                  {/* Hora de entrega */}
                  <div>
                    <label
                      htmlFor="hora_entrega"
                      className="block font-body text-sm text-[#2C2420] mb-1.5"
                    >
                      Hora de entrega <span className="text-[#C4956A]">*</span>
                    </label>
                    <select
                      id="hora_entrega"
                      {...register("hora_entrega")}
                      className={`w-full h-12 px-4 bg-white border font-body text-sm text-[#2C2420] outline-none transition-colors focus:border-[#C4956A] appearance-none cursor-pointer ${
                        errors.hora_entrega ? "border-red-400" : "border-[#E8DDD0]"
                      }`}
                    >
                      <option value="">Selecciona un horario</option>
                      <option value="manana">Mañana · 9 am – 12 pm</option>
                      <option value="tarde">Tarde · 12 pm – 5 pm</option>
                      <option value="noche">Noche · 5 pm – 9 pm</option>
                    </select>
                    {errors.hora_entrega && (
                      <p className="mt-1.5 text-xs font-body text-red-500">
                        {errors.hora_entrega.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notas adicionales (opcional) */}
                <div>
                  <label htmlFor="notas" className="block font-body text-sm text-[#2C2420] mb-1.5">
                    Notas adicionales <span className="text-[#8A7A6E] font-light">(opcional)</span>
                  </label>
                  <textarea
                    id="notas"
                    rows={3}
                    placeholder="Indicaciones especiales, dedicatoria, color preferido…"
                    {...register("notas")}
                    className="w-full px-4 py-3 bg-white border border-[#E8DDD0] font-body text-sm text-[#2C2420] placeholder:text-[#8A7A6E]/60 outline-none transition-colors focus:border-[#C4956A] resize-none"
                  />
                </div>
              </div>
            </fieldset>

            {/* ── Error global ── */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 font-body text-sm">
                {submitError}
              </div>
            )}

            {/* ── Botón de pago ── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-[#C4956A] hover:bg-[#9E7347] disabled:opacity-60 text-white text-[12px] tracking-widest uppercase font-body font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
              {isSubmitting
                ? "Procesando…"
                : `Pagar con IZIPay — S/ ${totalConDelivery !== null ? totalConDelivery.toFixed(2) : subtotal.toFixed(2)}`}
            </button>

            <p className="text-center font-body text-xs text-[#8A7A6E]">
              Tus datos están protegidos. Pago 100% seguro.
            </p>
          </form>

          {/* ══════════════════════════════════════════
              RESUMEN — derecha en desktop (sticky)
              Aparece ARRIBA en mobile (flex-col-reverse)
          ══════════════════════════════════════════ */}
          <aside className="w-full lg:w-[40%] lg:sticky lg:top-8">
            <div className="bg-[#F5EFE6] p-6 md:p-8">
              <h2 className="font-display italic text-2xl text-[#2C2420] mb-6">Tu pedido</h2>

              {/* Lista de items */}
              <ul className="space-y-4 mb-6">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4">
                    <div className="w-14 h-14 flex-shrink-0 bg-white overflow-hidden rounded-lg">
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-[#2C2420] truncate">{item.nombre}</p>
                      <p className="font-body text-xs text-[#8A7A6E]">x{item.cantidad}</p>
                    </div>
                    <p className="font-body text-sm text-[#2C2420] flex-shrink-0">
                      S/ {(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Líneas de totales */}
              <div className="border-t border-[#E8DDD0] pt-4 space-y-3">
                <div className="flex justify-between font-body text-sm text-[#8A7A6E]">
                  <span>Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-body text-sm text-[#8A7A6E]">
                  <span>Delivery</span>
                  <span>
                    {delivery !== null ? (
                      `S/ ${delivery.toFixed(2)}`
                    ) : (
                      <span className="italic">Selecciona un distrito</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-body text-base font-medium text-[#2C2420] pt-2 border-t border-[#E8DDD0]">
                  <span>Total</span>
                  <span>
                    {totalConDelivery !== null ? `S/ ${totalConDelivery.toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>

              {/* Editar carrito */}
              <Link
                to="/"
                className="mt-5 block text-center font-body text-xs text-[#8A7A6E] hover:text-[#C4956A] transition-colors underline underline-offset-2"
              >
                ← Seguir comprando
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />

      {/* ══════════════════════════════════════════
          MODAL — pedido registrado
      ══════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Card */}
          <div className="relative w-full max-w-md bg-[#FDFAF6] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Botón cerrar */}
            <button
              onClick={irAConfirmacion}
              aria-label="Cerrar"
              className="absolute top-4 right-4 p-1 text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {/* Ícono */}
            <div className="flex justify-center mb-5">
              <CheckCircle2 className="h-16 w-16 text-[#C4956A]" strokeWidth={1} />
            </div>

            {/* Título */}
            <h2 className="font-display italic text-3xl text-[#2C2420] text-center mb-2">
              ¡Pedido registrado!
            </h2>

            {/* Número de pedido */}
            <p className="font-body text-sm text-[#8A7A6E] text-center mb-1">
              Tu número de pedido es
            </p>
            <p className="font-body text-xl font-medium text-[#C4956A] text-center mb-6 tracking-wider">
              {numeroPedido}
            </p>

            {/* Aviso integración */}
            <div className="bg-[#F5EFE6] border border-[#E8DDD0] p-4 mb-6 text-center">
              <p className="font-body text-sm text-[#2C2420] font-medium mb-1">
                Integracion de pago IZIPay
              </p>
              <p className="font-body text-xs text-[#8A7A6E]">
                Tu pedido ha sido registrado. Nos pondremos en contacto contigo para coordinar el
                pago.
              </p>
            </div>

            {/* CTA WhatsApp */}
            <a
              href={`https://wa.me/${(config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "")}?text=Hola!%20Mi%20pedido%20es%20${numeroPedido}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 flex items-center justify-center bg-[#2C2420] text-white font-body text-[11px] tracking-widest uppercase hover:bg-[#2C2420]/80 transition-colors mb-3"
            >
              Confirmar por WhatsApp
            </a>
            <button
              onClick={irAConfirmacion}
              className="w-full h-11 border border-[#E8DDD0] text-[#8A7A6E] font-body text-[11px] tracking-widest uppercase hover:border-[#C4956A] hover:text-[#2C2420] transition-colors"
            >
              Ver resumen del pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
