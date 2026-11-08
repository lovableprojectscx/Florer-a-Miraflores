---
name: qa-security-rls
description: Protocolo de auditoría de seguridad, políticas Row Level Security (RLS) en PostgreSQL/Supabase, anti-tampering de precios en checkout y prevención de spam.
---

# Skill: Seguridad, RLS y Anti-Tampering

## Propósito
Proteger la integridad de la base de datos, evitar alteraciones maliciosas de precios durante el checkout y asegurar la privacidad de los pedidos de los clientes.

## Reglas Críticas de Seguridad
1. **Row Level Security (RLS) en SQL y Storage**:
   - Clave anónima (`anon`) NO tiene permisos de `SELECT` sobre `pedidos`, `reclamaciones` ni `admins`.
   - Clave anónima (`anon`) NO puede hacer `INSERT`, `UPDATE` ni `DELETE` en tablas de catálogo (`productos`, `categorias`, `banners`, `config`, `recuerdos`, `testimonios`) ni en buckets de Supabase Storage (`productos`, `banners`, `categorias`).
   - Los 16 tests automatizados en `tests/rls/rls.test.ts` deben pasar al 100%.
2. **Anti-Tampering de Precios a Nivel Motor PostgreSQL**:
   - Trigger `trg_pedidos_zz_integridad_precios` (`BEFORE INSERT ON public.pedidos`, SQL 016) recalcula obligatoriamente `subtotal` desde `public.productos`, `delivery` desde `public.distritos`, `total`, limpia `izi_transaction_id` y fuerza `estado = 'pendiente'`.
3. **Control de Acceso Admin & Pasarela Izipay**:
   - `public.is_admin()` opera como `SECURITY INVOKER` con política de lectura propia en `public.admins`.
   - Para Izipay: `formToken` y validación del Webhook IPN (`HMAC-SHA256`) deben ejecutarse exclusivamente en servidor.
