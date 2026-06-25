/**
 * Pruebas unitarias para el analizador sintáctico (Parser).
 * 
 * Para ejecutar estas pruebas unitarias:
 * - Ejecución única: pnpm test
 * - Modo interactivo de desarrollo: pnpm test:watch
 */

import { describe, it, expect } from "vitest";
import { tokenize } from "../lexer";
import { Parser, parse } from "../parser";
import type { ProgramaNode, DespecarNode, MoverNode, AterrizarNode, SensorNode, CondicionalNode } from "../../types";

describe("DroneScript Parser", () => {
  it("debe parsear un programa básico válido", () => {
    const code = `
      MISION "vuelo_simple"
        DESPEGAR ALTITUD 50 m
        ATERRIZAR
      FIN
    `;
    const { tokens } = tokenize(code);
    const { ast, errors } = parse(tokens);

    expect(errors).toHaveLength(0);
    expect(ast.type).toBe("programa");
    expect(ast.misiones).toHaveLength(1);

    const mision = ast.misiones[0];
    expect(mision.type).toBe("mision");
    expect(mision.nombre).toBe('"vuelo_simple"');

    const cmds = mision.bloque.cmds;
    expect(cmds).toHaveLength(2);

    const cmdDespegar = cmds[0] as DespecarNode;
    expect(cmdDespegar.type).toBe("despegar");
    expect(cmdDespegar.altitud).toBe("50");
    expect(cmdDespegar.unidad).toBe("m");

    const cmdAterrizar = cmds[1] as AterrizarNode;
    expect(cmdAterrizar.type).toBe("aterrizar");
  });

  it("debe parsear comandos de movimiento con opciones (unidad, velocidad)", () => {
    const code = `
      MISION "test_movimiento"
        MOVER norte 100 m VELOCIDAD 10
        MOVER sur 50 m
        MOVER este 80 VELOCIDAD 5
        MOVER oeste 30
        MOVER BASE
      FIN
    `;
    const { tokens } = tokenize(code);
    const { ast, errors } = parse(tokens);

    expect(errors).toHaveLength(0);
    const cmds = ast.misiones[0].bloque.cmds;
    expect(cmds).toHaveLength(5);

    // MOVER norte 100 m VELOCIDAD 10
    const cmd1 = cmds[0] as MoverNode;
    expect(cmd1.type).toBe("mover");
    expect(cmd1.modo).toBe("direccion");
    expect(cmd1.direccion).toBe("norte");
    expect(cmd1.distancia).toBe("100");
    expect(cmd1.unidad).toBe("m");
    expect(cmd1.velocidad).toBe("10");

    // MOVER sur 50 m
    const cmd2 = cmds[1] as MoverNode;
    expect(cmd2.type).toBe("mover");
    expect(cmd2.modo).toBe("direccion");
    expect(cmd2.direccion).toBe("sur");
    expect(cmd2.distancia).toBe("50");
    expect(cmd2.unidad).toBe("m");
    expect(cmd2.velocidad).toBeNull();

    // MOVER este 80 VELOCIDAD 5
    const cmd3 = cmds[2] as MoverNode;
    expect(cmd3.type).toBe("mover");
    expect(cmd3.modo).toBe("direccion");
    expect(cmd3.direccion).toBe("este");
    expect(cmd3.distancia).toBe("80");
    expect(cmd3.unidad).toBeNull();
    expect(cmd3.velocidad).toBe("5");

    // MOVER oeste 30
    const cmd4 = cmds[3] as MoverNode;
    expect(cmd4.type).toBe("mover");
    expect(cmd4.modo).toBe("direccion");
    expect(cmd4.direccion).toBe("oeste");
    expect(cmd4.distancia).toBe("30");
    expect(cmd4.unidad).toBeNull();
    expect(cmd4.velocidad).toBeNull();

    // MOVER BASE
    const cmd5 = cmds[4] as MoverNode;
    expect(cmd5.type).toBe("mover");
    expect(cmd5.modo).toBe("base");
  });

  it("debe parsear comandos de sensor y condicionales", () => {
    const code = `
      MISION "sensor_y_si"
        SENSOR temperatura FRECUENCIA 5 s
        SI bateria < 20 ENTONCES
          ATERRIZAR
        FIN
      FIN
    `;
    const { tokens } = tokenize(code);
    const { ast, errors } = parse(tokens);

    expect(errors).toHaveLength(0);
    const cmds = ast.misiones[0].bloque.cmds;
    expect(cmds).toHaveLength(2);

    // SENSOR temperatura FRECUENCIA 5 s
    const cmdSensor = cmds[0] as SensorNode;
    expect(cmdSensor.type).toBe("sensor");
    expect(cmdSensor.sensor).toBe("temperatura");
    expect(cmdSensor.frecuencia).toBe("5");
    expect(cmdSensor.unidad).toBe("s");

    // SI bateria < 20 ENTONCES ATERRIZAR FIN
    const cmdSi = cmds[1] as CondicionalNode;
    expect(cmdSi.type).toBe("condicional");
    expect(cmdSi.variable).toBe("bateria");
    expect(cmdSi.op).toBe("<");
    expect(cmdSi.valor).toBe("20");
    expect(cmdSi.cmd.type).toBe("aterrizar");
  });

  it("debe capturar errores cuando falta la palabra clave MISION al inicio", () => {
    const code = `
      "sin_mision"
        DESPEGAR ALTITUD 50
      FIN
    `;
    const { tokens } = tokenize(code);
    const { errors } = parse(tokens);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("se esperaba el inicio de una misión ('MISION')");
  });

  it("debe capturar errores cuando falta el nombre de la misión", () => {
    const code = `
      MISION
        DESPEGAR ALTITUD 50
      FIN
    `;
    const { tokens } = tokenize(code);
    const { errors } = parse(tokens);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("se esperaba STRING");
  });

  it("debe capturar errores cuando falta la palabra clave FIN", () => {
    const code = `
      MISION "sin_fin"
        DESPEGAR ALTITUD 50
    `;
    const { tokens } = tokenize(code);
    const { errors } = parse(tokens);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(err => err.message.includes("se esperaba 'FIN'"))).toBe(true);
  });

  it("debe capturar errores cuando la dirección del movimiento es inválida", () => {
    const code = `
      MISION "direccion_invalida"
        MOVER mi_casa 100
      FIN
    `;
    const { tokens } = tokenize(code);
    const { errors } = parse(tokens);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("se esperaba una dirección (como norte, sur, este, oeste, etc.)");
  });

  it("debe capturar errores cuando el tipo de sensor es inválido", () => {
    const code = `
      MISION "sensor_invalido"
        SENSOR luz FRECUENCIA 10 s
      FIN
    `;
    const { tokens } = tokenize(code);
    const { errors } = parse(tokens);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("se esperaba un tipo de sensor (como temperatura, bateria, altura, etc.)");
  });

  it("debe capturar errores de comandos no reconocidos e insertar un nodo error", () => {
    const code = `
      MISION "comando_invalido"
        SI bateria < 20 ENTONCES
          GIRAR izquierda 90
        FIN
      FIN
    `;
    const { tokens } = tokenize(code);
    const { ast, errors } = parse(tokens);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("token inesperado");

    const cmds = ast.misiones[0].bloque.cmds;
    expect(cmds).toHaveLength(1);
    const cmdSi = cmds[0] as CondicionalNode;
    expect(cmdSi.type).toBe("condicional");
    expect(cmdSi.cmd.type).toBe("error");
  });
});
