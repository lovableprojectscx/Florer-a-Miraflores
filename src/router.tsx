import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: false,
    defaultStaleTime: 120_000, // 2 minutos de frescura en cliente: previene re-queries en navegación interna
    defaultPreloadStaleTime: 300_000, // 5 minutos para preload
  });

  return router;
};
