# Historial de Actualizaciones Técnicas — Florería Miraflores

Este documento registra de manera cronológica y exhaustiva todos los cambios arquitectónicos, nuevas funcionalidades, ajustes de interfaz, optimizaciones de rendimiento y resolución de incidencias realizados en la plataforma.

---

## Índice de Versiones e Hitos

| Versión | Fecha | Tipo | Resumen de Cambios |
| :---: | :---: | :---: | :--- |
| **v1.4.2** | 2026-10-08 | **Admin / Jerarquía** | Soporte explícito y visualización de subcategorías agrupadas por padre en Colecciones Home. |
| **v1.4.1** | 2026-10-08 | **UI / Navbar** | Retiro de botones "Catálogo", "Nosotros" y "Preguntas" del menú superior del Header para una vista limpia y enfocada en flores. |
| **v1.4.0** | 2026-10-08 | **UX / Layout** | Header con scroll natural (des-anclaje de sticky) y calibración de galería de producto. |
| **v1.3.5** | 2026-10-08 | **Responsive** | Escala y proporción armónica para laptops en slider de novedades y colecciones. |
| **v1.3.0** | 2026-10-08 | **Catálogo / Home** | Reemplazo de colecciones de baja densidad por "Cumpleaños" y "Ramos", fotos HD y filtros de subcategorías. |
| **v1.2.0** | 2026-10-07 | **Diseño Editorial** | Rediseño Collage Bento asimétrico para colecciones destacadas del Home. |
| **v1.1.0** | 2026-10-07 | **Estructura Web** | Creación de página dedicada `/nosotros` y simplificación de la landing page (retiro de ocasiones y sobrecarga). |
| **v1.0.5** | 2026-10-07 | **UX / Limpieza** | Retiro del listón lateral flotante de promociones para navegación limpia. |
| **v1.0.4** | 2026-10-07 | **Seguridad / CI** | Parche de seguridad CVE-2026-102989 en `@tanstack/react-start` y normalización de pipeline en Vercel. |
| **v1.0.3** | 2026-10-06 | **Admin / Datos** | Unificación de tags, alias automáticos y feedback visual con auto-scroll en edición de productos. |
| **v1.0.2** | 2026-10-05 | **Branding** | Incorporación de favicon e isotipos multirresolución y proporción exacta del Hero Banner (8:3). |
| **v1.0.1** | 2026-10-04 | **Contenido / DB** | Carga masiva y optimización de activos fotográficos WebP en Supabase Storage (80+ productos). |

---

## Detalle de Hitos y Actualizaciones

### [v1.4.2] — 2026-10-08: Organización Jerárquica de Categorías y Subcategorías en Colecciones Home

#### Solicitud del Cliente
> *"¿No permite subcategorías?"* (Al abrir el selector de agregar colecciones en `/admin/colecciones-home`).

#### Contexto y Diagnóstico
Aunque la base de datos y el componente de la tienda ya soportaban el enlace hacia subcategorías, el selector desplegable en el panel de administración (`/admin/colecciones-home`) mostraba una lista alfabética plana sin distinguir entre categorías principales y subcategorías (ej. *Coronas Fúnebres* o *Cruces* aparecían sueltas sin indicar que pertenecen a *Defunción*, o *Ramos* aparecía duplicado sin saber si correspondía a *Tulipanes* o a *Arreglos Florales*). Tampoco la tabla indicaba el tipo de elemento configurado.

#### Solución Técnica Implementada
1. **Selector con `<optgroup>` y jerarquía visual (`src/routes/admin/colecciones-home.tsx`):**
   - Se agruparon las opciones en:
     * `── CATEGORÍAS PRINCIPALES ──`: Listado de categorías padre activas (*Arreglos Florales, Tulipanes, Defunción, Ocasión, etc.*).
     * `── SUBCATEGORÍAS DE [PADRE] ──`: Grupos dedicados por categoría padre con prefijo indicativo (ej. `↳ Girasoles (de Primaverales)`, `↳ Coronas Fúnebres (de Defunción)`).
   - Actualización de etiquetas a **"Categoría o Subcategoría *"** con texto explicativo que confirma la compatibilidad total.
2. **Badges de tipo en la tabla de colecciones:**
   - La columna ahora se titula **Colección / Tipo**.
   - Cada fila cuenta con un badge diferenciador: `Principal` o `Subcategoría de [Padre]`, tanto en versión de escritorio como en tarjetas móviles.
