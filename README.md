# DroneScript

DroneScript es un entorno de desarrollo integrado y lenguaje de dominio específico (DSL) diseñado para la planificación, validación y simulación de misiones autónomas de vehículos aéreos no tripulados (UAVs). El sistema combina un compilador frontend (análisis léxico y sintáctico) desarrollado a medida con un visualizador interactivo en tiempo real para garantizar la seguridad y corrección lógica de los planes de vuelo antes de su despliegue físico.

## Descripción del Sistema

El proyecto proporciona un pipeline completo para la interpretación de instrucciones de navegación aeronáutica:

1. **Analizador Léxico (Lexer):** Procesa el flujo de caracteres de entrada para generar un torrente de componentes léxicos (tokens), clasificando palabras clave del dominio (como comandos de movimiento, control de altitud, consultas de sensores y condicionales), identificadores de dirección, magnitudes y operadores de comparación. Incluye un sistema permisivo de recuperación ante errores léxicos para identificar caracteres inválidos sin detener el análisis completo.
2. **Analizador Sintáctico (Parser):** Valida la estructura gramatical del programa de acuerdo a las reglas sintácticas del lenguaje. Si la sintaxis es correcta, construye un Árbol de Sintaxis Abstracta (AST) que representa la jerarquía y secuencia de ejecución de la misión.
3. **Entorno de Simulación y Visualización:** Interfaz gráfica web interactiva desarrollada sobre React y Vite. Permite a los desarrolladores escribir código DroneScript con retroalimentación inmediata sobre la validez sintáctica, depurar mediante la inspección interactiva del AST y simular de forma tridimensional el comportamiento físico y el recorrido del dron programado.

## Casos de Uso y Aplicación en el Mundo Real

En el ámbito laboral y de desarrollo industrial, DroneScript y arquitecturas similares resuelven problemáticas críticas en el sector aeroespacial y de automatización:

* **Abstracción del Hardware (Hardware Abstraction Layer):** Permite a los operadores definir misiones complejas en un lenguaje de alto nivel estandarizado, el cual puede ser posteriormente transpilado o interpretado para diferentes plataformas de hardware comerciales (como PX4, ArduPilot o SDKs de fabricantes específicos como DJI) sin alterar la lógica de negocio de la misión.
* **Validación de Seguridad Previa al Vuelo (Pre-flight Safety Check):** Al validar la sintaxis y generar un AST, es posible aplicar análisis estático de código para detectar trayectorias prohibidas, colisiones potenciales o comportamientos fuera de los límites de seguridad física (geofencing) antes de cargar la misión al UAV.
* **Automatización en Logística y Monitoreo:** Facilita la programación de rutinas de inspección industrial repetitivas, patrullajes de seguridad aérea, mapeo agrícola y entrega de paquetes mediante la integración de sensores telemétricos (batería, viento, altitud y temperatura) en la toma de decisiones dinámicas durante el vuelo.
* **Plataforma de Simulación e Instrucción:** Sirve como herramienta de entrenamiento y simulación para operadores de drones, reduciendo a cero el coste y el riesgo de colisión durante la fase de desarrollo y aprendizaje de algoritmos de navegación.


## Guía de Instalación, Compilación y Ejecución

Esta sección detalla los pasos para configurar, compilar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

Asegúrate de tener instalado:
* **Node.js** (versión 18 o superior recomendada)
* Un gestor de paquetes de Node.js: **pnpm** (recomendado, ya que el proyecto incluye `pnpm-lock.yaml`), o alternativamente **npm** o **yarn**.

### 1. Instalación de Dependencias

Ejecuta el siguiente comando en la raíz del proyecto para descargar e instalar todas las dependencias requeridas (incluyendo Monaco Editor y los tipos de React/TypeScript):

```bash
pnpm install
```
*(Si prefieres usar npm, ejecuta `npm install`)*

### 2. Ejecución en Modo de Desarrollo

Para iniciar el servidor de desarrollo local de Vite y abrir la aplicación interactiva en tu navegador:

```bash
pnpm dev
```
*(O `npm run dev` con npm)*

Una vez iniciado, abre tu navegador en la dirección local indicada en la terminal (usualmente `http://localhost:5173`).

### 3. Compilación para Producción

Para compilar el proyecto y generar los archivos optimizados listos para su distribución:

```bash
pnpm build
```
*(O `npm run build` con npm)*

Este comando realiza el chequeo de tipos de TypeScript (`tsc`) y posteriormente empaqueta los archivos estáticos mediante Vite en el directorio `./dist`.

### 4. Vista Previa de la Compilación de Producción

Para probar localmente el paquete generado en `./dist` tal como se comportaría en producción:

```bash
pnpm preview
```
*(O `npm run preview` con npm)*

### 5. Chequeo de Tipos y Linter

Si deseas ejecutar únicamente la verificación estática de TypeScript para comprobar la ausencia de errores de tipado:

```bash
pnpm typecheck
```
*(O `npm run typecheck` con npm)*

