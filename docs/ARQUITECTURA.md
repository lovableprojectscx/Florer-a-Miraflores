# Arquitectura — Florería Miraflores

Documento técnico del sistema. Describe **lo que el código realmente implementa hoy** (verificado sobre `src/`), su flujo de datos, componentes de diseño y modelo operativo en producción.

Última revisión: 2026-10-08

---

## 1. Resumen Ejecutivo

E-commerce de diseño floral premium para Lima Metropolitana (Miraflores, Surco, Barranco, Lince, San Isidro, etc.) con catálogo dinámico, navegación jerárquica con filtros en tiempo real, carrito reactivo, checkout con cálculo automático de delivery por distritos y panel de administración integral.

El frontend está desarrollado en React 19 sobre **TanStack Start** (SSR-capable), con base de datos, autenticación y almacenamiento de medios en **Supabase** (PostgreSQL 17), desplegado en **Vercel** mediante bridge serverless (`api/index.js`).

---

## 2. Stack Tecnológico Real (Verificado en `package.json`)

| Capa | Tecnología / Paquete | Rol / Implementación |
| :--- | :--- | :--- |
| **UI** | React 19 + Tailwind CSS v4 | Interfaz responsiva, componentes modulares y tokens de diseño |
| **Framework / SSR** | TanStack Start (`v1.168.60`) | Servidor SSR optimizado con mitigación CVE-2026-102989 |
| **Routing** | TanStack Router | Enrutamiento basado en archivos (`src/routes/`), loaders tipados |
| **Data Fetching** | TanStack React Query + Supabase JS | Caché de cliente y consultas desacopladas en `src/lib/queries.ts` |
| **Formularios** | React Hook Form + Zod | Validación tipada en checkout, libro de reclamaciones y admin |
| **Estado Global** | Zustand (`src/store/cart.ts`) | Carrito reactivo en memoria de sesión de navegador (sin BD) |
| **Backend / DB** | Supabase (PostgreSQL 17.6) | Base de datos relacional, RLS en todas las tablas, Auth |
| **Almacenamiento** | Supabase Storage (`productos`, etc.) | Almacenamiento de fotografías WebP optimizadas en alta definición |
| **Build & Deploy** | Vite 7 + Vercel Serverless | Pipeline npm con `scripts/postbuild.js` y puente en `api/index.js` |
| **Pasarela** | IZIPay | En espera de credenciales comerciales (flujo activo vía WhatsApp) |

---

## 3. Diagrama de Arquitectura del Sistema

```mermaid
flowchart TD
    subgraph Cliente["Navegador del Cliente (Desktop / Laptop / Mobile)"]
        UI["React 19 UI\n(Header relativo, Bento Collage, Catálogo, Producto)"]
        Cart["Zustand Cart Store\n(Carrito en memoria)"]
        Nav["TanStack Router\n(File-based routing)"]
    end

    subgraph Vercel["Infraestructura Vercel (Edge / Serverless)"]
        Bridge["api/index.js\n(Bridge Serverless Node ↔ Web Fetch)"]
        Server["dist/server/server.js\nTanStack Start Entry SSR"]
        Static["dist/client/assets/\n(Assets estáticos y WebP optimizados)"]
    end

    subgraph Supabase["Servicios Backend Supabase"]
        DB[("PostgreSQL 17\n10 Tablas + RLS Estricto")]
        Storage["Supabase Storage\nBucket público /productos WebP"]
        Auth["Supabase Auth\nSesión admin con JWT"]
    end

    Izi["Pasarela IZIPay\n(Fase 3: Edge Functions)"]

    UI -->|HTTP Requests| Bridge --> Server
    Server -->|HTML SSR + Data Preload| UI
    UI -->|Consultas queries.ts| DB
    UI -->|Carga de fotos WebP| Storage
    UI -->|Recursos estáticos| Static
    Cart --> UI
    UI -.->|Checkout: crea pedido FM-XXXXXX| DB
    UI -.->|Coordinación actual| WA["Atención WhatsApp"]
    UI -.->|Cobro automático (Futuro)| Izi
    AdminUI["/admin/*\n(Panel CRUD)"] -->|Autenticación| Auth
    AdminUI -->|Lectura / Escritura RLS| DB
```

---

## 4. Estructura de Archivos y Organización (`src/`)

