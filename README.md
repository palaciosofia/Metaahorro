# MetaAhorro

API para manejar metas de ahorro: creas una meta (por ejemplo "viaje a Cartagena, $2.000.000"), registras depósitos o retiros y ves cuánto llevas. Incluye un frontend en React.

**Backend:** Node.js, TypeScript, AWS Lambda + API Gateway, PostgreSQL, Serverless Framework
**Frontend:** React, TypeScript, Vite

## Decisiones técnicas

- Los montos se guardan como enteros (`BIGINT`) para evitar errores de redondeo.
- Cada movimiento y la actualización del saldo van en la misma transacción.
- La meta se bloquea con `SELECT ... FOR UPDATE`, así dos retiros simultáneos no dejan el saldo negativo.
- Depósitos y retiros usan la cabecera `Idempotency-Key`: si la misma petición llega dos veces, no se duplica.
- Código por capas (handlers, services, repositories). Los tests usan repositorios en memoria, sin base de datos.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | crear cuenta |
| POST | `/auth/login` | iniciar sesión |
| GET / POST | `/goals` | listar o crear metas |
| GET / PATCH / DELETE | `/goals/{id}` | ver, editar o eliminar una meta |
| GET / POST | `/goals/{id}/movements` | historial, depositar o retirar |

Todo excepto `/auth` necesita `Authorization: Bearer <token>`.

## Correrlo local

Necesitas Node 20+ y Docker.

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run dev                  # API en http://localhost:3000
```

En otra terminal:

```bash
cd frontend
npm install
npm run dev                  # app en http://localhost:5173
```

## Tests

```bash
npm test           # 32 pruebas unitarias
npm run test:e2e   # pruebas contra la API corriendo
```

El e2e incluye un caso de concurrencia: 5 retiros al mismo tiempo sobre un saldo que solo alcanza para 2; solo pasan 2. Las pruebas corren en GitHub Actions en cada push.

## Despliegue

`npm run deploy` publica la API en AWS con Serverless Framework.
