import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { getCategorias, getConfig } from "@/lib/queries";

// ─── Search params schema ─────────────────────────────────────────────────────

const confirmacionSearch = z.object({
  numero: z.string().min(1),
  email:  z.string().email(),
});

// ─── Ruta ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/confirmacion")({
  validateSearch: (search) => confirmacionSearch.parse(search),

  // Si los search params son inválidos → redirect a home
  onError: () => { throw redirect({ to: "/" }); },

  loader: async () => {
    const [categorias, config] = await Promise.all([
      getCategorias().catch(() => []),
      getConfig().catch(() => null),
    ]);
    return { categorias, config };
  },

  head: () => ({
    meta: [
      { title: "Pedido confirmado | Florería Miraflores" },
      { name: "robots", content: "noindex" },
    ],
  }),

  component: ConfirmacionPage,
});

// ─── Página ───────────────────────────────────────────────────────────────────

function ConfirmacionPage() {
  const { numero, email }     = Route.useSearch();
  const { categorias, config } = Route.useLoaderData();

  const whatsappMsg = encodeURIComponent(`Hola, mi pedido es ${numero}`);
  const whatsappUrl = `https://wa.me/51999600482?text=${whatsappMsg}`;

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <AnnouncementBar config={config} />
      <Header categorias={categorias} />

      <main className="max-w-2xl mx-auto px-5 md:px-10 py-16 md:py-24 text-center">

        {/* Ícono de check */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-[#F5EFE6] flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-[#C4956A]" strokeWidth={1.25} />
          </div>
        </div>

        {/* Título */}
        <h1 className="font-display italic text-4xl md:text-5xl text-[#2C2420] mb-3">
          ¡Tu pedido fue recibido!
        </h1>

        {/* Número de pedido */}
        <p className="font-body text-sm text-[#8A7A6E] mb-2">
          Tu número de pedido es
        </p>
        <p className="font-body text-2xl font-medium text-[#C4956A] tracking-wider mb-8">
          {numero}
        </p>

        {/* Separador */}
        <div className="border-t border-[#E8DDD0] my-8" />

        {/* Mensaje */}
        <p className="font-body font-light text-[#2C2420]/80 leading-relaxed mb-2">
          Recibirás una confirmación en{" "}
          <span className="font-medium text-[#2C2420]">{email}</span>.
        </p>
        <p className="font-body font-light text-[#8A7A6E] text-sm leading-relaxed mb-10">
          Si tienes alguna duda o quieres coordinar tu entrega, escríbenos por WhatsApp y
          te atendemos al instante. Horario:{" "}
          <span className="text-[#2C2420]">9 am – 9 pm, todos los días</span>.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-13 px-8 py-4 bg-[#25D366] hover:bg-[#1fba59] text-white text-[12px] tracking-widest uppercase font-body font-medium transition-colors"
          >
            <WhatsappIcon />
            Escribir por WhatsApp
          </a>

          {/* Seguir comprando */}
          <Link
            to="/"
            className="flex items-center justify-center h-13 px-8 py-4 border border-[#C4956A] text-[#C4956A] hover:bg-[#C4956A] hover:text-white text-[12px] tracking-widest uppercase font-body font-medium transition-colors"
          >
            Seguir comprando
          </Link>

        </div>

      </main>

      <Footer config={config} />
      <WhatsappFab />
    </div>
  );
}

// ─── Ícono WhatsApp inline ────────────────────────────────────────────────────

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.66a11.92 11.92 0 0 0 5.77 1.47h.01c6.57 0 11.91-5.34 11.92-11.91 0-3.18-1.24-6.17-3.48-8.42ZM12.08 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.88-9.9 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47a8.97 8.97 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}
