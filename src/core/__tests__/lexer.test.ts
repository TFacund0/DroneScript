/**
 * Pruebas unitarias para el analizador léxico (Lexer).
 * 
 * Para ejecutar estas pruebas unitarias:
 * - Ejecución única: pnpm test
 * - Modo interactivo de desarrollo: pnpm test:watch
 */

import { describe, it, expect } from "vitest";
import { tokenize } from "../lexer";

describe("DroneScript Lexer", () => {
  it("debe tokenizar palabras clave (keywords) en mayúsculas", () => {
    const input = "MISION FIN DESPEGAR ALTITUD MOVER ATERRIZAR SENSOR FRECUENCIA SI ENTONCES BASE VELOCIDAD";
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(0);
    // 12 palabras clave + 1 EOF = 13 tokens
    expect(tokens).toHaveLength(13);

    const expectedKeywords = [
      "MISION",
      "FIN",
      "DESPEGAR",
      "ALTITUD",
      "MOVER",
      "ATERRIZAR",
      "SENSOR",
      "FRECUENCIA",
      "SI",
      "ENTONCES",
      "BASE",
      "VELOCIDAD",
    ];

    expectedKeywords.forEach((kw, index) => {
      expect(tokens[index].type).toBe("KEYWORD");
      expect(tokens[index].value).toBe(kw);
      expect(tokens[index].line).toBe(1);
    });

    expect(tokens[12].type).toBe("EOF");
  });

  it("debe tokenizar direcciones de forma insensible a mayúsculas y minúsculas", () => {
    const input = "norte SUR este Oeste arriba abajo";
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(0);
    expect(tokens).toHaveLength(7); // 6 direcciones + 1 EOF

    const expectedDirections = ["norte", "sur", "este", "oeste", "arriba", "abajo"];
    expectedDirections.forEach((dir, index) => {
      expect(tokens[index].type).toBe("IDENT");
      expect(tokens[index].subtype).toBe("direccion");
      expect(tokens[index].value).toBe(dir); // Debe estar en minúsculas
    });
  });

  it("debe tokenizar sensores de forma insensible a mayúsculas y minúsculas", () => {
    const input = "temperatura BATERIA altura velocidad viento";
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(0);
    expect(tokens).toHaveLength(6); // 5 sensores + 1 EOF

    const expectedSensors = ["temperatura", "bateria", "altura", "velocidad", "viento"];
    expectedSensors.forEach((sensor, index) => {
      expect(tokens[index].type).toBe("IDENT");
      expect(tokens[index].subtype).toBe("sensor");
      expect(tokens[index].value).toBe(sensor); // Debe estar en minúsculas
    });
  });

  it("debe tokenizar strings con comillas", () => {
    const input = 'MISION "patrulla_1"';
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(0);
    expect(tokens).toHaveLength(3); // MISION, STRING, EOF

    expect(tokens[0]).toEqual({
      type: "KEYWORD",
      value: "MISION",
      line: 1,
      col: 1,
    });

    expect(tokens[1]).toEqual({
      type: "STRING",
      value: '"patrulla_1"',
      line: 1,
      col: 8,
    });
  });

  it("debe tokenizar números enteros y decimales", () => {
    const input = "100 12.34 0.5";
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(0);
    expect(tokens).toHaveLength(4); // 3 números + 1 EOF

    expect(tokens[0].type).toBe("NUMBER");
    expect(tokens[0].value).toBe("100");

    expect(tokens[1].type).toBe("NUMBER");
    expect(tokens[1].value).toBe("12.34");

    expect(tokens[2].type).toBe("NUMBER");
    expect(tokens[2].value).toBe("0.5");
  });

  it("debe tokenizar unidades", () => {
    const input = "m km s %";
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(0);
    expect(tokens).toHaveLength(5); // 4 unidades + 1 EOF

    expect(tokens[0]).toEqual(expect.objectContaining({ type: "UNIT", value: "m" }));
    expect(tokens[1]).toEqual(expect.objectContaining({ type: "UNIT", value: "km" }));
    expect(tokens[2]).toEqual(expect.objectContaining({ type: "UNIT", value: "s" }));
    expect(tokens[3]).toEqual(expect.objectContaining({ type: "UNIT", value: "%" }));
  });

  it("debe tokenizar operadores de comparación", () => {
    const input = "< > <= >= ==";
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(0);
    expect(tokens).toHaveLength(6); // 5 operadores + 1 EOF

    const expectedOps = ["<", ">", "<=", ">=", "=="];
    expectedOps.forEach((op, index) => {
      expect(tokens[index]).toEqual(
        expect.objectContaining({
          type: "OP",
          value: op,
        })
      );
    });
  });

  it("debe ignorar comentarios y espacios en blanco pero mantener la línea/columna correcta", () => {
    const input = `MISION "vuelo"# Comentario de prueba
  DESPEGAR ALTITUD 50 m # Otro comentario
FIN`;
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(0);
    // MISION, STRING, DESPEGAR, ALTITUD, NUMBER, UNIT, FIN, EOF = 8 tokens
    expect(tokens).toHaveLength(8);

    // MISION "vuelo" (línea 1)
    expect(tokens[0]).toEqual({ type: "KEYWORD", value: "MISION", line: 1, col: 1 });
    expect(tokens[1]).toEqual({ type: "STRING", value: '"vuelo"', line: 1, col: 8 });

    // DESPEGAR ALTITUD 50 m (línea 2, con 2 espacios iniciales de sangría)
    expect(tokens[2]).toEqual({ type: "KEYWORD", value: "DESPEGAR", line: 2, col: 3 });
    expect(tokens[3]).toEqual({ type: "KEYWORD", value: "ALTITUD", line: 2, col: 12 });
    expect(tokens[4]).toEqual({ type: "NUMBER", value: "50", line: 2, col: 20 });
    expect(tokens[5]).toEqual({ type: "UNIT", value: "m", line: 2, col: 23 });

    // FIN (línea 3)
    expect(tokens[6]).toEqual({ type: "KEYWORD", value: "FIN", line: 3, col: 1 });
  });

  it("debe registrar errores léxicos para caracteres no reconocidos", () => {
    const input = "DESPEGAR $ ALTITUD ? 50";
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(2);
    expect(errors[0]).toEqual({
      message: "Carácter no reconocido '$' en línea 1, col 10",
      line: 1,
      col: 10,
    });
    expect(errors[1]).toEqual({
      message: "Carácter no reconocido '?' en línea 1, col 20",
      line: 1,
      col: 20,
    });

    // Debe seguir tokenizando el resto de los elementos correctos
    expect(tokens).toHaveLength(4); // DESPEGAR, ALTITUD, NUMBER, EOF
    // Esperamos: DESPEGAR, ALTITUD, NUMBER (50), EOF
    expect(tokens[0].value).toBe("DESPEGAR");
    expect(tokens[1].value).toBe("ALTITUD");
    expect(tokens[2].value).toBe("50");
    expect(tokens[3].type).toBe("EOF");
  });

  it("debe registrar error para strings sin cerrar", () => {
    const input = 'MISION "nombre_incompleto';
    const { tokens, errors } = tokenize(input);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("String sin cerrar");
    expect(errors[0].line).toBe(1);
    expect(errors[0].col).toBe(8);

    // Debe contener el token de la palabra clave MISION y EOF
    expect(tokens).toHaveLength(2);
    expect(tokens[0].value).toBe("MISION");
    expect(tokens[1].type).toBe("EOF");
  });
});