```
src/
├── routes/                               Rutas (File-based routing)
│   ├── index.tsx                         Home (Hero 8:3, Bento Collage, Novedades, Delivery)
│   ├── nosotros.tsx                      Página dedicada de historia, valores y atelier de marca
│   ├── catalogo.tsx                      Catálogo completo con subfiltro dinámico de categorías
│   ├── categoria.$slug.tsx               Categoría padre (vista dual: subcategorías + productos)
│   ├── categoria.$slug.$sub.tsx          Subcategoría específica con listado filtrado
│   ├── producto.$id.tsx                  Ficha de producto con galería sticky lg:top-8
│   ├── tag.$key.tsx                      Listados temáticos (Novedades, Ofertas, Más Vendidos)
│   ├── checkout.tsx                      Checkout multi-paso con delivery automático por distrito
│   ├── confirmacion.tsx                  Confirmación y resumen de pedido con CTA a WhatsApp
│   ├── libro-de-reclamaciones.tsx        Formulario de reclamaciones según normativa peruana
│   ├── admin-login.tsx / admin.tsx       Acceso y layout protegido del administrador
│   └── admin/                            Módulos CRUD del panel administrativo:
│       ├── banners.tsx                   Gestión de Hero Banners (2560×960 px)
│       ├── popup.tsx                     Configuración de popup promocional
│       ├── categorias.tsx                Árbol de categorías y subcategorías
│       ├── productos.tsx                 Gestión de catálogo con auto-scroll y resalte ámbar
│       ├── colecciones-home.tsx          Configuración de colecciones en Home
│       ├── ocasiones.tsx                 Gestión de ocasiones y tags
│       ├── distritos.tsx                 Tarifas de delivery por distrito de Lima
│       ├── pedidos.tsx                   Gestión de órdenes y cambio de estados
│       ├── reclamaciones.tsx             Revisión de hojas de reclamaciones
│       ├── tags.tsx                      Configuración de etiquetas y colores dinámicos
│       ├── config.tsx                    Configuración global (WhatsApp, redes, contacto)
│       └── dashboard.tsx                 Métricas de ventas y actividad reciente
├── components/                           Componentes de interfaz
│   ├── Header.tsx                        Header con scroll natural (relative), buscador y menú
│   ├── Hero.tsx                          Slider principal con proporción 8:3 (2560×960 px)
│   ├── CategoryShowcase.tsx              Bento Collage editorial asimétrico de colecciones
│   ├── Novedades.tsx                     Carrusel de productos con tarjetas balanceadas para laptops
│   ├── ProductGrid.tsx                   Cuadrícula responsiva reutilizable de tarjetas
│   ├── ProductFilters.tsx                Filtros interactivos por precio, orden y subcategorías
│   ├── CartDrawer.tsx                    Drawer lateral deslizante del carrito de compras
│   ├── PopupModal.tsx                    Modal de suscripción con frecuencia controlada (1 por sesión)
│   ├── AnnouncementBar.tsx               Cintillo de anuncios superior configurable
│   ├── DeliveryZones.tsx                 Sección informativa de cobertura y distritos
│   ├── Faq.tsx                           Acordeón de preguntas frecuentes
│   ├── Footer.tsx                        Pie de página con enlaces institucionales y redes
│   └── ui/                               Componentes base (Shadcn UI / Tailwind CSS)
├── lib/
│   ├── supabase.ts                       Instancia del cliente Supabase (`createClient`)
│   ├── queries.ts                        Capa centralizada de consultas (`getProductosPorCategorias`, etc.)
│   ├── tag-utils.ts                      Resolución bidireccional de alias de tags y colores
│   └── utils.ts                          Funciones de formateo, clases (`cn`) y utilidades
├── store/
│   └── cart.ts                           Estado global del carrito en memoria (Zustand)
├── types/
│   └── database.ts                       Tipado TypeScript completo de las tablas de Supabase
├── server.ts / start.ts                  Puntos de entrada SSR y cliente de TanStack Start
└── styles.css                            Variables CSS, fuentes (`Cormorant Garamond`, `DM Sans`) y tokens
```

---

## 5. Capas Arquitectónicas y Flujo de Datos

### 5.1. Capa de Presentación
- **Header con Scroll Natural:** El encabezado `<header>` en `Header.tsx` se posiciona de forma relativa (`relative z-30`). Cuando el usuario se desplaza verticalmente, el header sube y se retira de la pantalla naturalmente junto con el resto del contenido, maximizando el espacio de visualización.
- **Bento Collage Editorial:** Implementado en `CategoryShowcase.tsx`, utiliza CSS Grid asimétrico con una tarjeta vertical destacada de dos filas y una horizontal de dos columnas para jerarquizar las colecciones más demandadas (*Cumpleaños*, *Ramos*, *Amor*, etc.).
- **Escala Responsiva para Laptops:** En `Novedades.tsx`, las tarjetas utilizan un ancho de `230px-250px` con un límite superior de contenedor `max-w-[1400px]`, permitiendo desplegar 5 productos simultáneos sin ocupar toda la altura del monitor en laptops.

