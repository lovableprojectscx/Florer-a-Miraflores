# Reporte — Fase 06-H: 4 Arreglos de Calidad y Limpieza

**Rama:** `master`  
**Fecha:** 15 de Octubre de 2026  
**Estado:** ✅ COMPLETADO Y VERIFICADO CON 0 ERRORES

---

### 1. Calidad con Zoom (Novedades y Secciones del Home)

- **Problema diagnosticado:** Con el zoom 1.25 de las fotos en Novedades/Home, las imágenes se pintaban a ~560px (caja 448px × scale 1.25), pero el atributo `sizes` declaraba `450px`, lo que provocaba que en pantallas de escritorio (DPR 1) el navegador seleccionara la miniatura `thumbs/480/`, mostrándose borrosa.
- **Solución implementada:** Se ajustaron los slots del atributo `sizes` en `ResponsiveImage` multiplicando por 1.25 y asegurando que en escritorio (>=1024px, 1440px y 1920px) el slot declarado sea superior a 480px:
  ```tsx
  sizes="(min-width: 1920px) 565px, (min-width: 1440px) 500px, (min-width: 1024px) 500px, (min-width: 768px) 39vw, 56vw"
  ```
- **Verificación en vivo (`tests/e2e/thumbnails.spec.ts`):**
  - **A 1440px:** `currentSrc` = `https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/thumbs/960/1791156484395-duzcw8d4bil.webp`
  - **A 1920px:** `currentSrc` = `https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/thumbs/960/1791156484395-duzcw8d4bil.webp`
  - Se confirmó que en escritorio **NUNCA** carga `/thumbs/480/`.

---

### 2. Popup Apagado hasta la Fase 10 y Corrección de `handleSubmit`

- **Diagnóstico de `popup.activo`:**
  - En la base de datos `public.popup` el registro tenía `activo: true`.
  - En `queries.ts`, `getPopup()` consulta con `.eq("activo", true)`. Si se apagaba en base de datos o retornaba null, en `PopupModal.tsx` existía la condición `if (popup) { if (popup.activo === false) return; }`. Al ser `null`, no entraba a la condición y **se abría igual a los 3 segundos** mostrando el modal genérico.
  - Por lo tanto, `popup.activo` en BD **no controlaba con seguridad** la desactivación total del componente.
- **Acción:**
  - Se definió `export const POPUP_ACTIVO = false;` en `src/components/PopupModal.tsx`. Si está en `false`, el componente retorna `null` inmediatamente, previniendo cualquier temporizador, bloqueo de scroll o apertura no deseada hasta la Fase 10.
- **Corrección de `handleSubmit`:**
  - Si la inserción a Supabase falla o hay error de red, el flujo **NO marca como suscrito** en el estado ni en `localStorage` (`SUBSCRIBED_KEY`), **NO muestra el cupón**, despliega el mensaje de error y muestra un botón verde prominente **"Escríbenos por WhatsApp"** apuntando a la florería.
- **Base de datos:**
  - **No se creó** la tabla `suscriptores` (queda reservada para la Fase 10 con nombre y casilla de consentimiento de datos personales).

---

### 3. Footer: Ocultar Íconos con Enlace Vacío o "pendiente"

- En la base de datos `public.config`, `facebook_url` tiene el valor literal `"pendiente"`, lo que provocaba que se renderizara el ícono de Facebook enlazando a `/pendiente`.
- Se implementó la función validadora `esUrlValida(url)` en `src/components/Footer.tsx`:
  - Si la URL es nula, vacía, o igual a `"pendiente"` / `"/pendiente"` (insensible a mayúsculas), el ícono **no se renderiza**.
  - Aplica de forma homogénea para Instagram, TikTok y Facebook.

---

### 4. Footer: Remover Link "Términos del Servicio" a `/#faq`

- Se removió el enlace `{ label: "Términos del Servicio", href: "/#faq" }` del listado de navegación del Footer para evitar presentar las Preguntas Frecuentes como términos legales, a la espera de la página definitiva `/terminos` en la Fase 10.

---

### 5. Resumen de Pruebas (Corrida Completa E2E)

Ejecutado con 1 worker (`npx playwright test`):
```
Running 120 tests using 1 worker

  107 passed (5.6m)
   13 skipped
    0 failed
```
Evidencia archivada en: `docs/evidencias/fase-06h/e2e.txt`.

---

### 6. Declaración de Archivos Descartados y Datos Escritos

- **Archivos descartados:** **Ninguno.** No se ejecutó ningún `git checkout --`, `git restore`, `git clean` ni `Remove-Item`.
- **Datos escritos en la base:** **Ninguno.** No se ejecutó ningún `INSERT`, `UPDATE` ni `DELETE` en la base de datos de Supabase.
