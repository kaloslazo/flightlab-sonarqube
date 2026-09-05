# Catálogo de defectos deliberados - FlightLab

Material académico de pruebas. Este documento describe cada defecto sembrado
a propósito en el código, la regla de SonarQube esperada, su severidad y la
remediación sugerida. El objetivo es que el equipo de prácticas ejecute el
análisis estático, caza los hallazgos y los contraste con este catálogo.

Las reglas se verificaron contra el plugin `sonar-javascript` incluido en el
servidor SonarQube 26.9 (`SonarJS`). En archivos TypeScript la regla se
reporta con prefijo `typescript:`, por ejemplo `typescript:S1523`.

## Resumen

| Métrica | Valor |
|---|---|
| Defectos deliberados | 19 |
| Reglas SonarQube distintas esperadas | 14 |
| Vulnerabilidades (según severidad por defecto) | 4 |
| Bugs | 1 |
| Code smells | 14+ |

## Defectos por archivo

### `lib/booking-engine.ts` - zona de deuda técnica

| ID | Ubicación | Defecto | Regla | Tipo - Severidad |
|---|---|---|---|---|
| D-01 | `generateBookingCode` (l.71-74) | `Math.random()` genera el código de reserva: PRNG no criptográfico y predecible en contexto sensible | S2245 | Vulnerabilidad - Major |
| D-02 | `unsafeAdminAdjustment` (l.94-100) | `eval(formula)` ejecuta código desde un string externo: ejecución arbitraria de código | S1523 | Vulnerabilidad - Critical |
| D-03 | `unsafeAdminAdjustment` (l.98 y resto) | `console.log` para trazas de producción | S106 | Code smell - Major |
| D-04 | `legacyLogin` (l.102-114) | Credenciales hard-codeadas y duplicadas (`FlightLab-Admin-2026`) | S2068 | Vulnerabilidad - Major |
| D-05 | `legacyLogin` (l.105, l.108) | Igualdad débil `==` con coerción implícita | Sin regla directa en SonarJS actual; práctica riesgosa documentada | - |
| D-06 | `restoreBookings` (l.116-122) | `catch` vacío que traga errores de parsing silenciosamente | S108 | Code smell - Major |
| D-07 | `restoreBookings` (l.119) | Variable `error` capturada y nunca usada | S1481 | Code smell - Minor |
| D-08 | `legacySeatUpdate` (l.124-133) | `var` en vez de `let`/`const` | S3504 | Code smell - Critical |
| D-09 | `legacySeatUpdate` (l.126-127) | Asignación muerta: `newSeats` se asigna y se sobrescribe sin uso intermedio | S1854 | Code smell - Major |
| D-10 | `legacySeatUpdate` (l.127) | Autoasignación `newSeats = newSeats` | S1656 | Bug - Major |
| D-11 | `legacySeatUpdate` (l.128-132) | Ramas `if`/`else` con implementación idéntica | S1871 | Code smell - Major |
| D-12 | `impossiblePassengerList` (l.135-140) | `passengers.length < 0` es siempre falso: expresión gratuita y código muerto | S2589 | Code smell - Major |
| D-13 | `legacyDocumentRule` (l.142-145) | Regex `(a+)+` con retroceso catastrófico: negación de servicio por ReDoS | S5852 | Vulnerabilidad - Critical |
| D-14 | `sortFlightIds` (l.147-149) | Mutación in-place del parámetro (`ids.sort()`): efecto secundario sorpresivo para el llamador | Sin regla directa; práctica riesgosa documentada | - |
| D-15 | `calculateOperationalRisk` (l.151-195) | Complejidad cognitiva alta por anidamiento y ramas encadenadas | S3776 | Code smell - Critical |
| D-16 | `calculateOperationalRisk` (l.151) | Firma larga con 4 parámetros y banderas (`channel`, `isInternational`) | S107 | Code smell - Major |
| D-17 | `calculateOperationalRisk` (cuerpo completo) | Números mágicos (5, 7, 8, 10, 1000) sin constante nombrada | S109 | Code smell - Major |
| D-18 | `duplicatedNotification` (l.197-214) | Bloque `if`/`else` duplicado línea por línea (además genera duplicación de código) | S1871 + S106 | Code smell - Major |
| D-19 | `getCabinLabel` (l.216-227) | `case 'B'` sin `break`: cae al caso siguiente sin querer | S128 | Code smell - Blocker |
| D-20 | `normalizePassengerCount` (l.229-231) | `parseInt` sin base: `'08'` puede interpretarse distinto a `'8'` según entorno | S2427 | Code smell - Major |
| D-21 | `checkBookingStatus` (l.233-235) | `status === status` siempre verdadero: comparación gratuita | S2589 | Code smell - Major |
| D-22 | `unusedLegacyCalculation` (l.237-242) | Asignación muerta de `tax` y variable local `unusedAirportFee` sin uso | S1854 + S1481 | Code smell - Major/Minor |
| D-23 | Comentario `TODO` (l.96) | Rastreador de pendientes en código | S1135 | Code smell - Info |
| D-24 | Bloque comentado (l.244-246) | Código muerto comentado en vez de eliminado (el historial lo guarda Git) | S125 | Code smell - Major |

### `app/page.tsx` - defecto funcional en la interfaz

| ID | Ubicación | Defecto | Regla | Tipo - Severidad |
|---|---|---|---|---|
| D-25 | Estado `promotion` (l.86) + `useEffect` (l.91-92) + render (l.267) | XSS reflejado: el parámetro `?campaign=` de la URL se inyecta sin sanitizar en `dangerouslySetInnerHTML`. PoC: abrir `/?campaign=<img src=x onerror=alert(1)>` | Sin regla directa en SonarQube Community (S6761 no aplica porque no hay `children`); detectable con análisis de taint en ediciones superiores o revisión manual | Vulnerabilidad - Crítica contextual |
| D-26 | `useEffect` de registro MCP (l.95-162) | Dependencia gruesa `[results]`: re-registra las herramientas en cada búsqueda en vez de depender solo de un `ref` | Observación de diseño (reglas de hooks); no genera hallazgo Sonar por defecto | - |

## Remediación sugerida por defecto clave

1. **D-01** Usar `crypto.getRandomValues` o un secuencial con prefijo de
   servidor para códigos de reserva.
2. **D-02** Eliminar `eval` y reemplazarlo por un conjunto cerrado de reglas
   de negocio (objeto con funciones permitidas).
3. **D-04** Mover credenciales a variables de entorno o un gestor de secretos
   y comparar con hash de tiempo constante.
4. **D-06** Registrar el error (`console.error` o logger) y devolver un valor
   por defecto documentado.
5. **D-13** Reescribir el patrón como `/^a+$/` (sin grupo anidado cuantificado).
6. **D-19** Agregar `break` o agrupar casos explícitos (`case 'B': case 'P':`).
7. **D-25** Eliminar `dangerouslySetInnerHTML` y renderizar la promoción como
   texto, o sanitizar con DOMPurify si el HTML es imprescindible.

## Notas para el ejercicio

- Las severidades citadas son las predeterminadas de la regla; el perfil de
  calidad activo en el servidor puede recalificarlas.
- S1523, S2068 y S2245 suelen presentarse como puntos calientes (security
  hotspots) que requieren revisión humana antes de contar como vulnerabilidad.
- La duplicación de código en `duplicatedNotification` la reporta el motor de
  detección de duplicados (sección "Duplicación"), no una regla puntual.
- `components/ui/**` (componentes shadcn de proveedor) está excluido del
  análisis en `sonar-project.properties` para mantener el reporte enfocado en
  el código del ejercicio.
