# Brand Kit — Florería Miraflores

Guía de identidad visual del sistema. Esta carpeta es la **fuente única de verdad** para logo, color y tipografía.

> ⚠️ **Nota importante sobre divergencia.** El `CLAUDE.md` (sección 4) describe una paleta champagne/crema con tipografía *Cormorant Garamond*. El **código real** (`src/styles.css`) NO usa eso: usa una paleta marfil/blanco con acento rosa y *DM Sans* para todo. Esta guía documenta **lo que el sitio realmente renderiza hoy**. Si se quiere volver a la propuesta original del CLAUDE.md, es una decisión de diseño pendiente (ver sección "Divergencia" al final).

---

## 1. Logo

Ubicación: `brand/logo/`

| Archivo | Uso |
| --- | --- |
| `logo-miraflores.svg` | **Principal.** `fill="currentColor"` — hereda el color del contexto. Úsalo por defecto. |
| `logo-miraflores-negro.svg` | Negro fijo (`#1A1A1A`) sobre fondos claros. |
| `logo-miraflores-blanco.svg` | Blanco (`#FFFFFF`) sobre fondos oscuros (footer, overlays). |
| `logo-miraflores-rosa.svg` | Acento rosa (`#C4848A`) para usos especiales. |
| `logo-miraflores.webp` | Raster original (1212×473) — solo fallback / redes sociales. |

El logo es un **imagotipo**: la letra "M" estilizada como tulipán + el logotipo caligráfico "Miraflores" + el tagline "boutique floral". Se vectorizó desde el `.webp` original, por lo que ahora escala sin pérdida a cualquier tamaño.

**Reglas de uso**
- Mantener un área de respeto alrededor equivalente a la altura de la "M".
- No deformar, rotar ni cambiar las proporciones. No aplicar sombras ni contornos.
- Sobre foto: usar la variante blanca con suficiente contraste, o una capa de oscurecimiento detrás.
- Tamaño mínimo legible: ~120 px de ancho (el tagline deja de leerse por debajo).
- En el código, importar el SVG y recolorear con `text-*` (gracias a `currentColor`).

```tsx
import logo from "@/brand/logo/logo-miraflores.svg?react"; // o <img src=...>
<span className="text-[#1A1A1A]"><Logo className="h-8 w-auto" /></span>
```

---

## 2. Paleta de color (real, desde `src/styles.css`)

| Token CSS | Hex | Uso |
| --- | --- | --- |
| `--background` / `--ivory` | `#FFFFFF` | Fondo principal |
| `--ivory-soft` | `#FAF8F6` | Secciones alternadas, cards suaves |
| `--foreground` / `--primary` | `#1A1A1A` | Texto principal, botones oscuros |
| `--muted-foreground` | `#8C8A84` | Texto secundario |
| `--rose-accent` / `--ring` | `#C4848A` | **Acento de marca** — CTAs, focos, detalles |
| `--border` | `rgba(0,0,0,.06)` | Bordes finos |
| `--destructive` | `#D64545` aprox | Errores |

El acento **rosa `#C4848A`** es el color de marca que ve el cliente hoy (no el champagne dorado del CLAUDE.md).

---

## 3. Tipografía (real)

Todo el sitio usa **DM Sans** (display, body e itálica apuntan a la misma familia en `src/styles.css`).

| Rol | Familia | Peso |
| --- | --- | --- |
| Títulos (`h1–h4`, `.font-display`) | DM Sans | 400, `letter-spacing: -0.02em` |
| Cuerpo (`body`, `.font-body`) | DM Sans | 300 |

Fuentes **importadas pero no cableadas** a variables (disponibles si se quieren usar): Playfair Display, Montserrat, Jost. Se cargan desde Google Fonts en la línea 1 de `styles.css`.

Radio de bordes base: `--radius: 0.25rem` (esquinas sutiles).

---

## 4. Tokens

Ver `brand/tokens.css` para copiar/pegar las variables. Son las mismas que ya viven en `src/styles.css` — este archivo es la referencia de marca aislada.

---

## 5. Divergencia con CLAUDE.md (pendiente de decisión)

| Elemento | CLAUDE.md (propuesta) | Código real (hoy) |
| --- | --- | --- |
| Fondo | `#FDFAF6` crema | `#FFFFFF` blanco |
| Superficie | `#F5EFE6` | `#FAF8F6` |
| Acento | `#C4956A` champagne dorado | `#C4848A` rosa |
| Texto | `#2C2420` tierra | `#1A1A1A` casi negro |
| Display | Cormorant Garamond (serif) | DM Sans (sans-serif) |

Recomendación: decidir con Sofía cuál es la identidad oficial y alinear `CLAUDE.md` y `styles.css`. Mientras tanto, esta guía = lo que se ve en producción.
