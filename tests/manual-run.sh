#!/usr/bin/env bash
# Ejecucion de los casos de prueba manuales (MT01-MT12) contra el servidor en http://localhost:3000
B=${BASE_URL:-http://localhost:3000}
TOKEN=""
run(){ echo "\$ curl -X $1 $2 ${3:+-d '$3'}"; curl -s -i -X "$1" "$B$2" -H 'Content-Type: application/json' ${TOKEN:+-H "Authorization: Bearer $TOKEN"} ${3:+-d "$3"} | grep -vi -E '^(date|connection|keep-alive|etag|content-length):'; echo; echo; }
T100=$(printf 'T%.0s' $(seq 1 100)); T101="${T100}T"
echo "=== MT01 Registro valido (usuario 3 chars, clave 8 chars) ==="; run POST /api/register '{"username":"qa1","password":"Clave123"}'
echo "=== MT02 Registro usuario 2 caracteres (limite invalido) ==="; run POST /api/register '{"username":"qa","password":"Clave123"}'
echo "=== MT03 Registro clave 7 caracteres (limite invalido) ==="; run POST /api/register '{"username":"qa2","password":"Clave12"}'
echo "=== MT04 Login con clave incorrecta ==="; run POST /api/login '{"username":"qa1","password":"Incorrecta1"}'
echo "=== MT05 Login correcto ==="; R=$(curl -s -X POST $B/api/login -H 'Content-Type: application/json' -d '{"username":"qa1","password":"Clave123"}'); echo "$R"; TOKEN=$(echo "$R" | sed 's/.*"token":"\([a-f0-9]*\)".*/\1/'); echo
echo "=== MT06 Crear tarea titulo 100 caracteres prioridad 5 ==="; OUT=$(run POST /api/tasks "{\"title\":\"$T100\",\"priority\":5}"); echo "$OUT"
TASK_ID=$(echo "$OUT" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "=== MT07 Crear tarea titulo 101 caracteres ==="; run POST /api/tasks "{\"title\":\"$T101\",\"priority\":3}"
echo "=== MT08 Crear tarea prioridad 0 ==="; run POST /api/tasks '{"title":"Prioridad cero","priority":0}'
echo "=== MT09 Marcar la tarea creada en MT06 (id $TASK_ID) como completada y listar ==="; run PATCH /api/tasks/$TASK_ID '{"done":true}'; run GET /api/tasks
echo "=== MT10 Enviar JSON malformado ==="; run POST /api/tasks '{"title": "sin cerrar'
echo "=== MT11 (exploratoria) 15 intentos de login fallidos seguidos ==="
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code} " -X POST $B/api/login -H 'Content-Type: application/json' -d '{"username":"qa1","password":"adivina'$i'"}'; done
echo; echo "intento 16 con clave correcta:"; curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/api/login -H 'Content-Type: application/json' -d '{"username":"qa1","password":"Clave123"}'
echo "=== MT12 (exploratoria) Logout invalida el token ==="; run POST /api/logout; run GET /api/tasks
