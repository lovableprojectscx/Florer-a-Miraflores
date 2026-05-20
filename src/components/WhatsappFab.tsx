import type { ConfigRow } from "@/types/database";

interface Props {
  config?: ConfigRow | null;
}

export function WhatsappFab({ config }: Props) {
  const whatsapp = config?.whatsapp ?? "+51 999 600 482";
  return (
    <a
      href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener"
      aria-label="Chatea por WhatsApp"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse-rose hover:scale-105 transition-transform duration-300"
      style={{ backgroundColor: "oklch(0.66 0.078 17)" }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.66a11.92 11.92 0 0 0 5.77 1.47h.01c6.57 0 11.91-5.34 11.92-11.91 0-3.18-1.24-6.17-3.48-8.42ZM12.08 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.88-9.9 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47a8.97 8.97 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