3. **Respeto riguroso del orden del administrador (`src/lib/queries.ts`):**
   - Se ajustó la consulta de `getColecciones()` para priorizar el orden manual (`col.orden`) establecido en la tabla por el administrador mediante las flechas ↑↓.

---

### [v1.4.1] — 2026-10-08: Retiro de Botones "Catálogo", "Nosotros" y "Preguntas" del Menú del Header

#### Solicitud del Cliente
> *"Quita de la vista de la landing el botón de nosotros, preguntas y catálogo."*

#### Contexto y Diagnóstico
En la barra de navegación del Header (`Header.tsx`), los enlaces directos a `Catálogo`, `Nosotros` y `Preguntas` ocupaban espacio horizontal al final de la lista de categorías florales. Al acumularse 12 elementos en una sola línea, la cabecera se percibía densa y comprimida en resoluciones de laptop y escritorio.

#### Solución Técnica Implementada
1. **Despeje de la barra de navegación de escritorio (`src/components/Header.tsx`):**
   - Se removieron los elementos `<li>` correspondientes a `/catalogo`, `/nosotros`, `/#faq` y el dropdown colapsable `Más`.
   - La barra ahora se dedica con exclusividad al descubrimiento de flores: **Inicio** + las 8 categorías padre oficiales (*Ocasión, Arreglos Florales, Arreglos Premium, Tulipanes, Primaverales, Defunción, Novedades, Ofertas*).
   - Se otorgó un espaciado más amplio y refinado (`gap-3 lg:gap-4 xl:gap-6 2xl:gap-8`) y tipografía con mayor legibilidad (`text-[11px] lg:text-[11.5px] xl:text-[12px] 2xl:text-[12.5px]`).
   - El botón **Inicio** ahora se muestra de forma consistente en todos los anchos de escritorio (`lg:block`).
2. **Sincronización del menú móvil:**
   - Se removieron igualmente los enlaces directos a "Catálogo Completo", "Sobre Nosotros" y "Preguntas frecuentes" del cajón deslizable móvil, manteniendo el menú enfocado en categorías y zonas de despacho.
3. **Persistencia institucional:**
   - La información institucional de la empresa ("Sobre nosotros"), las "Preguntas frecuentes" y el catálogo completo continúan estando plenamente disponibles y accesibles en el pie de página (`Footer.tsx`).

---

### [v1.4.0] — 2026-10-08: Header con Scroll Natural y Des-anclaje de Barra Fija

#### Solicitud del Cliente
> *"Otro también es del header que suba cuando se scrolea, que no se quede."*

#### Contexto y Diagnóstico
El encabezado `<header>` utilizaba las clases `sticky top-0 z-30`, lo cual mantenía una franja de entre 64px (móvil) y 96px (escritorio) fija en la parte superior de la pantalla durante todo el recorrido del usuario. En dispositivos de altura reducida o laptops, esta barra persistente consumía un porcentaje notable del área visible de compra.

#### Solución Técnica Implementada
1. **Flujo de desplazamiento relativo:**
   - En [`src/components/Header.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/components/Header.tsx), se removieron las clases `sticky top-0` y se asignó `relative z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]`.
   - El header ahora se desplaza hacia arriba con el flujo natural del documento, desapareciendo de la vista cuando el usuario hace scroll hacia abajo.
2. **Reajuste en ficha de producto:**
   - En [`src/routes/producto.$id.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/routes/producto.$id.tsx), la columna sticky de la galería de fotos contaba con `lg:top-36` para evitar solaparse con el header fijo original.
   - Al no existir el header estático, se recalibró el anclaje a `lg:top-8`, maximizando la superficie visible de la fotografía y eliminando el espacio vacío artificial de 144px.
3. **Persistencia funcional:**
   - Los drawers móviles (menú lateral y carrito `CartDrawer`) mantienen sus propiedades `fixed inset-0` intactas, asegurando un despliegue impecable en cualquier posición de scroll.

---

### [v1.3.5] — 2026-10-08: Escala y Proporción Armónica para Pantallas de Laptops

#### Solicitud del Cliente
> *"Tal vez no se está adaptando bien porque en su pantalla sale muy grande."*

#### Contexto y Diagnóstico
En pantallas estándar de laptops (resoluciones comunes de 1366×768, 1440×900 y 1536×864 px), las tarjetas de producto en el carrusel de novedades (`Novedades.tsx`) tenían un ancho forzado de `w-[325px] sm:w-[345px]`. Esto provocaba una altura resultante de casi 480px, acaparando más del 65% del alto vertical visible de la laptop y permitiendo visualizar únicamente 2 a 3 tarjetas simultáneas de forma desproporcionada.

