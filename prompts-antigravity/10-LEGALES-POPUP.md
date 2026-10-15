# FASE 10 — Legales + checkout con aceptación + popup con nombre

Lee primero `prompts-antigravity/00-REGLAS-Y-ARRANQUE.md` (reglas de velocidad incluidas).
Trabaja en master. Push solo a master.

## Reglas de esta fase

- Los textos legales de la sección "TEXTOS" se copian TAL CUAL. No los reescribas, no agregues cláusulas, no inventes datos.
  Si algo no encaja técnicamente, avísame en el reporte; no lo "arregles" redactando.
- SQL 011 NO se ejecuta hasta que el revisor diga "SQL 011 aprobado por el revisor". Primero: escribe el SQL, pégalo en el reporte y espera.
- No insertes suscriptores ni pedidos de prueba en producción. E2E que escriban, solo con E2E_ALLOW_WRITES=1.
- El popup sigue apagado (POPUP_ACTIVO = false) hasta que el SQL 011 esté ejecutado y verificado.

## 1. Páginas legales (rutas nuevas, SSR, con meta title/description)

- `/terminos` → texto T1
- `/privacidad` → texto T2
- `/cambios-y-devoluciones` → texto T3
- Diseño sobrio, mismo estilo de /libro-de-reclamaciones: ancho de lectura ~70ch, títulos h2, legible en 390px sin scroll horizontal.
- Footer: agrega los 3 links junto a "Libro de Reclamaciones" (bloque "Legal").
- Agrega las 3 rutas al sitemap.

## 2. Libro de Reclamaciones

- Establecimiento: `Tienda virtual — florer-a-miraflores.vercel.app — Lima, Perú` (en pantalla, impresión y .txt).
- Sin dirección física (decisión de Sofía).
- Agrega debajo del encabezado un enlace a "Política de cambios y devoluciones".

## 3. Checkout: aceptación obligatoria

- Casilla NO marcada por defecto, obligatoria para pagar/enviar pedido:
  "He leído y acepto los [Términos y condiciones] y la [Política de cambios y devoluciones]." (links abren en pestaña nueva)
- Si no está marcada: botón deshabilitado o error claro junto a la casilla.
- Guardar evidencia en el pedido: columnas `acepto_terminos` (boolean) y `acepto_terminos_at` (timestamptz) — ver SQL 011.
- Validación también en el schema (checkout-schema) y en el insert; no solo en la UI.

## 4. Popup con nombre + permiso (sin cupón)

- ELIMINA por completo el cupón MIRAFLORES10 (constante, pantalla de cupón, botón copiar, texto de WhatsApp con cupón).
- Campos: Nombre (obligatorio, 2–60 caracteres) + WhatsApp (+51, 9 dígitos que empiecen en 9).
- Casilla NO marcada por defecto, obligatoria:
  "Acepto que Florería Miraflores me envíe promociones y novedades por WhatsApp. Puedo darme de baja cuando quiera. Ver [Política de privacidad]."
- Texto del popup: "Club Florería Miraflores — Recibe novedades, promociones y recordatorios de fechas especiales por WhatsApp."
- Botón: "Quiero recibir novedades".
- Al enviar: insert en `suscriptores` con nombre, telefono `+51XXXXXXXXX`, consentimiento=true, consentimiento_texto (el texto exacto de la casilla), origen 'popup_home'.
  - OK → "¡Listo, {nombre}! Te escribiremos con novedades." y marcar suscrito en localStorage.
  - Error 23505 (número ya registrado) → mismo mensaje de éxito (no revelar si existe).
  - Cualquier otro error → NO marcar suscrito; mostrar error + botón "Escríbenos por WhatsApp" (ya existe de 06-H).
- Mostrar el popup solo si POPUP_ACTIVO && la fila de `popup` existe y activo = true (si no hay fila, NO se muestra).
- Al final (tras SQL 011 verificado) pon POPUP_ACTIVO = true.

## 5. Admin `/admin/suscriptores`

- Tabla: nombre, teléfono, fecha, origen, estado (activo / baja).
- Botón "Dar de baja" (UPDATE activo=false, baja_at=now()) — para cuando alguien pida que no le escriban.
- Botón "Exportar CSV" (solo activos; columnas nombre, telefono, fecha).
- Link en el menú del admin.

## SQL 011 (escríbelo en docs/sql/011-legales-suscriptores.sql, NO lo ejecutes aún)

