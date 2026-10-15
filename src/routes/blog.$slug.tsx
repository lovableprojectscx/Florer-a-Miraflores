import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirección permanente 301 de /blog/$slug hacia /recuerdos/$slug
 * Preserva enlaces directos a artículos antiguos redirigiéndolos al recuerdo correspondiente.
 */
export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/recuerdos/$slug",
      params: { slug: params.slug },
      statusCode: 301,
    });
  },
  component: () => null,
});
