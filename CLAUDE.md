# CLAUDE.md — Florería Miraflores

Guía de contexto completo para el agente de desarrollo. Leer antes de tocar cualquier archivo.

---

## 1. IDENTIDAD DEL PROYECTO

| Campo              | Valor                                          |
| ------------------ | ---------------------------------------------- |
| Nombre del negocio | Florería Miraflores                            |
| Dominio            | floreriamiraflores.com                         |
| Tipo               | E-commerce de flores y regalos — Lima, Perú    |
| Mercado            | Miraflores, Surco, Barranco, Lince, San Isidro |

---

## 2. ESTADO ACTUAL DEL PROYECTO

> Leer esto PRIMERO antes de construir cualquier cosa. Evita duplicar trabajo.

### Archivos YA existentes en Lovable (NO recrear)

**Componentes (`/components`):**

- `AnnouncementBar.tsx` — barra de anuncio superior
- `Header.tsx` — header con nav (mobile: acordeón, desktop: dropdown)
- `Hero.tsx` — slider/banner principal
- `CategoryShowcase.tsx` — grilla de colecciones destacadas en home
- `Novedades.tsx` — sección novedades con badges
- `Occasions.tsx` — sección ocasiones con iconos
- `ProductGrid.tsx` — grid reutilizable de cards de producto
- `About.tsx` — sección marca con imagen + bullets
- `Faq.tsx` — acordeón de preguntas frecuentes estáticas predeterminadas
- `Footer.tsx` — footer con redes y contacto
- `WhatsappFab.tsx` — botón flotante de WhatsApp
- `Novias.tsx` — componente existente (verificar si tiene ruta asignada)

**Rutas (`/routes`):**

- `index.tsx` — home completo ✓
- `categoria.$slug.tsx` — categoría padre → muestra subcategorías como cards
- `categoria.$slug.$sub.tsx` — subcategoría → muestra productos
- `libro-de-reclamaciones.tsx` — página existente

**Data (`/data`) — hardcodeada, se reemplaza en Fase 2:**

- `catalog.ts` — productos de muestra
- `categories.ts` — categorías de muestra

**Imágenes de producto ya en el proyecto:**
`product-box-romantico.jpg`, `product-box-sorpresa.jpg`, `product-corona.jpg`,
`product-novedad-aurora.jpg`, `product-novedad-pampas.jpg`, `product-novedad-velvet.jpg`,
`product-novia-eterna.jpg`, `product-novia-jardin.jpg`, `product-novia-minimal.jpg`,
`product-ramo-primavera.jpg`, `product-tulipanes.jpg`

### Estado de Construcción de Páginas y Features

| Página / Feature       | Ruta              | Estado                               |
| ---------------------- | ----------------- | ------------------------------------ |
| Producto individual    | `/producto/:id`   | ✓ Completado                         |
| Drawer de carrito      | componente global | ✓ Completado (CartDrawer.tsx)         |
| Checkout               | `/checkout`       | ✓ Completado                         |
| Confirmación post-pago | `/confirmacion`   | ✓ Completado                         |
| Panel admin            | `/admin/*`        | ✓ Completado                         |
| Conexión Supabase      | —                 | ✓ Completado (Fila única, CRUD admin) |
| IZIPay                 | —                 | ⚠️ Flujo Manual / Pendiente credenciales |

### Fases del proyecto

**FASE 1 — Frontend completo**
* **Completado:** Página de producto individual, Carrito Zustand (CartDrawer), Formulario de Checkout y Confirmación.

**FASE 2 — Conectar Supabase**
* **Completado:** Reemplazado catálogo y categorías estáticas con queries reales de Supabase. Creado panel de administración completo (CRUD para productos, categorías, banners, popup, ocasiones, distritos, pedidos, libro de reclamaciones, tags del home).

