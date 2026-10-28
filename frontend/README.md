# MetaAhorro – frontend

Interfaz web de MetaAhorro hecha con React, TypeScript y Vite. Solo usa lo que expone la API del backend: registro, login, metas (crear, editar, eliminar) y depósitos o retiros.

## Correrlo

Primero tiene que estar corriendo la API (`npm run dev` en la carpeta principal, puerto 3000).

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173.

Las peticiones van a `/api` y Vite las reenvía a la API (ver `vite.config.ts`). Lo hice así porque la configuración de CORS del backend no permite la cabecera `Idempotency-Key` y el navegador bloquearía los depósitos y retiros. Para probar contra la API de AWS en vez de la local, copia `.env.example` a `.env` y cambia `API_TARGET`.

## Pantallas

- **Resumen:** saldo total, depósitos y retiros del mes, y la evolución del saldo en los últimos 6 meses.
- **Movimientos:** todos los movimientos del mes, se pueden ver por meta.
- **Metas:** lista, detalle, crear, editar, eliminar, depositar y retirar.
- **Crecimiento:** cuánto creció el ahorro en el periodo y mes a mes.

Las cifras por mes no vienen de un endpoint: se calculan en el navegador con el saldo actual y el historial de movimientos de cada meta. La API devuelve los últimos 100 movimientos por meta, así que si una meta tiene más, los meses más viejos pueden salir incompletos (la app lo avisa).

Cada depósito o retiro genera su propia `Idempotency-Key` al abrir el formulario. Si la petición falla y se vuelve a enviar, usa la misma clave y el backend no lo registra dos veces.

## Estructura

```
src/
  api/          cliente http y llamadas a cada endpoint
  auth/         sesión (token en localStorage)
  lib/          formato de pesos y fechas, cálculos por mes, datos compartidos
  components/   layout, gráficas, diálogos
  pages/        una por pantalla
```
