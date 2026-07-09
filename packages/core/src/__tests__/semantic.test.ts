/**
 * Pruebas unitarias para el analizador semántico.
 *
 * Para ejecutar estas pruebas unitarias:
 * - Ejecución única: pnpm test
 * - Modo interactivo de desarrollo: pnpm test:watch
 */

import { describe, it, expect } from "vitest";
import { tokenize } from "../lexer";
import { parse } from "../parser";
import { analyzeSemantics } from "../semantic";

function analyze(code: string) {
  const { tokens } = tokenize(code);
  const { ast } = parse(tokens);
  return analyzeSemantics(ast);
}

describe("DroneScript Semantic Analyzer", () => {
  it("no debe reportar nada en una misión correcta", () => {
    const issues = analyze(`
      MISION "correcta"
        DESPEGAR ALTITUD 50 m
        MOVER norte 100 m
        SENSOR bateria FRECUENCIA 10 s
        ATERRIZAR
      FIN
    `);
    expect(issues).toHaveLength(0);
  });

  it("debe detectar MOVER antes de DESPEGAR", () => {
    const issues = analyze(`
      MISION "sin_despegue"
        MOVER norte 100 m
        ATERRIZAR
      FIN
    `);
    const errores = issues.filter((i) => i.severity === "error");
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].message).toContain("MOVER antes de DESPEGAR");
  });

  it("debe detectar DESPEGAR con el dron ya en vuelo", () => {
    const issues = analyze(`
      MISION "doble_despegue"
        DESPEGAR ALTITUD 50 m
        DESPEGAR ALTITUD 80 m
        ATERRIZAR
      FIN
    `);
    expect(
      issues.some(
        (i) => i.severity === "error" && i.message.includes("ya en vuelo"),
      ),
    ).toBe(true);
  });

  it("debe detectar ATERRIZAR con el dron en tierra", () => {
    const issues = analyze(`
      MISION "aterrizaje_doble"
        DESPEGAR ALTITUD 50 m
        ATERRIZAR
        ATERRIZAR
      FIN
    `);
    expect(
      issues.some(
        (i) => i.severity === "error" && i.message.includes("en tierra"),
      ),
    ).toBe(true);
  });

  it("debe detectar comparaciones de bateria fuera del rango 0-100", () => {
    const issues = analyze(`
      MISION "bateria_imposible"
        DESPEGAR ALTITUD 50 m
        SI bateria > 150 ENTONCES
          ATERRIZAR
        FIN
        ATERRIZAR
      FIN
    `);
    expect(
      issues.some(
        (i) => i.severity === "error" && i.message.includes("entre 0 y 100"),
      ),
    ).toBe(true);
  });

  it("debe advertir cuando la misión termina sin ATERRIZAR", () => {
    const issues = analyze(`
      MISION "queda_volando"
        DESPEGAR ALTITUD 50 m
        MOVER norte 100 m
      FIN
    `);
    const warnings = issues.filter((i) => i.severity === "warning");
    expect(warnings.length).toBe(1);
    expect(warnings[0].message).toContain("termina sin ATERRIZAR");
  });

  it("debe advertir magnitudes en cero", () => {
    const issues = analyze(`
      MISION "magnitudes_cero"
        DESPEGAR ALTITUD 0 m
        MOVER norte 0 m
        SENSOR bateria FRECUENCIA 0 s
        ATERRIZAR
      FIN
    `);
    const warnings = issues.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.message.includes("altitud 0"))).toBe(true);
    expect(warnings.some((w) => w.message.includes("distancia 0"))).toBe(true);
    expect(warnings.some((w) => w.message.includes("FRECUENCIA 0"))).toBe(true);
  });

  it("no debe alterar el estado de vuelo con comandos dentro de un condicional", () => {
    // El ATERRIZAR condicional no garantiza que el dron esté en tierra:
    // la misión sigue considerándose en vuelo y debe advertirse el final sin aterrizar.
    const issues = analyze(`
      MISION "aterrizaje_condicional"
        DESPEGAR ALTITUD 50 m
        SI bateria < 20 ENTONCES
          ATERRIZAR
        FIN
        MOVER norte 100 m
      FIN
    `);
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(
      issues.some(
        (i) =>
          i.severity === "warning" &&
          i.message.includes("termina sin ATERRIZAR"),
      ),
    ).toBe(true);
  });
});