**FASE 3 — IZIPay (Automatizado)**
* **Pendiente:** Integración con la pasarela transaccional de cobro en línea IZIPay mediante Edge Functions y webhook.
* **Estado actual:** El checkout registra el pedido en la base de datos de Supabase y redirige al usuario a confirmación de WhatsApp/resumen de pedido. El botón de pago simula la transacción indicando que está pendiente de integración oficial.

---

## 3. STACK TÉCNICO

| Capa             | Tecnología                                              |
| ---------------- | ------------------------------------------------------- |
| Frontend         | React + Vite                                            |
| Backend / DB     | Supabase (PostgreSQL + Storage + Auth + Edge Functions) |
| Deploy           | Vercel                                                  |
| Pasarela de pago | IZIPay                                                  |
| Estilos          | Tailwind CSS                                            |
| Routing          | React Router v6                                         |
| Estado global    | Zustand                                                 |
| Imágenes         | Supabase Storage                                        |

**Reglas de stack:**

- Sin SSR. Todo SPA con Vite.
- Edge Functions para todo lo que toque secrets (IZI, credenciales).
- NUNCA exponer API keys en el frontend.
- RLS activado en todas las tablas de Supabase.
- Carrito en Zustand (memoria del browser, sin BD).

---

## 4. IDENTIDAD VISUAL

### Paleta

```
--color-bg:         #FDFAF6   /* fondo principal — crema muy claro */
--color-surface:    #F5EFE6   /* tarjetas, secciones alternadas */
--color-border:     #E8DDD0   /* bordes suaves */
--color-text:       #2C2420   /* texto principal — tierra oscuro */
--color-text-muted: #8A7A6E   /* texto secundario */
--color-accent:     #C4956A   /* acento tierra/champagne dorado */
--color-accent-dark:#9E7347   /* hover del acento */
--color-white:      #FFFFFF
```

### Tipografía

- **Display / Headings:** `Cormorant Garamond` (serif elegante, tono lujo floral)
- **Body / UI:** `DM Sans` (limpio, legible, moderno)
- Importar desde Google Fonts.

### Estilo general

- Minimalismo refinado con calidez. No frío ni clínico.
- Fotografía como protagonista — layouts limpios.
- Bordes redondeados sutiles (`rounded-xl` aprox).
- Sombras suaves, sin dramatismo.
- Transiciones suaves 200–300ms. Sin animaciones agresivas.

---

## 5. ESTRUCTURA DE RUTAS COMPLETA

```
/                              → Home
/categoria/:slug               → Categoría padre (muestra subcategorías) — YA EXISTE
/categoria/:slug/:sub          → Subcategoría (muestra productos) — YA EXISTE
/producto/:id                  → Producto individual — FALTA
/checkout                      → Checkout — FALTA
/confirmacion                  → Confirmación post-pago — FALTA
/libro-de-reclamaciones        → YA EXISTE
/admin                         → Panel admin (redirect a /admin/dashboard) — FALTA
/admin/login                   → Login admin — FALTA
/admin/dashboard               → Resumen general — FALTA
/admin/banners                 → Gestión de banners — FALTA
/admin/popup                   → Gestión de popup — FALTA
/admin/categorias              → Gestión de categorías — FALTA
/admin/productos               → Gestión de productos — FALTA
/admin/colecciones-home        → Colecciones en home — FALTA
/admin/ocasiones               → Ocasiones en home — FALTA
/admin/distritos               → Distritos y delivery — FALTA
/admin/pedidos                 → Lista de pedidos — FALTA
/admin/config                  → Config general — FALTA
```

---

## 6. FASE 1 — ESPECIFICACIÓN DETALLADA DEL FRONTEND

### 6.1 Carrito (Zustand — global)

Estado global que persiste mientras el usuario navega:

```typescript
interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  agregarItem: (producto: CartItem) => void;
  quitarItem: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  abrirCarrito: () => void;
  cerrarCarrito: () => void;
  total: () => number;
  totalItems: () => number;
}
```

**Drawer del carrito:**

