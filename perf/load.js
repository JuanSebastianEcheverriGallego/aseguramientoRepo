// Prueba basica de carga: 50 conexiones concurrentes durante 15 s contra GET /api/tasks (autenticado)
// Criterio RNF01: latencia p95 < 500 ms y 0 errores. Requiere el servidor en http://localhost:3000
const autocannon = require('autocannon');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function getToken() {
  const user = { username: 'perf' + Date.now().toString().slice(-6), password: 'Clave1234' };
  const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) };
  await fetch(`${BASE}/api/register`, opts);
  const r = await fetch(`${BASE}/api/login`, opts);
  const { token } = await r.json();
  for (let i = 1; i <= 20; i++) {
    await fetch(`${BASE}/api/tasks`, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: `Tarea ${i}`, priority: (i % 5) + 1 }) });
  }
  return token;
}

(async () => {
  const token = await getToken();
  const result = await autocannon({
    url: `${BASE}/api/tasks`,
    connections: 50,
    duration: 15,
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(autocannon.printResult(result));
  const p95 = result.latency.p97_5 ?? result.latency.p99; // autocannon reporta p97.5 (cota superior de p95)
  const errors = result.errors + result.non2xx;
  console.log(`Peticiones totales: ${result.requests.total} | Req/s promedio: ${result.requests.average}`);
  console.log(`Latencia promedio: ${result.latency.average} ms | p97.5: ${p95} ms | max: ${result.latency.max} ms | errores/no-2xx: ${errors}`);
  const ok = p95 < 500 && errors === 0;
  console.log(`RNF01 (p95 < 500 ms y 0 errores): ${ok ? 'CUMPLE' : 'NO CUMPLE'}`);
  process.exit(ok ? 0 : 1);
})();
