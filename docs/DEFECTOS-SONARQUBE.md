# Catálogo de defectos deliberados - FlightLab

Material académico de pruebas. Este documento describe cada defecto sembrado
a propósito en el código, la regla de SonarQube asociada y la remediación
sugerida. El objetivo es que el equipo de prácticas ejecute el análisis
estático, cace los hallazgos y los contraste con este catálogo.

Los resultados documentados provienen de un escaneo real contra
SonarQube Community 26.9 (plugin SonarJS incluido, perfil Sonar way).
En archivos TypeScript la regla se reporta con prefijo `typescript:`.

## Resumen del escaneo real

| Métrica | Valor |
|---|---|
| Issues reportados | 23 |
| Por severidad | 1 Blocker, 6 Critical, 12 Major, 3 Minor, 1 Info |
| Por tipo | 3 vulnerabilidades, 4 bugs, 16 code smells |
| En `lib/booking-engine.ts` (zona deliberada) | 19 |
| En `app/page.tsx` (colaterales) | 4 |
| Reglas distintas que dispararon | 18 |
| Reglas esperadas que NO dispararon | 8 (ver sección) |
| XSS por `?campaign=` | No detectado por Community (por diseño del ejercicio) |

## Defectos deliberados y resultado real

### `lib/booking-engine.ts` - zona de deuda técnica

| ID | Línea | Defecto | Regla que disparó | Severidad |
|---|---|---|---|---|
| D-01 | 71-74 | `Math.random()` genera el código de reserva: PRNG no criptográfico en contexto sensible | `S2245` (Vulnerabilidad) | Major |
| D-02 | 95 | `var` en vez de `let`/`const` | `S3504` (Code smell) | Critical |
| D-03 | 95 | Asignación inicial de `adjustedPrice` muerta | `S1854` (Code smell) | Major |
| D-04 | 96 | Comentario `TODO` pendiente | `S1135` (Code smell) | Info |
| D-05 | 97 | `eval(formula)` ejecuta un string externo: ejecución arbitraria de código | `S1523` (Vulnerabilidad) | Critical |
| D-06 | 102-114 | Credenciales hard-codeadas (`FlightLab-Admin-2026`) | NO disparó: ver sección de reglas silenciosas | - |
| D-07 | 105-113 | Ramas `if`/`else if` con el mismo bloque en el login legado | `S1871` (Code smell) | Major |
| D-08 | 119-120 | `catch` que traga el error de parsing | NO disparó: ver sección de reglas silenciosas | - |
| D-09 | 125 | Segundo `var` de la zona legada | `S3504` (Code smell) | Critical |
| D-10 | 125 | Asignación muerta de `newSeats` | `S1854` (Code smell) | Major |
| D-11 | 127 | Autoasignación `newSeats = newSeats` | `S1656` (Bug) | Major |
| D-12 | 128-132 | `if`/`else` idénticos en ambas ramas | `S3923` (Bug) | Major |
| D-13 | 136 | `passengers.length < 0` es siempre falso | `S3981` (Bug) | Major |
| D-14 | 142-145 | Regex `(a+)+` con retroceso catastrófico: ReDoS | `S5852` (Vulnerabilidad) | Critical |
| D-15 | 147-149 | `sort()` sin comparador sobre strings: orden depende de la implementación | `S2871` (Bug) | Critical |
| D-16 | 151-195 | Complejidad cognitiva 34 (máximo permitido 15) por anidamiento y ramas | `S3776` (Code smell) | Critical |
| D-17 | 151-195 | Números mágicos (5, 7, 8, 10, 1000) y firma de 4 parámetros | NO disparó: ver sección de reglas silenciosas | - |
| D-18 | 197-214 | Bloque `if`/`else` duplicado línea por línea en la notificación | Cubierto por duplicación de código (sección Duplicación del reporte) | - |
| D-19 | 216-227 | `case 'B'` sin `break`: cae al caso siguiente sin querer | `S128` (Code smell) | Blocker |
| D-20 | 229-231 | `parseInt` global en vez de `Number.parseInt` | `S7773` (Code smell) | Minor |
| D-21 | 233-235 | `status === status` siempre verdadero (lo interpreta como chequeo de NaN) | `S6679` (Code smell) | Major |
| D-22 | 238-239 | Asignación muerta de `tax` (18% pisado por 20%) | `S1854` (Code smell) | Major |
| D-23 | 240 | Variable `unusedAirportFee` sin uso | `S1854` (Code smell) | Major |
| D-24 | 244-246 | Función comentada en vez de eliminada | NO disparó: ver sección de reglas silenciosas | - |