- Se abre desde el ícono del header (contador de items).
- Slide-in desde la derecha, overlay oscuro detrás.
- Lista de items: imagen miniatura, nombre, precio unitario, selector de cantidad (+/-), botón eliminar.
- Footer del drawer: subtotal + botón "Ir al checkout" → navega a `/checkout`.
- Si está vacío: mensaje "Tu carrito está vacío" + botón "Ver catálogo".

### 6.2 Página de Producto Individual `/producto/:id`

**Layout desktop:** imagen izquierda (60%) + info derecha (40%)
**Layout mobile:** imagen arriba, info abajo

**Sección de imagen:**

- Imagen principal grande.
- Si hay múltiples imágenes: miniaturas clickeables debajo.
- Sin zoom (demasiado complejo por ahora).

**Sección de info:**

- Breadcrumb: `Inicio > Ocasión > Cumpleaños > Velvet Box`
- Badge de tag si aplica (NUEVO / EDICIÓN LIMITADA / OFERTA)
- Nombre del producto (Cormorant Garamond, grande)
- Precio en soles: `S/ 220`
- Descripción (párrafo)
- Selector de cantidad: botones `-` y `+`, valor mínimo 1
- Botón primario: **"Agregar al carrito"** → agrega a Zustand + abre drawer
- Botón secundario: **"Comprar ahora"** → agrega a Zustand + navega a `/checkout`
- Nota de delivery: "Delivery disponible en Miraflores, Surco, Barranco, Lince y San Isidro"

**Productos relacionados:**

- Sección al final: 4 productos de la misma subcategoría.
- Usar `ProductGrid` existente.

**Data (Fase 1):** leer desde `data/catalog.ts` por `id`.

### 6.3 Página de Checkout `/checkout`

**Si el carrito está vacío:** redirect automático a `/`.

**Layout:** una columna en mobile, dos columnas en desktop (formulario izquierda, resumen derecha).

**Resumen del pedido (sticky en desktop):**

- Lista de items: imagen, nombre, cantidad, precio
- Subtotal
- Delivery (se calcula cuando elige distrito)
- **Total**

**Formulario — datos del cliente:**

```
Nombre completo *
Teléfono * (con prefijo +51)
Email *
```

**Formulario — datos de entrega:**

```
Distrito * (select con distritos activos + precio de delivery)
Dirección completa *
Referencia (opcional)
Fecha de entrega * (date picker, mínimo mañana)
Hora de entrega * (select: Mañana 9-12 / Tarde 12-17 / Noche 17-21)
Notas adicionales (textarea, opcional)
```

**Lógica de precio delivery:**

- Al seleccionar distrito → mostrar precio de delivery inmediatamente en el resumen.
- Total = subtotal + precio_delivery del distrito seleccionado.
- En Fase 1 los precios de distrito vienen hardcodeados (todos S/10).

**Botón de pago:**

- Texto: "Pagar con IZIPay — S/ [total]"
- En Fase 1: mostrar modal "Integración de pago próximamente" o simular flujo.
- En Fase 3: llamar Edge Function que genera sesión IZIPay.

**Validaciones:**

- Todos los campos marcados con \* son requeridos.
- Email con formato válido.
- Teléfono mínimo 9 dígitos.
- Mostrar errores inline bajo cada campo.
- No permitir submit si hay errores.

### 6.4 Página de Confirmación `/confirmacion`

- Accesible solo después de un pago exitoso (en Fase 1: botón de simulación en checkout).
- Si se accede directo sin estado de pedido → redirect a `/`.

**Contenido:**

- Ícono de check grande (color acento)
- Título: "¡Tu pedido fue recibido!"
- Número de pedido (generado: `#FM-XXXXXX`)
- Resumen: items, datos de entrega, total pagado
- Mensaje: "Recibirás una confirmación a [email]. Si tienes dudas escríbenos al WhatsApp."
- Botón WhatsApp: abre `https://wa.me/51999600482?text=Hola, mi pedido es #FM-XXXXXX`
- Botón: "Seguir comprando" → navega a `/`

---

## 7. REGLAS DE CATEGORÍAS Y PRODUCTOS

