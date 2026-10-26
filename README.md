# MetaAhorro

API para manejar metas de ahorro: creas una meta (por ejemplo "viaje a Cartagena, $2.000.000"), le haces depósitos o retiros y ves cuánto llevas.

Está hecha en Node.js con TypeScript, corre en AWS Lambda + API Gateway y usa PostgreSQL. La infraestructura está definida en `serverless.yml`.

## Cómo está organizado

```
src/
  modules/
    users/       registro, login, JWT
    goals/       metas y cálculo del progreso
    movements/   depósitos y retiros
  shared/        errores, validación, respuestas http
  db/            conexión y transacciones
db/schema.sql    tablas
tests/           pruebas unitarias
```

Cada módulo tiene sus handlers (reciben la request), un service (reglas de negocio) y un repository (SQL). Los services trabajan con interfaces, así que en los tests uso repositorios en memoria y no hace falta base de datos.

Algunas decisiones:

- Los montos se guardan como enteros (`BIGINT`) para no tener problemas de redondeo con decimales.
- Un movimiento y la actualización del saldo van en la misma transacción.
- Para depositar o retirar hay que mandar la cabecera `Idempotency-Key`. Si la misma request llega dos veces (doble clic, reintento de red), el movimiento no se duplica.
- Al registrar un movimiento se bloquea la meta con `SELECT ... FOR UPDATE`, así dos retiros simultáneos no pueden dejar el saldo negativo.
- Un usuario solo puede ver sus propias metas; si pide la de otro, recibe 404.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | crear cuenta |
| POST | `/auth/login` | iniciar sesión, devuelve el token |
| GET | `/goals` | listar metas |
| POST | `/goals` | crear meta |
| GET | `/goals/{id}` | ver una meta |
| PATCH | `/goals/{id}` | editar nombre o monto objetivo |
| DELETE | `/goals/{id}` | eliminar (solo si el saldo está en 0) |
| POST | `/goals/{id}/movements` | depositar o retirar |
| GET | `/goals/{id}/movements` | historial |

Todo excepto `/auth` necesita `Authorization: Bearer <token>`.

Ejemplo de depósito:

```bash
curl -X POST http://localhost:3000/goals/$GOAL_ID/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: deposito-0001" \
  -d '{"type": "DEPOSIT", "amount": 500000}'
```

En `requests.http` está el flujo completo para probarlo con la extensión REST Client de VS Code.

## Correrlo local

Necesitas Node 20+ y Docker (o una base de datos en [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run dev
```

La API queda en `http://localhost:3000`.

## Tests

```bash
npm test           # pruebas unitarias
npm run test:e2e   # prueba contra la API corriendo
```

El test e2e incluye un caso de concurrencia: manda 5 retiros al mismo tiempo sobre un saldo que solo alcanza para 2 y revisa que solo pasen 2.

Las pruebas también corren en GitHub Actions en cada push.

## Desplegar en AWS

Antes de nada, crear una alerta de presupuesto en AWS (Billing → Budgets).

1. Crear la base de datos en Neon, poner la URL en `.env` con `DATABASE_SSL=true` y correr `npm run db:migrate`.
2. Configurar las credenciales de AWS:
   ```bash
   npx serverless config credentials --provider aws --key TU_KEY --secret TU_SECRET
   ```
3. `npm run deploy`. Al final muestra la URL de la API.
4. Para borrar todo: `npm run remove`.

Uso Serverless Framework v3 porque no pide crear cuenta en su plataforma.

## Pendientes

- Pasar los secretos a SSM Parameter Store
- Paginación en el historial
- Documentación con OpenAPI