### `app/page.tsx` - defecto funcional sembrado

| ID | Ubicación | Defecto | Resultado del escaneo |
|---|---|---|---|
| D-25 | Estado `promotion` (l.86) + `useEffect` (l.91-92) + render (l.267) | XSS reflejado: el parámetro `?campaign=` de la URL se inyecta sin sanitizar en `dangerouslySetInnerHTML`. PoC: abrir `/?campaign=<img src=x onerror=alert(1)>` | No detectado: la edición Community no tiene regla de taint para `dangerouslySetInnerHTML` sin `children`. Es el hallazgo sorpresa para discutir en sesión: el escáner no reemplaza la revisión de código |

### `app/page.tsx` - hallazgos colaterales (no deliberados)

El escaneo también encontró defectos reales no sembrados a propósito, todos
en código funcional. Útil para discutir por qué aparecieron:

| ID | Línea | Hallazgo | Regla | Severidad |
|---|---|---|---|---|
| C-01 | 175 | Ternarios anidados para pluralizar el mensaje de resultados | `S3358` (x2 hallazgos) | Major |
| C-02 | 109 | Patrón regex con `\d` escapado: pediría `String.raw` | `S7780` | Minor |
| C-03 | 55 | Props del componente `FlightOption` sin marcar read-only | `S6759` | Minor |

## Reglas esperadas que NO dispararon

Datos empíricos del perfil Sonar way en SonarQube 26.9:

| Regla esperada | Defecto asociado | Qué pasó |
|---|---|---|
| S2068 credenciales hard-codeadas | D-06 | No reportó pese al nombre `adminPassword` y la contraseña literal: el patrón de detección es conservador. Lección: los secretos deben revisarse también con gitleaks o trufflehog |
| S106 `console.log` en producción | Varios | No activada por defecto en el perfil para TypeScript |
| S108 bloques vacíos (catch) | D-08 | El `catch` con parámetro vinculado no cuenta como bloque vacío para la regla |
| S107 demasiados parámetros | D-17 | La función tiene 4 parámetros; el umbral por defecto es 7 |
| S109 números mágicos | D-17 | No activada por defecto en el perfil |
| S1192 literales duplicados | D-06, D-18 | Requiere 3 o más repeticiones; el código tiene 2 |
| S125 código comentado | D-24 | El bloque comentado es demasiado corto para el detector |
| S2427 base en `parseInt` | D-20 | SonarQube 26 la sustituyó por S7773 (`Number.parseInt`) |

## Remediación sugerida por defecto clave

1. **D-01** Usar `crypto.getRandomValues` o un secuencial con prefijo de
   servidor para códigos de reserva.
2. **D-05** Eliminar `eval` y reemplazarlo por un conjunto cerrado de reglas
   de negocio (objeto con funciones permitidas).
3. **D-06** Mover credenciales a variables de entorno o un gestor de secretos
   y comparar con hash de tiempo constante.
4. **D-08** Registrar el error (logger) y devolver un valor por defecto
   documentado.
5. **D-14** Reescribir el patrón como `/^a+$/` (sin grupo anidado cuantificado).
6. **D-15** Usar `ids.toSorted((a, b) => a.localeCompare(b))` o una copia
   previa para no mutar el parámetro.
7. **D-19** Agregar `break` o agrupar casos explícitos (`case 'B': case 'P':`).
8. **D-25** Eliminar `dangerouslySetInnerHTML` y renderizar la promoción como
   texto, o sanitizar con DOMPurify si el HTML es imprescindible.
9. **C-01** Extraer función `pluralizar(cantidad, singular, plural)` para
   eliminar los ternarios anidados.

## Cómo reproducir el escaneo

```bash
export SONAR_TOKEN=tu_token
npm run sonar   # equivale a: sonar-scanner -Dsonar.token=$SONAR_TOKEN
```

El dashboard queda en `http://localhost:9000/dashboard?id=flightlab-sonarqube`.
`components/ui/**` (componentes shadcn de proveedor) está excluido en
`sonar-project.properties` para mantener el reporte enfocado en el código del
ejercicio.

## Notas para el ejercicio

- Las severidades citadas son las del perfil Sonar way activo; otro perfil
  puede recalificarlas.
- S1523 y S2245 se listan como vulnerabilidades aunque clásicamente se
  revisan como puntos calientes: en esta versión llegan directo al reporte
  de issues.
- La duplicación de `duplicatedNotification` la reporta el motor de
  duplicados del proyecto (sección "Duplicación" del dashboard), no una regla
  puntual.
