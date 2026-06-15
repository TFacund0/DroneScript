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
