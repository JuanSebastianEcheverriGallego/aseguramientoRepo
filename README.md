# TaskApp – Caso práctico final de Aseguramiento de la Calidad

Aplicación web de gestión de tareas (Node.js + Express + SQLite) usada como sistema bajo prueba.
El informe está en [`docs/informe.pdf`](docs/informe.pdf) (fuente: `docs/informe.html`).

## Ejecutar
```bash
npm install
npm start                 # http://localhost:3000  (requiere Node.js >= 22.13)
```

## Pruebas
```bash
npm test                  # unitarias + integración (AT01–AT16)
npm run test:coverage     # igual + coverage/lcov.info para SonarQube
npm run perf              # prueba de carga (servidor arriba)
node tests/ui-evidencias.js   # E2E con Playwright sobre Microsoft Edge (servidor arriba)
bash tests/manual-run.sh      # casos manuales MT01–MT12 con curl (servidor arriba, BD vacía)
```

## Seguridad
```bash
# SonarQube
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
docker run --rm -e SONAR_HOST_URL=http://host.docker.internal:9000 -e SONAR_TOKEN=<token> \
  -v "$PWD:/usr/src" sonarsource/sonar-scanner-cli
# OWASP ZAP baseline
docker run --rm -v "$PWD/evidencias:/zap/wrk:rw" zaproxy/zap-stable \
  zap-baseline.py -t http://host.docker.internal:3000 -r zap.html
```

## Estructura
- `src/`, `public/` – código del sistema
- `tests/`, `perf/` – pruebas automatizadas y scripts
- `evidencias/` – logs, reportes ZAP/Sonar y capturas
- `docs/` – informe y registro de defectos
- `.github/workflows/ci.yml` – pipeline CI
