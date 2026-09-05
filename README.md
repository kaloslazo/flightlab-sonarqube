# FlightLab - Laboratorio SonarQube

Prototipo académico de reservas de vuelos con dos propósitos: aplicar un
sistema visual de marca de forma fiel y servir de material de pruebas para
análisis estático, porque incluye un conjunto deliberado de defectos
documentados en [docs/DEFECTOS-SONARQUBE.md](docs/DEFECTOS-SONARQUBE.md).

No procesa pagos ni emite pasajes reales. Todo dato queda en el
`localStorage` del navegador.

## Stack

- Next.js (React 19) con vinext y TypeScript
- Tailwind CSS 4 con componentes shadcn
- OxLint y OxFmt como linters locales
- SonarScanner para el análisis estático

## Requisitos

- Node.js 22 o superior
- SonarQube Community activo en `http://localhost:9000` (solo para el
  análisis)

## Ejecución

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`. Flujo de prueba recomendado: buscar Lima a
Cusco el 12/09/2026, elegir un vuelo, completar el pasajero y confirmar. La
pestaña "Mis reservas" lista el historial guardado en el dispositivo y
permite cancelar.

## Análisis con SonarQube

1. Iniciar el servidor SonarQube local (puerto 9000 por defecto).
2. Generar un token en "Mi cuenta - Seguridad" con permiso de análisis.
3. Exportar el token y ejecutar el escáner:

```bash
export SONAR_TOKEN=tu_token
sonar-scanner -Dsonar.token=$SONAR_TOKEN
```

La configuración vive en `sonar-project.properties` y analiza solo `app`,
`lib` y `hooks`; los componentes shadcn de proveedor quedan excluidos para
que el reporte se enfoque en el código del ejercicio. El catálogo espera al
menos 14 reglas distintas, incluyendo 1 Blocker (fallthrough), varios
Critical (eval, ReDoS, complejidad cognitiva, var) y vulnerabilidades de
credenciales y PRNG. Un defecto (XSS por `?campaign=`) no tiene regla directa
en la edición Community: es el hallazgo sorpresa para discusión en sesión.

## Estructura

- `app/` - interfaz: buscador, resultados, reserva y historial
- `lib/booking-engine.ts` - motor de reservas con la zona de defectos
  deliberados marcada con un banner de comentarios
- `docs/DEFECTOS-SONARQUBE.md` - catálogo de defectos con reglas esperadas
- `sonar-project.properties` - configuración del escáner

## Aviso académico

Proyecto educativo independiente inspirado en el sistema visual de LATAM
Cargo OpsCom (índigo `#1B0088`, coral `#ED1650`, tipografías Sora y Lato,
bordes sin sombras). No está afiliado a LATAM Airlines ni procesa datos
reales. Los defectos del catálogo existen a propósito: no copiar ese código
a sistemas productivos.