### 5.2. Capa de Acceso a Datos (`src/lib/queries.ts`)
Toda interacción con la base de datos se canaliza a través de funciones asíncronas fuertemente tipadas:
- `getProductosPorCategorias(categoriaIds: string[])`: Ejecuta consultas compuestas `supabase.from("productos").select("*").in("categoria_id", categoriaIds)` para alimentar páginas de categorías padre que agrupan varias subcategorías.
- `getProductos(categoriaId?, tag?)`: Filtra por categoría o etiqueta específica.
- `crearPedido(datos)`: Inserta un registro en la tabla `pedidos` con código autogenerado `FM-XXXXXX` y desglose de items en formato JSONB.

### 5.3. Capa de Estado Global (Zustand)
El estado de compra reside exclusivamente en el cliente (`src/store/cart.ts`):
- Los items se almacenan con su identificador, nombre, precio, cantidad e imagen.
- No se guarda en la base de datos hasta que el cliente envía formalmente el formulario de checkout, evitando sobrecarga de registros huérfanos.

---

## 6. Modelo de Datos (Supabase PostgreSQL 17)

```mermaid
erDiagram
    categorias ||--o{ categorias : "parent_id (auto-referencia)"
    categorias ||--o{ productos : "categoria_id"
    categorias ||--o{ ocasiones_home : "categoria_id"
    categorias ||--o{ colecciones_home : "categoria_id"
    distritos  ||--o{ pedidos : "distrito_id"

    config { uuid id, text whatsapp, text correo, text horario, text anuncio_barra, text logo_url }
    banners { uuid id, text imagen_url, text titulo, text subtexto, int orden, bool activo }
    popup { uuid id, text imagen_url, text texto, bool activo }
    categorias { uuid id, text nombre, text slug, uuid parent_id, int orden, bool activo }
    productos { uuid id, text nombre, numeric precio, text[] imagenes, text[] tags, uuid categoria_id, bool activo }
    ocasiones_home { uuid id, text nombre, text icono, uuid categoria_id, int orden, bool activo }
    colecciones_home { uuid id, uuid categoria_id, text imagen_custom_url, int orden, bool activo }
    distritos { uuid id, text nombre, numeric precio_delivery, bool activo }
    pedidos { uuid id, text numero, text nombre_cliente, text telefono, uuid distrito_id, jsonb productos, numeric total, text estado }
    suscriptores { uuid id, text telefono, text origen, timestamp created_at }
```

---

## 7. Estado de Implementación de Módulos (Octubre 2026)

| Módulo / Funcionalidad | Estado | Detalles Técnicos |
| :--- | :---: | :--- |
| **Landing Page / Home** | ✅ | Hero 8:3, Bento Collage, slider balanceado para laptop, delivery y testimonios. |
| **Página `/nosotros`** | ✅ | Ruta dedicada e independiente con narrativa, valores de marca y galería del taller. |
| **Header con Scroll Natural** | ✅ | Des-anclado (`relative`); sube suavemente al hacer scroll. |
| **Catálogo y Subfiltros** | ✅ | Filtros dinámicos por precio, orden y subcategorías jerárquicas activables. |
| **Página de Producto** | ✅ | Ficha completa con selector de cantidad, badges dinámicos y galería sticky `lg:top-8`. |
| **Carrito de Compras** | ✅ | `CartDrawer` con control de cantidades reactivo y subtotal calculado al instante. |
| **Checkout & Delivery** | ✅ | Validación Zod, selección de distrito con tarifa en tiempo real y código `FM-XXXXXX`. |
| **Confirmación de Compra** | ✅ | Resumen de pedido con botón de contacto y seguimiento en WhatsApp. |
| **Panel Administrativo** | ✅ | CRUD completo para las 10 tablas, auto-scroll ámbar al editar productos, reordenamiento. |
| **Gestión de Tags** | ✅ | Unificación de alias bidireccional en `tag-utils.ts` con colores dinámicos reflejados. |
| **Imágenes HD WebP** | ✅ | Activos optimizados servidos a través del CDN de Supabase Storage. |
| **Seguridad Core** | ✅ | Parche `@tanstack/react-start 1.168.60` (CVE-2026-102989) y políticas RLS activas. |
| **Pasarela IZIPay** | ⚠️ | En espera de credenciales de comercio; flujo de pago coordinado vía WhatsApp. |
| **Correo Automático** | ❌ | Pendiente de integración con proveedor transaccional (Resend o SendGrid). |

---

## 8. Consideraciones de Despliegue y CI/CD

1. **Pipeline de Construcción:**
   - Script de compilación: `npm run build` (`vite build`).
   - Generación de artefactos para SSR en `dist/server/server.js` y cliente en `dist/client/`.
   - Script `scripts/postbuild.js` copia los activos de cliente a `dist/` para resolver peticiones del bridge serverless.
2. **Entorno de Producción:**
   - Alojado en Vercel con ramas de despliegue continuo `master` y `main`.
   - Variables de entorno públicas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) inyectadas durante el build.
