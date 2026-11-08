---
name: qa-stress-testing
description: Guía y protocolos para ejecutar pruebas de carga, concurrencia y estrés en Florería Miraflores (k6, picos de San Valentín y Día de la Madre, saturación de Supabase y Edge CDN).
---

# Skill: Pruebas de Carga y Resistencia (Stress Testing)

## Propósito
Garantizar que la plataforma resista picos masivos de tráfico concurrentes durante campañas de alta demanda floral (Día de la Madre, San Valentín, Navidad).

## Objetivos de Desempeño (SLAs)
- **Usuarios Concurrentes:** 200 a 500 VUs (Virtual Users) navegando catálogo y fichas de producto.
- **P95 Latencia:** < 300 ms en páginas cacheadas por CDN Edge.
- **Error Rate (5xx):** 0.00%.
- **Checkout Concurrente:** 30 pedidos/minuto sin deadlocks en PostgreSQL.

## Protocolo de Ejecución
1. **Script de Carga k6 (`scripts/k6-load-test.js`)**:
   - Escenario 1: Navegación de catálogo, filtros y paginación.
   - Escenario 2: Visita a fichas de productos con miniaturas.
   - Escenario 3: Checkout con inserción controlada de pedidos de prueba.
2. **Monitoreo durante la prueba**:
   - Pool de conexiones PgBouncer en Supabase.
   - CPU y memoria del backend/edge worker.
   - Hit ratio en Vercel CDN Cache.
