# Registro de defectos – TaskApp

Estados: Nuevo → Asignado → En corrección → Corregido → Verificado → Cerrado (o Diferido / Abierto).
Severidad: Crítico, Alto, Medio, Bajo. Prioridad: Alta, Media, Baja.

| ID | Descripción | Severidad | Prioridad | Estado | Detectado por | Evidencia | Commit corrección |
|----|-------------|-----------|-----------|--------|---------------|-----------|-------------------|
| DEF-01 | Se expone `X-Powered-By: Express` y faltan cabeceras de seguridad (CSP, X-Frame-Options, nosniff, Permissions-Policy, COOP/COEP) | Medio | Alta | Cerrado | AT14, ZAP v1 | `evidencias/01-pruebas-automatizadas-v1-fallo.log`, `evidencias/zap-v1.html` | 3976c92 |
| DEF-02 | JSON malformado devuelve stack trace con rutas internas del servidor | Alto | Alta | Cerrado | MT10 (exploratoria) | `evidencias/02-casos-manuales-v1.log` | 3976c92 |
| DEF-03 | Login sin límite de intentos (fuerza bruta) | Alto | Alta | Cerrado | MT11 (exploratoria) | `evidencias/02-casos-manuales-v1.log` | 3976c92 |
| DEF-04 | Tokens de sesión sin expiración y guardados en memoria | Medio | Media | Diferido | Revisión de código | `src/app.js` (Map `sessions`) | — |
| DEF-05 | Campos título/prioridad sin etiqueta accesible (WCAG 2 A) | Bajo | Media | Cerrado | SonarQube v1 | `evidencias/sonar-issues-v1.png` | 3976c92 |
| DEF-06 | 404 por defecto de Express reemplaza la CSP; falta Cross-Origin-Resource-Policy | Bajo | Media | Cerrado | ZAP v2 (re-test DEF-01) | `evidencias/zap-v2.html` | 3976c92 |
| DEF-07 | El selector de prioridad no vuelve a "3 - Media" después de agregar una tarea | Bajo | Baja | Abierto | AT17 (E2E) | `evidencias/ui-03-tareas.png` | — |
| DEF-08 | autocannon 8 (devDependency) arrastra `uuid` vulnerable (GHSA-w5hq-g745-h8pq) | Bajo | Media | Cerrado | npm audit | `evidencias/17-npm-audit.log` | (este commit) |

## Ciclo de vida DEF-01
1. **Nuevo** – AT14 falla en f609bdb (`'Express' !== null`); ZAP v1 reporta 6 tipos de alerta relacionadas.
2. **Asignado** – Severidad Medio / Prioridad Alta.
3. **Corregido** – middleware de cabeceras + `app.disable('x-powered-by')`.
4. **Verificado parcial** – AT14 pasa; ZAP v2 baja de 12 a 4 alertas pero revela DEF-06.
5. **Cerrado** – tras DEF-06, ZAP final sin alertas Medias/Bajas (`evidencias/zap-final.html`).