```sql
-- Suscriptores con consentimiento
CREATE TABLE IF NOT EXISTS public.suscriptores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 60),
  telefono text NOT NULL UNIQUE CHECK (telefono ~ '^\+519[0-9]{8}$'),
  consentimiento boolean NOT NULL CHECK (consentimiento = true),
  consentimiento_texto text NOT NULL,
  origen text NOT NULL DEFAULT 'popup_home',
  activo boolean NOT NULL DEFAULT true,
  baja_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suscriptores ENABLE ROW LEVEL SECURITY;

-- Público: solo puede insertar (no leer, no editar)
CREATE POLICY "Public insert suscriptores" ON public.suscriptores
  FOR INSERT TO anon, authenticated
  WITH CHECK (consentimiento = true AND activo = true AND baja_at IS NULL);

-- Admin: todo
CREATE POLICY "Admin all suscriptores" ON public.suscriptores
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Evidencia de aceptación en pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS acepto_terminos boolean NOT NULL DEFAULT false;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS acepto_terminos_at timestamptz;
```

- Revisa antes que la tabla de pedidos se llame `pedidos` y que la policy de insert de pedidos no bloquee las 2 columnas nuevas; si hay que ajustarla, inclúyelo en el SQL y explícalo.
- Incluye bloque de rollback comentado y los SELECT de verificación (columnas, RLS, policies).
- Ojo: el insert del popup NO debe pedir `.select()` de vuelta (anon no puede leer).

## Tests

- Unit: validación de nombre/teléfono/casilla del popup; schema de checkout exige acepto_terminos.
- E2E (sin escribir en prod): /terminos, /privacidad, /cambios-y-devoluciones cargan con h1 y sin scroll horizontal (390 y 1440); footer tiene los 3 links; checkout no deja enviar sin la casilla; el popup no muestra ningún cupón.
- Verify + E2E completa UNA vez al final.

## Reporte

- SQL 011 completo para revisión (antes de ejecutar).
- Después de aprobado: salidas de verificación, capturas de las 3 páginas, checkout con casilla, popup y /admin/suscriptores (390 y 1440).
- Declara archivos descartados y cualquier dato escrito en la base.

---

# TEXTOS (copiar tal cual)

## T1 — Términos y condiciones

# Términos y condiciones

Última actualización: 15 de octubre de 2026

### 1. Quiénes somos

Florería Miraflores es una tienda virtual operada por **Grupo Flowerstore SAC**, RUC **20613383159**, con atención exclusivamente en línea en Lima, Perú. No contamos con tienda física.
Contacto: pedidos@floreriamiraflores.com · WhatsApp +51 999 600 482 · Atención de 9:00 a. m. a 9:00 p. m., todos los días.

### 2. Aceptación

Al realizar un pedido en florer-a-miraflores.vercel.app aceptas estos Términos y condiciones y nuestra Política de cambios y devoluciones. Te pedimos marcarlo expresamente antes de confirmar tu compra.

### 3. Productos

Nuestros arreglos se elaboran con flores naturales y frescas. Por su naturaleza, cada arreglo puede presentar pequeñas variaciones de color, tamaño, forma o apertura respecto de las fotografías, que son referenciales.
Si alguna flor o insumo no está disponible por temporada, podremos reemplazarlo por otro de igual o mayor valor y de estilo similar, manteniendo el diseño general del arreglo.

### 4. Precios

Los precios se muestran en soles (S/) e incluyen IGV. El costo de delivery se muestra por separado antes de confirmar el pedido. Los precios y promociones pueden cambiar sin previo aviso, pero se respeta el precio vigente al momento de tu compra.

### 5. Pedidos y pagos

Aceptamos Visa, Mastercard, American Express, Yape y Plin. El pedido se considera confirmado cuando el pago ha sido verificado. Si no podemos atender tu pedido, te contactaremos para coordinar una alternativa o devolverte el importe pagado.

### 6. Entregas

- Hacemos delivery en Lima y Callao, en los distritos indicados en la web.
- Entrega el mismo día para pedidos confirmados antes de las 5:00 p. m., sujeto a disponibilidad.
- Es responsabilidad del cliente ingresar correctamente la dirección, la referencia y los datos de quien recibe.
- Si la dirección es incorrecta o nadie recibe el pedido, se reprogramará la entrega y el cliente deberá pagar un nuevo delivery. En estos casos no corresponde reembolso.

### 7. Cancelaciones

Puedes cancelar tu pedido hasta 24 horas antes de la fecha de entrega, escribiéndonos por WhatsApp o al correo de contacto. Pasado ese plazo, el arreglo ya está en preparación y no es posible cancelarlo.

### 8. Cambios, reclamos y devoluciones

Se rigen por nuestra Política de cambios y devoluciones. Además, ponemos a tu disposición nuestro Libro de Reclamaciones virtual, conforme a la normativa vigente.

### 9. Datos personales

El tratamiento de tus datos se rige por nuestra Política de privacidad.

### 10. Ley aplicable

Estos términos se rigen por las leyes de la República del Perú, incluido el Código de Protección y Defensa del Consumidor (Ley N.° 29571).