**Estructura padre → hijo (los productos siempre cuelgan de una subcategoría):**

```
Ocasión (padre — solo navegación, sin productos directos)
└── Cumpleaños (subcategoría — aquí viven los productos)
      └── Velvet Box S/220
      └── Aurora S/165
```

**Excepción:** Arreglos Premium y Ofertas no tienen subcategorías → sus productos cuelgan del padre directamente.

**En la data (`categories.ts` y `catalog.ts`), cada producto tiene:**

- `id` único
- `nombre`
- `precio`
- `descripcion`
- `imagenes: string[]` (array, usar primera como principal)
- `categoria_id` → apunta a la **subcategoría** (no al padre), excepto Arreglos Premium y Ofertas
- `tags: string[]` → `['novedad' | 'mas_vendido' | 'edicion_limitada' | 'oferta']`
- `activo: boolean`

**Badges en cards y producto individual:**

```
'novedad'          → badge "NUEVO" fondo oscuro
'edicion_limitada' → badge "EDICIÓN LIMITADA" fondo oscuro
'oferta'           → badge "OFERTA" fondo acento
'mas_vendido'      → badge "MÁS VENDIDO" fondo tierra
```

Si tiene múltiples tags, mostrar solo el primero.

---

## 8. CATEGORÍAS (estructura completa)

```
Ocasión                    slug: ocasion
├── Amor / Aniversario     slug: amor-aniversario
├── Cumpleaños             slug: cumpleanos
├── Graduación             slug: graduacion
├── Nacimientos            slug: nacimientos
└── Para Él                slug: para-el

Arreglos Florales          slug: arreglos-florales
├── Box Luxury             slug: box-luxury
├── Box con Chocolates     slug: box-chocolates
├── Inauguración           slug: inauguracion
├── Ramos                  slug: ramos
└── Bonsais                slug: bonsais

Arreglos Premium           slug: arreglos-premium   ← sin subcategorías

Tulipanes                  slug: tulipanes
├── Arreglos               slug: tulipanes-arreglos
├── Ramos                  slug: tulipanes-ramos
└── Floreros               slug: tulipanes-floreros

Primaverales               slug: primaverales
└── Girasoles              slug: girasoles

Defunción                  slug: defuncion
├── Coronas Fúnebres       slug: coronas-funebres
├── Cruces                 slug: cruces
├── Lágrima con Pedestal   slug: lagrima-pedestal
├── Lágrimas               slug: lagrimas
└── Mantos                 slug: mantos

Ofertas                    slug: ofertas             ← sin subcategorías
```

**Navegación:**

- Nav desktop: hover en padre → dropdown con subcategorías.
- Nav mobile: acordeón (ya implementado en `Header.tsx`).
- `/categoria/ocasion` → muestra cards de sus 5 subcategorías.
- `/categoria/ocasion/cumpleanos` → muestra productos de Cumpleaños.
- `/categoria/arreglos-premium` → muestra productos directamente (sin sub).

---

## 9. SECCIONES DEL HOME (referencia para no romper lo existente)

### Barra de anuncio (`AnnouncementBar.tsx`)

- Texto editable. Fondo acento, texto blanco.

### Header (`Header.tsx`)

- Logo + nav con dropdown desktop / acordeón mobile.
- Ícono carrito con contador desde Zustand.
- Sticky en scroll.

### Hero (`Hero.tsx`)

- Slider de banners: imagen fondo, título, subtexto, CTA.

### Colecciones (`CategoryShowcase.tsx`)

- Grid de categorías padre con imagen y contador de subcategorías.

### Novedades (`Novedades.tsx`)

- Productos con tag `novedad` o `edicion_limitada`.
- Cards con badge.

### Ocasiones (`Occasions.tsx`)

- Grid de iconos por ocasión.

### Marca (`About.tsx`)

- Imagen + título + párrafo + bullets.

### Footer (`Footer.tsx`)

- Logo, contacto, horario, redes, libro de reclamaciones.

---

