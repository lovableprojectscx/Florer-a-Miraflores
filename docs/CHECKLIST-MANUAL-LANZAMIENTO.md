# Checklist Manual Pre-Lanzamiento — Florería Miraflores

Este documento detalla los pasos manuales y validaciones funcionales que el equipo de operaciones y Jack deben realizar antes y durante el lanzamiento público oficial a producción.

---

## 1. Supabase y Seguridad

- [ ] **Desactivar "Allow new users to sign up"**: En el panel de Supabase (_Authentication > Providers > Email_), confirmar que la opción está deshabilitada para evitar que extraños creen cuentas.
- [ ] **Eliminar usuario temporal de pruebas**: En _Authentication > Users_, eliminar definitivamente la cuenta `test_admin_temp@floreriamiraflores.com`.
- [ ] **Verificar Admin Único**: Confirmar que en la tabla `public.admins` únicamente figure `pedidos@floreriamiraflores.com`.
- [ ] **Revisión de RLS**: Confirmar que ninguna tabla del catálogo permite escrituras públicas o de usuarios no administradores (validado por tests automatizados RLS en CI/local).

---

## 2. Catálogo y Datos de Productos

- [ ] **Asignación de Nacimientos Niño / Niña**: En el panel admin (`/admin/productos`), asignar productos reales a las subcategorías de _Nacimientos_ (_Niño_ / _Niña_) para que dejen de mostrar el estado "Próximamente" si se desea habilitarlas en el catálogo activo.
- [ ] **Confirmación de Tabla Tulipanes**: Validar los 13 productos de la tabla de reasignación (`docs/sql/004-tulipanes-reasignacion.sql`) antes de correr su migración en caso de requerir reajuste de catálogo.
- [ ] **Imágenes y Banners**: Confirmar que los banners de campaña actuales en `/admin/banners` reflejen los precios y promociones de la temporada.

---

## 3. Dispositivos Móviles y Experiencia de Usuario

- [ ] **iPhone (iOS Safari)**: Probar navegación en Safari iOS real (Home, Catálogo, Ficha de producto, Drawer de carrito). Confirmar que no hay desbordamiento horizontal y que la barra de direcciones no bloquea botones.
- [ ] **Android (Chrome)**: Probar navegación en Chrome móvil. Confirmar fluidez de scroll, apertura del menú hamburguesa y botones sticky.
- [ ] **Botón Flotante de WhatsApp**: Pulsar el botón flotante en la esquina inferior derecha y comprobar que abre la app de WhatsApp con el número `+51 999 600 482`.

---

## 4. Checkout y Procesamiento de Pedidos

- [ ] **Validación de Distritos y Delivery**: Seleccionar distritos como Miraflores, San Isidro, Surco, Barranco y otros; comprobar que el recargo de delivery se calcula correctamente en el resumen.
- [ ] **Restricción Horaria (20:00)**: Simular o verificar un pedido después de las 20:00 (hora Lima) y comprobar que el selector de fecha restringe la entrega para el día siguiente como mínimo.
- [ ] **Prueba de Pago / Coordinación**: Realizar un pedido de prueba interno con teléfono propio y verificar que el enlace directo a WhatsApp contiene el número de pedido correlativo `FM-XXXXXX` y los datos del comprador.

---

## 5. Libro de Reclamaciones

- [ ] **Envío de Reclamo de Prueba**: Llenar el formulario en `/libro-de-reclamaciones`. Comprobar que genera el número correlativo anual y permite descargar la hoja en formato imprimible/PDF.
- [ ] **Notificación / Registro**: Confirmar en `/admin/reclamaciones` que el reclamo queda registrado bajo la sesión del administrador.

---

## 6. Despliegue en Hosting y DNS

- [ ] **Push de Git a Repositorio Remoto**: Hacer `git push origin master` una vez que el revisor autorice el despliegue.
- [ ] **Despliegue en Vercel / Cloudflare**: Confirmar build exitoso en la plataforma de alojamiento.
- [ ] **Verificación de Dominio y SSL**: Entrar a `https://floreriamiraflores.com/` y confirmar certificado HTTPS activo y redirección `http -> https`.
- [ ] **Indexación**: Verificar `https://floreriamiraflores.com/robots.txt` y `https://floreriamiraflores.com/sitemap.xml`.
