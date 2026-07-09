# 🚁 DroneScript

> Lenguaje de dominio específico (DSL) para planificar, validar y simular misiones de drones — con lexer y parser LL(1) implementados desde cero en TypeScript, y un IDE web interactivo con simulación en tiempo real.

**🔗 [Probar la demo en vivo →](https://drone-script.vercel.app/)**

[![CI](https://github.com/TFacund0/DroneScript/actions/workflows/ci.yml/badge.svg)](https://github.com/TFacund0/DroneScript/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-vitest-6E9F18?logo=vitest&logoColor=white)
[![Demo](https://img.shields.io/badge/demo-vercel-000000?logo=vercel&logoColor=white)](https://drone-script.vercel.app/)

<!-- TODO: reemplazar por un screenshot o GIF real del simulador -->
<!-- ![Demo de DroneScript](docs/demo.gif) -->

## ¿Qué es?

DroneScript es un proyecto de **Teoría de la Computación** que implementa el frontend completo de un compilador para un lenguaje de misiones de vuelo:

```
MISION "patrulla_campo"
  DESPEGAR ALTITUD 100 m
  MOVER norte 200 m VELOCIDAD 5
  SENSOR temperatura FRECUENCIA 10 s
  SI bateria < 20 ENTONCES
    ATERRIZAR
  FIN
  MOVER BASE
  ATERRIZAR
FIN
```

El código se analiza en vivo mientras escribís: se tokeniza, se parsea, se construye el AST y se simula el vuelo del dron en un visualizador interactivo.

## Características

- ✈️ **Lexer hecho a mano** con recuperación de errores: los caracteres inválidos se reportan sin detener el análisis.
- 🌳 **Parser descendente recursivo LL(1)** que construye un Árbol de Sintaxis Abstracta (AST) tipado y reporta errores sintácticos con línea y columna.
- 📐 **Gramática demostrada LL(1)**: los conjuntos FIRST y FOLLOW de cada no-terminal están documentados en [`docs/first_follow.md`](docs/first_follow.md).
- 🖥️ **IDE web** con editor Monaco (el de VS Code), paneles de tokens, AST navegable, gramática y errores.
- 🛰️ **Simulador visual** que interpreta el AST y anima la trayectoria del dron (direcciones, altitud, velocidad, sensores y condicionales).
- 🧪 **Suite de tests**: unitarios para lexer y parser (Vitest) + pipeline de integración sobre un catálogo de casos válidos e inválidos ([`tests/cases.json`](tests/cases.json)).

## El lenguaje

| Instrucción | Sintaxis | Ejemplo |
| :--- | :--- | :--- |
| Misión | `MISION "nombre" ... FIN` | `MISION "vuelo" ... FIN` |
| Despegue | `DESPEGAR ALTITUD <n> [unidad]` | `DESPEGAR ALTITUD 50 m` |
| Movimiento | `MOVER <dirección> <n> [unidad] [VELOCIDAD <n>]` | `MOVER norte 200 m VELOCIDAD 5` |
| Retorno | `MOVER BASE` | `MOVER BASE` |
| Aterrizaje | `ATERRIZAR` | `ATERRIZAR` |
| Sensor | `SENSOR <tipo> FRECUENCIA <n> [unidad]` | `SENSOR viento FRECUENCIA 5 s` |
| Condicional | `SI <sensor> <op> <n> ENTONCES <cmd>` | `SI bateria < 20 ENTONCES ATERRIZAR` |

**Direcciones:** `norte`, `sur`, `este`, `oeste`, `noreste`, `noroeste`, `sureste`, `suroeste`, `arriba`, `abajo` · **Sensores:** `temperatura`, `bateria`, `altura`, `velocidad`, `viento` · **Operadores:** `<`, `>`, `<=`, `>=`, `==` · Los condicionales se pueden anidar y `#` inicia un comentario de línea.

## Arquitectura

```
Código fuente ──▶ Lexer ──▶ Tokens ──▶ Parser ──▶ AST ──▶ Simulador / Paneles
                    │                    │
                    └── errores léxicos ─┴── errores sintácticos
```

```
src/
├── core/               # Frontend del compilador (sin dependencias de UI)
│   ├── lexer.ts        #   Análisis léxico con recuperación de errores
│   ├── parser.ts       #   Parser descendente recursivo LL(1) → AST
│   └── __tests__/      #   Tests unitarios
├── components/         # UI: editor Monaco, paneles y simulador
├── hooks/
│   └── useAnalyzer.ts  # Conecta el pipeline con React
├── constants/          # Ejemplos de código y colores de tokens
└── types.ts            # Tokens, nodos del AST y errores (tipado compartido)
tests/
├── cases.json          # Catálogo de casos válidos e inválidos
└── runner.ts           # Runner de integración del pipeline completo
docs/
└── first_follow.md     # Demostración formal de que la gramática es LL(1)
```

El núcleo del compilador (`src/core/`) es TypeScript puro sin dependencias de React, por lo que puede reutilizarse en un CLI, un backend o transpilarse a plataformas reales (PX4, ArduPilot, SDKs de fabricante).

## Empezar

Requisitos: **Node.js 18+** y **pnpm** (o npm/yarn).

```bash
pnpm install      # instalar dependencias
pnpm dev          # servidor de desarrollo → http://localhost:5173
```

Otros comandos:

| Comando | Descripción |
| :--- | :--- |
| `pnpm build` | Chequeo de tipos + build de producción en `./dist` |
| `pnpm preview` | Sirve localmente el build de producción |
| `pnpm typecheck` | Solo verificación de tipos de TypeScript |
| `pnpm lint` | ESLint sobre todo el proyecto |
| `pnpm format` | Formatea el código con Prettier |
| `pnpm test` | Tests unitarios de lexer y parser |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:integration` | Pipeline completo sobre `tests/cases.json` |

## Fundamento teórico

La gramática fue factorizada por izquierda para eliminar ambigüedades (p. ej. `MOVER dirección ...` vs `MOVER BASE`) y se verificó la condición LL(1): para cada no-terminal, los conjuntos FIRST de sus alternativas son disjuntos, y donde existe la producción vacía, FIRST y FOLLOW también lo son. La tabla completa está en [`docs/first_follow.md`](docs/first_follow.md).

Esto garantiza que el parser descendente recursivo decide cada derivación con **un solo token de anticipación**, sin backtracking.

## Roadmap

- [ ] Análisis semántico (validación de rangos de sensores, misiones sin `ATERRIZAR`, geofencing)
- [ ] Diagnósticos en el editor (subrayado de errores en Monaco)
- [ ] Extraer `core/` como paquete independiente + CLI (`dronescript check mision.ds`)
- [x] Integración continua (lint + tipos + tests + build en cada push)
- [x] Demo desplegada en Vercel

## Contexto académico

Proyecto desarrollado para la cátedra **Teoría de la Computación** (Licenciatura en Sistemas de Información), como aplicación práctica de análisis léxico, gramáticas libres de contexto y parsing LL(1).

## Licencia

Distribuido bajo la licencia [MIT](LICENSE).
