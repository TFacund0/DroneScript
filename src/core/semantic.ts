import type { ProgramaNode, CmdNode, SemanticError } from "../types";

// ─── ANALIZADOR SEMÁNTICO DE DRONESCRIPT ─────────────────────────────────────
// Tercera fase del pipeline: valida reglas que la gramática libre de contexto
// no puede expresar, recorriendo el AST con un modelo del estado de vuelo.
//
// Errores (misión lógicamente inválida):
//   - MOVER / SENSOR / ATERRIZAR antes de DESPEGAR
//   - DESPEGAR cuando el dron ya está en vuelo
//   - Comparaciones de batería fuera del rango físico 0–100 (%)
// Advertencias (válido pero sospechoso):
//   - Misión que termina sin ATERRIZAR (el dron queda en el aire)
//   - Magnitudes en cero (distancia, altitud, frecuencia o velocidad)

/** Rango físico de cada sensor consultable en condicionales. */
const SENSOR_RANGE: Record<
  string,
  { min: number; max: number; unidad: string }
> = {
  bateria: { min: 0, max: 100, unidad: "%" },
};

/**
 * Ejecuta el análisis semántico completo sobre el AST.
 * @returns La lista de errores y advertencias semánticas encontradas.
 */
export function analyzeSemantics(ast: ProgramaNode): SemanticError[] {
  const issues: SemanticError[] = [];

  for (const mision of ast.misiones) {
    let enVuelo = false;

    const error = (message: string, line: number) =>
      issues.push({ message, line, severity: "error" });
    const warning = (message: string, line: number) =>
      issues.push({ message, line, severity: "warning" });

    // Valida las reglas de un comando. Los comandos dentro de un condicional
    // se validan también, pero no alteran el estado de vuelo nominal porque
    // su ejecución no está garantizada (p. ej. un aterrizaje de emergencia).
    const checkCmd = (cmd: CmdNode, dentroDeCondicional: boolean): void => {
      switch (cmd.type) {
        case "despegar": {
          if (enVuelo && !dentroDeCondicional) {
            error(
              `Error semántico en línea ${cmd.line}: DESPEGAR con el dron ya en vuelo (falta un ATERRIZAR previo)`,
              cmd.line,
            );
          }
          if (cmd.altitud === 0) {
            warning(
              `Advertencia en línea ${cmd.line}: DESPEGAR con altitud 0 no eleva el dron`,
              cmd.line,
            );
          }
          if (!dentroDeCondicional) enVuelo = true;
          break;
        }
        case "mover": {
          if (!enVuelo && !dentroDeCondicional) {
            error(
              `Error semántico en línea ${cmd.line}: MOVER antes de DESPEGAR (el dron no está en vuelo)`,
              cmd.line,
            );
          }
          if (cmd.modo === "direccion" && cmd.distancia === 0) {
            warning(
              `Advertencia en línea ${cmd.line}: MOVER con distancia 0 no tiene efecto`,
              cmd.line,
            );
          }
          if (cmd.velocidad === 0) {
            warning(
              `Advertencia en línea ${cmd.line}: VELOCIDAD 0 dejaría al dron detenido`,
              cmd.line,
            );
          }
          break;
        }
        case "aterrizar": {
          if (!enVuelo && !dentroDeCondicional) {
            error(
              `Error semántico en línea ${cmd.line}: ATERRIZAR con el dron en tierra`,
              cmd.line,
            );
          }
          if (!dentroDeCondicional) enVuelo = false;
          break;
        }
        case "sensor": {
          if (!enVuelo && !dentroDeCondicional) {
            error(
              `Error semántico en línea ${cmd.line}: SENSOR antes de DESPEGAR (el dron no está en vuelo)`,
              cmd.line,
            );
          }
          if (cmd.frecuencia === 0) {
            warning(
              `Advertencia en línea ${cmd.line}: FRECUENCIA 0 nunca tomaría mediciones`,
              cmd.line,
            );
          }
          break;
        }
        case "condicional": {
          const rango = SENSOR_RANGE[cmd.variable];
          if (rango && (cmd.valor < rango.min || cmd.valor > rango.max)) {
            error(
              `Error semántico en línea ${cmd.line}: '${cmd.variable}' solo puede valer entre ${rango.min} y ${rango.max}${rango.unidad}, la condición '${cmd.variable} ${cmd.op} ${cmd.valor}' nunca cambia de resultado`,
              cmd.line,
            );
          }
          checkCmd(cmd.cmd, true);
          break;
        }
        case "error":
          // Los nodos de error sintáctico ya fueron reportados por el parser.
          break;
      }
    };

    for (const cmd of mision.bloque?.cmds || []) {
      checkCmd(cmd, false);
    }

    if (enVuelo) {
      warning(
        `Advertencia en misión ${mision.nombre} (línea ${mision.line}): la misión termina sin ATERRIZAR, el dron queda en el aire`,
        mision.line,
      );
    }
  }

  return issues;
}
