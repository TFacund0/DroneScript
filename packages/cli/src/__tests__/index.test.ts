import { describe, expect, it } from "vitest";
import { checkFile, usageText } from "../index";

const MISION_VALIDA = `MISION "vuelo_simple"
  DESPEGAR ALTITUD 50 m
  ATERRIZAR
FIN`;

const MISION_INVALIDA = `MISION "vuelo_roto"
  MOVER norte 10 m
  ATERRIZAR
FIN`;

describe("checkFile", () => {
  it("devuelve exitCode 0 y un resumen para una misión válida", () => {
    const resultado = checkFile("mision.ds", () => MISION_VALIDA);

    expect(resultado.exitCode).toBe(0);
    expect(resultado.stderr).toHaveLength(0);
    expect(resultado.stdout[0]).toContain("mision.ds es una misión válida");
  });

  it("devuelve exitCode 1 y reporta errores para una misión inválida", () => {
    const resultado = checkFile("mision.ds", () => MISION_INVALIDA);

    expect(resultado.exitCode).toBe(1);
    expect(resultado.stdout).toHaveLength(0);
    expect(resultado.stderr.some((l) => l.includes("mision.ds:"))).toBe(true);
    expect(resultado.stderr[resultado.stderr.length - 1]).toContain("error");
  });

  it("devuelve exitCode 2 cuando no se puede leer el archivo", () => {
    const resultado = checkFile("no-existe.ds", () => {
      throw new Error("ENOENT");
    });

    expect(resultado.exitCode).toBe(2);
    expect(resultado.stderr[0]).toContain("no se pudo leer el archivo");
  });
});

describe("usageText", () => {
  it("explica el comando check", () => {
    expect(usageText()).toContain("dronescript check <archivo.ds>");
  });
});
