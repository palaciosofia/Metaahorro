const BASE = process.env.API_URL ?? 'http://localhost:3000';
let failures = 0;

async function call(method, path, { body, token, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

function check(label, condition, detail) {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${condition ? '' : '  -> ' + JSON.stringify(detail)}`);
  if (!condition) failures++;
}

for (let i = 0; i < 60; i++) {
  try { await fetch(BASE + '/goals'); break; } catch { await new Promise((r) => setTimeout(r, 1000)); }
}

const email = `sofia+${Date.now()}@uninorte.edu.co`;
let r = await call('POST', '/auth/register', { body: { email, name: 'Sofía', password: 'clave-segura-123' } });
check('register -> 201 sin hash', r.status === 201 && !('passwordHash' in r.body.user), r);

r = await call('POST', '/auth/register', { body: { email, name: 'Sofía', password: 'clave-segura-123' } });
check('register duplicado -> 409', r.status === 409, r);

r = await call('POST', '/auth/register', { body: { email: 'no-es-correo', name: 'S', password: '123' } });
check('register inválido -> 400 con detalles', r.status === 400 && r.body.error.details.length === 3, r);

r = await call('POST', '/auth/login', { body: { email, password: 'incorrecta' } });
check('login con clave incorrecta -> 401', r.status === 401, r);

r = await call('POST', '/auth/login', { body: { email: email.toUpperCase(), password: 'clave-segura-123' } });
check('login (correo en mayúsculas) -> 200 + token', r.status === 200 && typeof r.body.token === 'string', r);
const token = r.body.token;

r = await call('GET', '/goals');
check('sin token -> 401', r.status === 401, r);

r = await call('GET', '/goals', { token: 'token.falso.x' });
check('token falso -> 401', r.status === 401, r);

r = await call('POST', '/goals', { token, body: { name: 'Viaje a Cartagena', targetAmount: 2000000 } });
check('crear meta -> 201', r.status === 201 && r.body.goal.balance === 0, r);
const goalId = r.body.goal.id;

r = await call('POST', '/goals', { token, body: { name: 'X', targetAmount: 10.5 } });
check('meta con decimales -> 400', r.status === 400, r);

r = await call('GET', '/goals/123', { token });
check('id no UUID -> 400', r.status === 400, r);

r = await call('POST', `/goals/${goalId}/movements`, { token, body: { type: 'DEPOSIT', amount: 500000 } });
check('movimiento sin Idempotency-Key -> 400', r.status === 400, r);

r = await call('POST', `/goals/${goalId}/movements`, {
  token, body: { type: 'DEPOSIT', amount: 500000 }, headers: { 'Idempotency-Key': 'dep-0001-abc' },
});
check('depósito -> 201, 25%', r.status === 201 && r.body.goal.balance === 500000 && r.body.goal.progress.percentage === 25, r);

r = await call('POST', `/goals/${goalId}/movements`, {
  token, body: { type: 'DEPOSIT', amount: 500000 }, headers: { 'Idempotency-Key': 'dep-0001-abc' },
});
check('reintento idempotente -> 200, saldo sin duplicar', r.status === 200 && r.body.replayed && r.body.goal.balance === 500000, r);

r = await call('POST', `/goals/${goalId}/movements`, {
  token, body: { type: 'DEPOSIT', amount: 1 }, headers: { 'Idempotency-Key': 'dep-0001-abc' },
});
check('misma key, otros datos -> 409', r.status === 409, r);

r = await call('POST', `/goals/${goalId}/movements`, {
  token, body: { type: 'WITHDRAWAL', amount: 900000 }, headers: { 'Idempotency-Key': 'ret-0001-abc' },
});
check('retiro mayor al saldo -> 422', r.status === 422, r);

// 5 retiros a la vez con saldo para 2
const results = await Promise.all(
  [1, 2, 3, 4, 5].map((n) =>
    call('POST', `/goals/${goalId}/movements`, {
      token, body: { type: 'WITHDRAWAL', amount: 200000 }, headers: { 'Idempotency-Key': `conc-000${n}-xyz` },
    }),
  ),
);
const ok = results.filter((x) => x.status === 201).length;
const rejected = results.filter((x) => x.status === 422).length;
check(`retiros concurrentes: 2 aceptados / 3 rechazados (got ${ok}/${rejected})`, ok === 2 && rejected === 3, results.map((x) => x.status));

r = await call('GET', `/goals/${goalId}`, { token });
check('saldo final = 100.000 (nunca negativo)', r.status === 200 && r.body.goal.balance === 100000, r);

r = await call('GET', `/goals/${goalId}/movements`, { token });
check('historial: 3 movimientos', r.status === 200 && r.body.movements.length === 3, r.body?.movements?.length);

r = await call('PATCH', `/goals/${goalId}`, { token, body: { name: 'Viaje a San Andrés' } });
check('PATCH parcial -> 200, objetivo intacto', r.status === 200 && r.body.goal.name === 'Viaje a San Andrés' && r.body.goal.targetAmount === 2000000, r);

r = await call('DELETE', `/goals/${goalId}`, { token });
check('eliminar meta con saldo -> 422', r.status === 422, r);

const other = `otro+${Date.now()}@x.com`;
await call('POST', '/auth/register', { body: { email: other, name: 'Otro', password: 'clave-segura-123' } });
const otherToken = (await call('POST', '/auth/login', { body: { email: other, password: 'clave-segura-123' } })).body.token;
r = await call('GET', `/goals/${goalId}`, { token: otherToken });
check('otro usuario -> 404', r.status === 404, r);

r = await call('POST', `/goals/${goalId}/movements`, {
  token, body: { type: 'WITHDRAWAL', amount: 100000 }, headers: { 'Idempotency-Key': 'ret-final-abc' },
});
r = await call('DELETE', `/goals/${goalId}`, { token });
check('eliminar meta sin saldo -> 204', r.status === 204, r);

r = await call('GET', '/goals', { token });
check('lista vacía tras eliminar', r.status === 200 && r.body.goals.length === 0, r);

console.log(failures === 0 ? '\nALL E2E CHECKS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures ? 1 : 0);