## 10. FLUJO DE CHECKOUT (Fase 3 — IZIPay)

```
1. Cliente llena formulario de checkout
2. Frontend llama Edge Function con: items, distrito, datos cliente
3. Edge Function crea pedido en BD con estado "pendiente"
4. Edge Function llama IZIPay API con el total → recibe token/URL de pago
5. Frontend redirige al cliente a la URL de IZIPay
6. Cliente paga con tarjeta en el entorno seguro de IZIPay
7. IZIPay llama webhook (Edge Function) con resultado
8. Edge Function actualiza pedido a "pagado"
9. Edge Function envía WhatsApp al admin y correo al cliente
10. Cliente ve página /confirmacion
```

**IZIPay — importante:**

- Todo por Edge Functions. NUNCA credenciales en frontend.
- Dos ambientes separados: **Sandbox** (pruebas, no cobra) y **Producción** (cobro real).
- Usar Sandbox hasta que Sofía apruebe el ambiente productivo.
- Variables: `IZIPAY_PUBLIC_KEY`, `IZIPAY_PASSWORD`, `IZIPAY_SHA_KEY`, `IZIPAY_MERCHANT_ID`.
- Cada ambiente tiene sus propias 4 credenciales. NO mezclar.
- Webhook URL: `https://floreriamiraflores.com/api/izipay-webhook`

---

## 11. BASE DE DATOS (Supabase — Fase 2)

### `config`

```sql
CREATE TABLE config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp text,
  correo text,
  horario text,
  logo_url text,
  anuncio_barra text,
  instagram_url text,
  tiktok_url text,
  facebook_url text,
  libro_reclamaciones_activo boolean DEFAULT false
);
-- Solo 1 fila. Siempre upsert.
```

### `banners`

```sql
CREATE TABLE banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imagen_url text NOT NULL,
  titulo text,
  subtexto text,
  cta_texto text,
  cta_link text,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### `popup`

```sql
CREATE TABLE popup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imagen_url text,
  texto text,
  activo boolean DEFAULT false,
  fecha_expiracion date
);
-- Solo 1 fila.
```

### `categorias`

```sql
CREATE TABLE categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  slug text UNIQUE NOT NULL,
  imagen_url text,
  parent_id uuid REFERENCES categorias(id),
  orden integer DEFAULT 0,
  activo boolean DEFAULT true
);
```

### `productos`

```sql
CREATE TABLE productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  precio numeric(10,2) NOT NULL,
  descripcion text,
  imagenes text[],
  categoria_id uuid REFERENCES categorias(id),
  tags text[],
  activo boolean DEFAULT true,
  orden integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### `ocasiones_home`

```sql
CREATE TABLE ocasiones_home (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  icono text,
  categoria_id uuid REFERENCES categorias(id),
  orden integer DEFAULT 0,
  activo boolean DEFAULT true
);
```

### `colecciones_home`

```sql
CREATE TABLE colecciones_home (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid REFERENCES categorias(id),
  imagen_custom_url text,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true
);
```

### `distritos`

```sql
CREATE TABLE distritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  precio_delivery numeric(10,2) NOT NULL DEFAULT 10.00,
  activo boolean DEFAULT true
);
-- Iniciales: Miraflores, Surco, Barranco, Lince, San Isidro — S/10 c/u
```

### `pedidos`

```sql
CREATE TABLE pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,            -- 'FM-000001'
  nombre_cliente text,
  telefono text,
  email text,
  distrito_id uuid REFERENCES distritos(id),
  direccion text,
  referencia text,
  fecha_entrega date,
  hora_entrega text,
  productos jsonb,               -- snapshot del carrito
  subtotal numeric(10,2),
  delivery numeric(10,2),
  total numeric(10,2),
  estado text DEFAULT 'pendiente',
  izi_transaction_id text,
  notas text,
  created_at timestamptz DEFAULT now()
);
```

### RLS