#### Solución Técnica Implementada
1. **Redimensión armónica de tarjetas (`src/components/Novedades.tsx`):**
   - Se ajustó el ancho base a `w-[215px] sm:w-[230px] lg:w-[245px] xl:w-[250px]`.
   - La altura total de cada tarjeta se redujo de ~470px a ~340px, permitiendo que en pantallas de laptop quepan cómodamente 5 productos completos a la vez.
   - Tipografía adaptada con títulos en `text-[13px] lg:text-[14px]` y badges calibrados para una apariencia limpia y refinada.
2. **Contenedores acotados:**
   - Se acotó el ancho máximo del contenedor principal a `max-w-[1400px]` con márgenes laterales elásticos (`px-4 sm:px-6 lg:px-12`) para evitar que el contenido toque los bordes del monitor.

---

### [v1.3.0] — 2026-10-08: Optimización de Colecciones y Filtros Jerárquicos en Catálogo

#### Solicitud del Cliente
> *"El nacimiento y luxury no hay creo en el catálogo... podemos cambiarlos por otros que tengan más fotos."*

#### Contexto y Diagnóstico
La sección de colecciones del Home mostraba categorías como *Nacimientos* y *Box Luxury*, las cuales únicamente disponían de 2 productos en la base de datos de producción, restando valor a la experiencia de descubrimiento del usuario. Además, en el catálogo general, seleccionar una categoría padre no permitía desglosar sus subcategorías de manera inmediata.

#### Solución Técnica Implementada
1. **Reemplazo por colecciones de alta disponibilidad:**
   - En [`src/components/CategoryShowcase.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/components/CategoryShowcase.tsx), se reemplazaron las tarjetas por:
     - **Cumpleaños:** Categoría destacada con más de 40 productos en stock.
     - **Ramos:** Categoría insignia con 55 productos activos.
   - Vinculación con fotografías WebP en alta resolución servidas desde Supabase Storage.
2. **Consulta multi-categoría recursiva:**
   - En [`src/lib/queries.ts`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/lib/queries.ts), se creó la función `getProductosPorCategorias(categoriaIds: string[])` para realizar consultas mediante el operador `in` de Supabase, obteniendo en una única petición todos los productos de un grupo de categorías hijas.
3. **Navegación unificada en `/categoria/$slug`:**
   - En [`src/routes/categoria.$slug.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/routes/categoria.$slug.tsx), cuando una categoría padre tiene hijas (ej. *Tulipanes* o *Arreglos Florales*), se muestran tanto los botones de acceso directo a cada subcategoría como el grid completo con todos los productos combinados debajo.
4. **Subfiltro interactivo en `/catalogo`:**
   - En [`src/routes/catalogo.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/routes/catalogo.tsx), al seleccionar una categoría padre, aparece una barra secundaria de subcategorías que permite filtrar de inmediato sin tener que abandonar la vista.

---

### [v1.2.0] — 2026-10-07: Bento Collage Editorial Asimétrico en Home

#### Solicitud del Cliente
> *"¿Podemos darle otro formato tipo collage a esto?"*

#### Solución Técnica Implementada
- En [`src/components/CategoryShowcase.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/components/CategoryShowcase.tsx), se sustituyó la cuadrícula estática uniforme por un layout Bento asimétrico:
  - **Tarjeta protagonista (Feature):** Abarca 2 filas verticales (`md:col-span-1 md:row-span-2`), ofreciendo gran impacto visual con fotografía vertical de alta calidad.
  - **Tarjeta ancha horizontal:** Ocupa 2 columnas (`md:col-span-2 md:row-span-1`) para destacar arreglos prémium.
  - **Tarjetas complementarias:** Cuadrículas armónicas con overlay suave y tipografía `Cormorant Garamond`.
  - Microinteracción de zoom sutil (`group-hover:scale-105 duration-700`) y pill flotante con la cantidad dinámica de arreglos disponibles por categoría.

---

### [v1.1.0] — 2026-10-07: Página Dedicada `/nosotros` y Depuración del Home

#### Solicitud del Cliente
> *"Flores para cada momento esa parte no va, y el de nosotros en la landing no va, podría ser en otra página."*

