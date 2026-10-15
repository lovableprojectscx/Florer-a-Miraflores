import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirección de /admin/blog hacia /admin/recuerdos
 * Mantiene compatibilidad con enlaces guardados en el panel de administración.
 */
export const Route = createFileRoute("/admin/blog")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/recuerdos",
      statusCode: 301,
    });
  },
  component: () => null,
});
