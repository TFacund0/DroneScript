/**
 * Pruebas unitarias para el motor de simulación (Simulator).
 *
 * Para ejecutar estas pruebas unitarias:
 * - Ejecución única: pnpm test
 * - Modo interactivo de desarrollo: pnpm test:watch
 */

import { describe, it, expect } from "vitest";
import { tokenize } from "../lexer";
import { parse } from "../parser";
import { interpretAST } from "../simulator";

function simulate(code: string) {
  const { tokens } = tokenize(code);
  const { ast } = parse(tokens);
  return interpretAST(ast);
}

describe("DroneScript Simulator", () => {
  it("debe acumular la posición física del dron paso a paso", () => {
    const steps = simulate(`
      MISION "recorrido"
        DESPEGAR ALTITUD 50 m
        MOVER norte 100 m
        MOVER este 40 m
        ATERRIZAR
      FIN
    `);

    // mision + despegar + 2 mover + aterrizar
    expect(steps).toHaveLength(5);

    const despegar = steps[1];
    expect(despegar.kind).toBe("despegar");
    expect(despegar.z).toBe(50);

    const norte = steps[2];
    expect(norte.kind).toBe("mover");
    expect(norte.y).toBe(-100); // norte = -y en el plano del canvas
    expect(norte.z).toBe(50);

    const este = steps[3];
    expect(este.x).toBe(40);
    expect(este.y).toBe(-100);

    const aterrizar = steps[4];
    expect(aterrizar.kind).toBe("aterrizar");
    expect(aterrizar.z).toBe(0);
    expect(aterrizar.x).toBe(40); // aterriza donde estaba, no en la base
  });

  it("debe manejar movimiento vertical (arriba/abajo) sin bajar de 0", () => {
    const steps = simulate(`
      MISION "vertical"
        DESPEGAR ALTITUD 10 m
        MOVER arriba 20 m
        MOVER abajo 100 m
      FIN
    `);

    expect(steps[2].z).toBe(30);
    expect(steps[3].z).toBe(0); // no puede quedar bajo tierra
  });

  it("debe volver a origen con MOVER BASE manteniendo la altitud", () => {
    const steps = simulate(`
      MISION "retorno"
        DESPEGAR ALTITUD 80 m
        MOVER sureste 100 m
        MOVER BASE
      FIN
    `);

    const base = steps[3];
    expect(base.kind).toBe("base");
    expect(base.x).toBe(0);
    expect(base.y).toBe(0);
    expect(base.z).toBe(80);
  });

  it("debe registrar sensores y condicionales sin alterar la trayectoria", () => {
    const steps = simulate(`
      MISION "monitoreo"
        DESPEGAR ALTITUD 60 m
        SENSOR viento FRECUENCIA 5 s
        SI viento > 30 ENTONCES
          ATERRIZAR
        FIN
      FIN
    `);

    const sensor = steps[2];
    expect(sensor.kind).toBe("sensor");
    expect(sensor.sensor).toBe("viento");
    expect(sensor.z).toBe(60);

    const condicional = steps[3];
    expect(condicional.kind).toBe("condicional");
    expect(condicional.label).toBe("SI viento > 30");
    // El cuerpo del condicional no se ejecuta en la trayectoria nominal
    expect(steps).toHaveLength(4);
    expect(condicional.z).toBe(60);
  });
});