#### Solución Técnica Implementada
1. **Creación de ruta independiente `/nosotros`:**
   - Se creó [`src/routes/nosotros.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/routes/nosotros.tsx) como una experiencia editorial completa:
     - Historia de Florería Miraflores y su taller en el corazón del distrito.
     - Pilares: Arte Floral de Autor, Selección Consciente de Flores y Experiencia de Entrega en 60 minutos.
     - Galería visual del atelier y formulario/enlace directo de contacto.
2. **Depuración del Home (`src/routes/index.tsx`):**
   - Se removió el bloque de ocasiones (`Occasions.tsx`) y el bloque embebido de "Nosotros" (`About.tsx`).
   - El Home ahora prioriza estrictamente la conversión y descubrimiento de producto: **Hero Banner → Bento Collage de Colecciones → Novedades / Más Vendidos → Delivery y Testimonios → Footer**.
   - Los enlaces a "Nosotros" se redirigieron hacia la nueva ruta `/nosotros` en el menú del Header y en el pie de página.

---

### [v1.0.5] — 2026-10-07: Retiro del Listón Lateral Flotante de Promociones

#### Solicitud del Cliente
> *"No sé dónde hiciste el push porque el cintillo aún se mira... esa parte no va."*

#### Solución Técnica Implementada
- En [`src/components/PopupModal.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/components/PopupModal.tsx), se removió el botón/listón rosa lateral permanente que permanecía anclado a la derecha de la ventana (`fixed right-0 top-1/2`).
- El popup promocional se mantiene administrable y controlado mediante frecuencia de sesión (`sessionStorage`), pero sin generar ruido visual persistente en los costados de la pantalla.

---

### [v1.0.4] — 2026-10-07: Parche de Seguridad CVE-2026-102989 y Normalización Vercel

#### Diagnóstico
Durante los despliegues en Vercel, el build fallaba debido a una vulnerabilidad reportada en versiones anteriores del framework `@tanstack/react-start` (CVE-2026-102989), y conflictos entre archivos de bloqueo (`bun.lock` vs `package-lock.json`).

#### Solución Técnica Implementada
1. Se actualizó la dependencia `@tanstack/react-start` a la versión `1.168.60`.
2. Se eliminó el archivo `bun.lock` y se definió de forma explícita el comando de instalación en la configuración de Vercel mediante `npm ci` / `npm install`.
3. Se verificó la generación adecuada de artefactos SSR (`dist/server/server.js`) y cliente (`dist/client/`) con script post-build (`scripts/postbuild.js`).

---

### [v1.0.3] — 2026-10-06: Unificación de Tags y Feedback Visual en Edición de Productos

#### Diagnóstico
Al renombrar tags en el panel de control (ej. *Globos para enamorar*), los productos previamente asociados conservaban la clave histórica `flores_y_globos_para_sorprender`, renderizando insignias negras en la tienda. Además, al editar productos en el panel admin, la lista se reordenaba alfabéticamente desplazando el producto y provocando la falsa impresión de pérdida de datos.

#### Solución Técnica Implementada
1. Creación de [`src/lib/tag-utils.ts`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria miraflores/floreria-miraflo-main/src/lib/tag-utils.ts) para resolución bidireccional de alias y migración transparente en segundo plano.
2. Adición de selector de ordenamiento en la tabla de productos del administrador (orden por más recientes `created_at DESC`).
3. Resalte visual animado en color ámbar (`ring-2 ring-amber-400`) y auto-scroll centrado en la fila del producto editado.

---

### [v1.0.2] — 2026-10-05: Branding Oficial y Proporción del Hero Banner

#### Solución Técnica Implementada
1. Creación y despliegue del paquete oficial de favicons e isotipos en formato `.ico` multirresolución (16x16, 32x32, 48x48), `.svg` vectorial, `.png` (180x180 para Apple Touch) y `site.webmanifest`.
2. Estandarización de las dimensiones del slider/banner principal del Home a la proporción oficial de diseño **8:3 (2560 × 960 px)**, tanto en los estilos frontend como en las recomendaciones del panel de administración.

---

### [v1.0.1] — 2026-10-04: Carga y Optimización de Activos Fotográficos WebP

#### Solución Técnica Implementada
1. Creación del bucket público `productos` en Supabase Storage con políticas RLS de acceso público y escritura autenticada.
2. Procesamiento, compresión y subida masiva de más de 80 fotografías reales de arreglos florales, ramos de novia, box románticos y tulipanes en formato moderno **WebP**, garantizando pesos inferiores a 120 KB por imagen y tiempos de carga instantáneos.
