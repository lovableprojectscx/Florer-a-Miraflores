import server from "../dist/server/server.js";

async function getWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const url = `${protocol}://${req.headers.host}${req.url}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const options = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    options.body = await getRequestBody(req);
  }

  return new Request(url, options);
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(err));
  });
}

export function resolveCacheControl(url, method = "GET", status = 200, headers = {}) {
  const rawUrl = url || "/";
  const pathOnly = rawUrl.split("?")[0].toLowerCase();
  const isPrivate =
    pathOnly.startsWith("/admin") ||
    pathOnly.startsWith("/api/admin") ||
    pathOnly.startsWith("/checkout") ||
    pathOnly.startsWith("/confirmacion");

  // Bypass explícito de caché para previsualizaciones desde admin o forzado sin caché
  const hasBypassParam =
    rawUrl.includes("preview=") ||
    rawUrl.includes("nocache=") ||
    rawUrl.includes("v=") ||
    rawUrl.includes("t=");

  // Si hay cookies de sesión de Supabase/admin o token de autorización, nunca servir desde CDN cache
  const cookieHeader =
    headers?.cookie || (typeof headers?.get === "function" ? headers.get("cookie") : "") || "";
  const authHeader =
    headers?.authorization ||
    (typeof headers?.get === "function" ? headers.get("authorization") : "") ||
    "";
  const isAdminOrAuth =
    cookieHeader.includes("sb-") || cookieHeader.includes("admin") || Boolean(authHeader);

  if (
    (method === "GET" || method === "HEAD") &&
    status === 200 &&
    !isPrivate &&
    !hasBypassParam &&
    !isAdminOrAuth
  ) {
    // Páginas públicas SSR: cachear en Edge CDN de Vercel para blindar Supabase Egress
    // Catálogo masivo: 3 min (180s) | Resto de la tienda (Home, Producto, Categorías, Nosotros): 5 min (300s)
    const isCatalog = pathOnly === "/catalogo";
    const maxAgeSec = isCatalog ? 180 : 300;
    return `public, s-maxage=${maxAgeSec}, stale-while-revalidate=86400`;
  }
  // Rutas administrativas, mutaciones o navegación autenticada: nunca cachear
  return "private, no-cache, no-store, must-revalidate";
}

async function writeWebResponse(webRes, res, req) {
  res.statusCode = webRes.status;

  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Optimización de Egress / CDN Edge Caching en Vercel:
  // Si la respuesta no define Cache-Control explícito, asignamos cabeceras inteligentes.
  if (!res.hasHeader("cache-control")) {
    res.setHeader(
      "Cache-Control",
      resolveCacheControl(req?.url, req?.method, webRes.status, req?.headers),
    );
  }

  if (webRes.body) {
    const arrayBuffer = await webRes.arrayBuffer();
    res.write(Buffer.from(arrayBuffer));
  }
  res.end();
}

export default async function handler(req, res) {
  try {
    const webReq = await getWebRequest(req);
    const webRes = await server.fetch(webReq);
    await writeWebResponse(webRes, res, req);
  } catch (error) {
    console.error("Bridge error:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
