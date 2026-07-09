/**
 * Ejecutor de pruebas de integración para DroneScript.
 * Lee los casos de prueba de `tests/cases.json` y ejecuta el pipeline completo.
 *
 * Para ejecutar estas pruebas de integración:
 * - Comando: pnpm test:integration
 */

import fs from "node:fs";
import path from "node:path";
import { tokenize, parse } from "@dronescript/core";

// Colores ANSI para la consola
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

interface TestCaseExpected {
  errorCount: number;
  tokenCount?: number;
  misionNombre?: string;
  commandCount?: number;
  errorMessageContains?: string;
}

interface TestCase {
  name: string;
  code: string;
  expected: TestCaseExpected;
}

function run() {
  console.log(
    `${CYAN}====================================================${RESET}`,
  );
  console.log(
    `${CYAN}   Ejecutor de Pruebas de Integración DroneScript   ${RESET}`,
  );
  console.log(
    `${CYAN}====================================================${RESET}\n`,
  );

  const casesPath = path.resolve(process.cwd(), "tests/cases.json");
  if (!fs.existsSync(casesPath)) {
    console.error(
      `${RED}Error: No se encontró el archivo de casos en ${casesPath}${RESET}`,
    );
    process.exit(1);
  }

  const fileContent = fs.readFileSync(casesPath, "utf-8");
  const testCases: TestCase[] = JSON.parse(fileContent);

  let passedTests = 0;
  let failedTests = 0;

  testCases.forEach((tc, idx) => {
    console.log(`${BLUE}Caso #${idx + 1}: ${tc.name}${RESET}`);
    console.log(
      `Código de entrada:\n${YELLOW}----------------------------------------\n${tc.code.trim()}\n----------------------------------------${RESET}`,
    );

    // Ejecutar compilador (Lexer + Parser)
    const lexResult = tokenize(tc.code);
    const parseResult = parse(lexResult.tokens);
    const errors = [...lexResult.errors, ...parseResult.errors];

    let caseFailed = false;
    const failureReasons: string[] = [];

    // 1. Validar cantidad de errores
    if (errors.length !== tc.expected.errorCount) {
      caseFailed = true;
      failureReasons.push(
        `Errores esperados: ${tc.expected.errorCount}, Errores obtenidos: ${errors.length} (${errors.map((e) => e.message).join(", ")})`,
      );
    }

    // 2. Validar mensaje de error específico si se espera
    if (tc.expected.errorMessageContains) {
      const match = errors.some((e) =>
        e.message
          .toLowerCase()
          .includes(tc.expected.errorMessageContains!.toLowerCase()),
      );
      if (!match) {
        caseFailed = true;
        failureReasons.push(
          `Se esperaba que el error contuviera "${tc.expected.errorMessageContains}", pero los errores fueron: [${errors.map((e) => e.message).join(" | ")}]`,
        );
      }
    }

    // 3. Validar cantidad de tokens
    if (
      tc.expected.tokenCount !== undefined &&
      lexResult.tokens.length !== tc.expected.tokenCount
    ) {
      caseFailed = true;
      failureReasons.push(
        `Cantidad de tokens esperados: ${tc.expected.tokenCount}, obtenidos: ${lexResult.tokens.length}`,
      );
    }

    // 4. Validar estructura AST si no hay errores
    if (tc.expected.errorCount === 0) {
      const mision = parseResult.ast.misiones[0];

      // Validar nombre de la misión
      if (
        tc.expected.misionNombre !== undefined &&
        mision?.nombre !== tc.expected.misionNombre
      ) {
        caseFailed = true;
        failureReasons.push(
          `Nombre de misión esperado: ${tc.expected.misionNombre}, obtenido: ${mision?.nombre}`,
        );
      }

      // Validar cantidad de comandos en la misión
      if (
        tc.expected.commandCount !== undefined &&
        mision?.bloque?.cmds?.length !== tc.expected.commandCount
      ) {
        caseFailed = true;
        failureReasons.push(
          `Cantidad de comandos esperados: ${tc.expected.commandCount}, obtenidos: ${mision?.bloque?.cmds?.length}`,
        );
      }
    }

    if (caseFailed) {
      failedTests++;
      console.log(`${RED}❌ FALLÓ${RESET}`);
      failureReasons.forEach((reason) => console.log(`   - ${reason}`));
    } else {
      passedTests++;
      console.log(`${GREEN}✔ PASÓ${RESET}`);
      if (errors.length === 0) {
        console.log(
          `   AST generado con éxito (misión: ${parseResult.ast.misiones[0].nombre}, comandos: ${parseResult.ast.misiones[0].bloque.cmds.length})`,
        );
      } else {
        console.log(`   Errores esperados capturados con éxito.`);
      }
    }
    console.log();
  });

  console.log(
    `${CYAN}====================================================${RESET}`,
  );
  console.log(
    `Resultados: ${GREEN}${passedTests} Pasados${RESET}, ${failedTests > 0 ? RED : GREEN}${failedTests} Fallados${RESET}`,
  );
  console.log(
    `${CYAN}====================================================${RESET}`,
  );

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
