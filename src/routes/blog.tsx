import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

/**
 * Redirección permanente 301 de /blog hacia /recuerdos
 * Preserva indexación en motores de búsqueda y tráfico referencial externo.
 */
export const Route = createFileRoute("/blog")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/blog" || location.pathname === "/blog/") {
      throw redirect({
        to: "/recuerdos",
        statusCode: 301,
      });
    }
  },
  component: () => <Outlet />,
});
