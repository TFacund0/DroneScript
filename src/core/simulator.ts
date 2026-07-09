import type { ProgramaNode, CmdNode } from "../types";

// ─── MOTOR DE SIMULACIÓN DE DRONESCRIPT ──────────────────────────────────────
// Interpreta el AST y produce la secuencia de pasos físicos del dron
// (posiciones acumuladas en metros). Es código puro, sin dependencias de UI,
// para que pueda testearse de forma aislada y reutilizarse fuera del navegador.

export const DIR_VECTOR: Record<string, [number, number]> = {
  norte: [0, -1],
  sur: [0, 1],
  este: [1, 0],
  oeste: [-1, 0],
  noreste: [0.7071, -0.7071],
  noroeste: [-0.7071, -0.7071],
  sureste: [0.7071, 0.7071],
  suroeste: [-0.7071, 0.7071],
};

export type StepKind =
  | "despegar"
  | "mover"
  | "aterrizar"
  | "sensor"
  | "condicional"
  | "base"
  | "mision";

export interface Step {
  kind: StepKind;
  label: string;
  mision: string;
  dx?: number;
  dy?: number;
  dist?: number;
  sensor?: string;
  x: number; // Posición física acumulada en X (metros)
  y: number; // Posición física acumulada en Y (metros)
  z: number; // Altitud acumulada en Z (metros)
}

/**
 * Recorre el AST y genera la lista de pasos de la simulación,
 * acumulando la posición física del dron comando a comando.
 */
export function interpretAST(ast: ProgramaNode): Step[] {
  const steps: Step[] = [];
  let cx = 0;
  let cy = 0;
  let cz = 0;

  function interpCmd(cmd: CmdNode, mision: string): void {
    switch (cmd.type) {
      case "despegar": {
        cz = cmd.altitud;
        steps.push({
          kind: "despegar",
          label: `DESPEGAR ALTITUD ${cmd.altitud}${cmd.unidad || ""}`,
          mision,
          x: cx,
          y: cy,
          z: cz,
        });
        break;
      }
      case "mover": {
        if (cmd.modo === "base") {
          cx = 0;
          cy = 0;
          // cz se mantiene en la altitud actual al regresar a la base
          steps.push({
            kind: "base",
            label: "MOVER BASE",
            mision,
            x: cx,
            y: cy,
            z: cz,
          });
        } else {
          const dir = (cmd.direccion || "").toLowerCase();
          const dist = cmd.distancia ?? 0;
          if (dir === "arriba") {
            cz += dist;
          } else if (dir === "abajo") {
            cz = Math.max(0, cz - dist);
          } else {
            const [dx, dy] = DIR_VECTOR[dir] ?? [0, 0];
            cx += dx * dist;
            cy += dy * dist;
          }

          steps.push({
            kind: "mover",
            dx: DIR_VECTOR[dir] ? DIR_VECTOR[dir][0] : undefined,
            dy: DIR_VECTOR[dir] ? DIR_VECTOR[dir][1] : undefined,
            dist,
            label: `MOVER ${cmd.direccion} ${cmd.distancia}${cmd.unidad || ""}`,
            mision,
            x: cx,
            y: cy,
            z: cz,
          });
        }
        break;
      }
      case "aterrizar": {
        cz = 0;
        steps.push({
          kind: "aterrizar",
          label: "ATERRIZAR",
          mision,
          x: cx,
          y: cy,
          z: cz,
        });
        break;
      }
      case "sensor": {
        steps.push({
          kind: "sensor",
          sensor: cmd.sensor,
          label: `SENSOR ${cmd.sensor}`,
          mision,
          x: cx,
          y: cy,
          z: cz,
        });
        break;
      }
      case "condicional": {
        steps.push({
          kind: "condicional",
          label: `SI ${cmd.variable} ${cmd.op} ${cmd.valor}`,
          mision,
          x: cx,
          y: cy,
          z: cz,
        });
        // No ejecutamos el cuerpo del condicional en la trayectoria de simulación por defecto,
        // para que no ensucie la ruta nominal del dron (como por ejemplo aterrizajes de emergencia).
        break;
      }
    }
  }

  for (const mision of ast.misiones) {
    steps.push({
      kind: "mision",
      label: `MISION ${mision.nombre}`,
      mision: mision.nombre,
      x: cx,
      y: cy,
      z: cz,
    });
    for (const cmd of mision.bloque?.cmds || []) {
      interpCmd(cmd, mision.nombre);
    }
  }
  return steps;
}