- Lectura pública: `config`, `banners`, `popup`, `categorias`, `productos`, `ocasiones_home`, `colecciones_home`, `distritos`.
- Escritura solo admin: todas las tablas anteriores.
- `pedidos`: INSERT público, SELECT/UPDATE solo admin.

---

## 12. AUTH

- Supabase Auth. Solo 1 usuario admin.
- Crear desde dashboard: `admin@floreriamiraflores.com`.
- Rutas `/admin/*`: verificar sesión. Sin sesión → redirect a `/admin/login`.
- No hay cuentas de clientes.

---

## 13. PANEL ADMIN (Fase 2)

- Layout con sidebar de navegación fija.
- Cada sección: tabla con columnas relevantes + acciones (crear, editar, eliminar, toggle activo, reordenar).
- Reordenamiento: flechas ↑↓ (no drag & drop).
- Upload de imágenes: directo a Supabase Storage con preview inmediato.
- Toggle activo/inactivo: inline sin abrir modal.
- Sección pedidos: tabla con filtro por estado, detalle del pedido al hacer clic.

---

## 14. SEO

- `react-helmet-async` para meta tags por ruta.
- **Home:** `Florería Miraflores | Flores y regalos a domicilio en Lima`
- **Categoría padre:** `[Nombre Categoría] | Florería Miraflores`
- **Subcategoría:** `[Nombre Sub] — [Nombre Padre] | Florería Miraflores`
- **Producto:** `[Nombre Producto] | Florería Miraflores`
- Open Graph: og:title, og:description, og:image en todas las rutas.
- `robots.txt`: permitir todo excepto `/admin`.
- Imágenes con `alt` descriptivo siempre.
- Schema.org `LocalBusiness` en home:

```json
{
  "@type": "Florist",
  "name": "Florería Miraflores",
  "telephone": "+51999600482",
  "email": "pedidos@floreriamiraflores.com",
  "openingHours": "Mo-Su 09:00-21:00",
  "areaServed": ["Miraflores", "Surco", "Barranco", "Lince", "San Isidro"]
}
```

---

## 15. DATOS DE OPERACIÓN

| Campo          | Valor                                            |
| -------------- | ------------------------------------------------ |
| WhatsApp admin | +51 999 600 482                                  |
| Correo pedidos | pedidos@floreriamiraflores.com                   |
| Horario        | 9am a 9pm todos los días                         |
| Instagram      | https://www.instagram.com/floreriamirafloreslima |
| TikTok         | https://www.tiktok.com/@floreriamirafloreslima   |
| Facebook       | pendiente                                        |

### Distritos

| Distrito   | Delivery |
| ---------- | -------- |
| Miraflores | S/10.00  |
| Surco      | S/10.00  |
| Barranco   | S/10.00  |
| Lince      | S/10.00  |
| San Isidro | S/10.00  |

---

## 16. VARIABLES DE ENTORNO

```env
# Frontend (Vite — pueden estar en el cliente)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Solo en Edge Functions / Vercel server-side (NUNCA en frontend)
IZIPAY_PUBLIC_KEY=
IZIPAY_PASSWORD=
IZIPAY_SHA_KEY=
IZIPAY_MERCHANT_ID=
IZIPAY_BASE_URL=        # sandbox o producción
```

---

## 17. PENDIENTES DE SOFÍA

- [ ] Logo PNG fondo transparente
- [ ] 3–5 productos con nombre, precio y fotos (Drive)
- [ ] Credenciales IZIPay Sandbox: Public Key + Password + SHA Key + Merchant ID
- [ ] Link de Facebook

---

## 18. CONVENCIONES DE CÓDIGO

- Componentes: `PascalCase`
- Hooks custom: `useNombre`
- Páginas en `routes/`, componentes en `components/`, hooks en `hooks/`, servicios Supabase en `lib/supabase/`
- Siempre `async/await`. Sin `.then()` chains.
- Errores: feedback visible al usuario (toast). Sin `console.log` en producción.
- Imágenes: `loading="lazy"` salvo above-the-fold.
- Carrito: nunca guardar en BD, solo Zustand (memoria).