---

## T2 — Política de privacidad

# Política de privacidad

Última actualización: 15 de octubre de 2026

### 1. Responsable

El responsable del tratamiento de tus datos personales es **Grupo Flowerstore SAC**, RUC **20613383159**, que opera la tienda virtual Florería Miraflores (Lima, Perú).
Contacto para temas de datos personales: pedidos@floreriamiraflores.com

Esta política cumple con la Ley N.° 29733, Ley de Protección de Datos Personales, y su Reglamento.

### 2. Qué datos recopilamos

- **Al comprar:** nombre, teléfono, correo, dirección y referencia de entrega, nombre y teléfono de quien recibe, y el mensaje de la tarjeta.
- **Al suscribirte al Club:** nombre y número de WhatsApp.
- **Al usar el Libro de Reclamaciones:** los datos que indica el formulario.
  No recopilamos ni almacenamos los datos completos de tu tarjeta: los pagos con tarjeta los procesa la pasarela de pago.

### 3. Para qué los usamos

- **Gestionar tu pedido:** confirmarlo, prepararlo, entregarlo y comunicarnos contigo o con quien recibe. Sin estos datos no podemos atender tu compra.
- **Atender reclamos y cumplir obligaciones legales y tributarias.**
- **Enviarte promociones y novedades por WhatsApp:** solo si lo aceptas expresamente marcando la casilla del Club. Es opcional y puedes darte de baja cuando quieras.

### 4. Con quién los compartimos

No vendemos tus datos. Solo los compartimos con proveedores que nos ayudan a operar la tienda: servicios de alojamiento web y base de datos, la pasarela de pago y el personal de reparto. Algunos de estos proveedores tecnológicos tienen sus servidores fuera del Perú; al usar nuestra web y aceptar esta política, consientes esa transferencia, que se realiza con proveedores que aplican medidas de seguridad adecuadas.

### 5. Cuánto tiempo los guardamos

- Datos de pedidos: el tiempo necesario para atenderlos y el que exijan las normas tributarias y de protección al consumidor.
- Datos del Club: hasta que te des de baja.

### 6. Tus derechos

Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (ARCO), así como revocar tu consentimiento, escribiendo a pedidos@floreriamiraflores.com con tu nombre y el derecho que deseas ejercer. Para dejar de recibir promociones basta con escribirnos "BAJA" por WhatsApp.
Si consideras que no hemos atendido tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.

### 7. Seguridad

Aplicamos medidas técnicas y organizativas razonables para proteger tus datos contra pérdida, acceso no autorizado o uso indebido.

### 8. Almacenamiento en tu navegador

Usamos el almacenamiento local de tu navegador solo para recordar tu carrito y si ya viste o completaste el formulario del Club. No usamos cookies publicitarias de terceros.

### 9. Cambios a esta política

Podemos actualizar esta política. La versión vigente siempre estará publicada en esta página con su fecha de actualización.

---

## T3 — Política de cambios y devoluciones

# Política de cambios y devoluciones

Última actualización: 15 de octubre de 2026

Nuestros productos son flores naturales y perecibles. Por eso aplicamos estas condiciones, que aceptas al realizar tu compra.

### 1. Producto dañado o diferente

Si tu arreglo llega dañado o es distinto al que compraste, debes avisarnos **dentro de las 2 horas siguientes a la entrega**, por WhatsApp (+51 999 600 482), enviando **foto o video del arreglo tal como llegó**. Pasado ese plazo o sin esa evidencia, no podremos atender el reclamo como producto dañado.

### 2. Variaciones naturales

Las flores son naturales: pueden presentar pequeñas variaciones de color, tamaño, forma o apertura respecto de las fotos, que son referenciales. Si una flor no está disponible por temporada, la reemplazamos por otra de igual o mayor valor. Estas variaciones no se consideran un producto diferente.

### 3. Cómo lo solucionamos

Si tu reclamo procede, **primero reponemos o reenviamos el arreglo**. El reembolso solo procede si no es posible reponerlo.

### 4. Sin devoluciones por arrepentimiento

Por tratarse de productos perecibles elaborados a pedido, no aceptamos devoluciones por cambio de opinión.

### 5. Dirección incorrecta o nadie recibe

Si la dirección está mal o nadie recibe el pedido, reprogramamos la entrega y el cliente paga un nuevo delivery. En estos casos no corresponde reembolso.

### 6. Cancelaciones

Puedes cancelar hasta 24 horas antes de la fecha de entrega. Después, el arreglo ya está en preparación y no puede cancelarse.

### 7. Libro de Reclamaciones

Esta política no limita tu derecho a presentar un reclamo o queja en nuestro Libro de Reclamaciones virtual, que responderemos dentro del plazo legal.
