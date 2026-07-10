import { readFileSync } from "node:fs";
import process from "node:process";
import { analyze } from "@dronescript/core";

// ─── CLI DE DRONESCRIPT ──────────────────────────────────────────────────────
// Uso: dronescript check <archivo.ds>
// Corre el pipeline completo (léxico → sintáctico → semántico) y reporta
// errores y advertencias. Sale con código 1 si hay errores, 0 si no.

const ROJO = "\x1b[31m";
const AMARILLO = "\x1b[33m";
const VERDE = "\x1b[32m";
const GRIS = "\x1b[90m";
const RESET = "\x1b[0m";

export interface CheckResult {
  exitCode: 0 | 1 | 2;
  stdout: string[];
  stderr: string[];
}

export function usageText(): string {
  return `Uso: dronescript check <archivo.ds>

Comandos:
  check <archivo>   Valida la misión: análisis léxico, sintáctico y semántico`;
}

export function checkFile(
  archivo: string,
  readFile: (path: string) => string = (p) => readFileSync(p, "utf-8"),
): CheckResult {
  const stdout: string[] = [];
  const stderr: string[] = [];

  let codigo: string;
  try {
    codigo = readFile(archivo);
  } catch {
    stderr.push(
      `${ROJO}error:${RESET} no se pudo leer el archivo '${archivo}'`,
    );
    return { exitCode: 2, stdout, stderr };
  }

  const { tokens, errors, warnings } = analyze(codigo);

  for (const err of errors) {
    stderr.push(
      `${ROJO}error${RESET} ${GRIS}${archivo}:${err.line}${RESET} ${err.message}`,
    );
  }
  for (const warn of warnings) {
    stderr.push(
      `${AMARILLO}advertencia${RESET} ${GRIS}${archivo}:${warn.line}${RESET} ${warn.message}`,
    );
  }

  if (errors.length > 0) {
    stderr.push(
      `\n${ROJO}✗${RESET} ${errors.length} error${errors.length !== 1 ? "es" : ""}, ${warnings.length} advertencia${warnings.length !== 1 ? "s" : ""}`,
    );
    return { exitCode: 1, stdout, stderr };
  }

  const visibles = tokens.filter((t) => t.type !== "EOF").length;
  stdout.push(
    `${VERDE}✓${RESET} ${archivo} es una misión válida ${GRIS}(${visibles} tokens${warnings.length > 0 ? `, ${warnings.length} advertencia${warnings.length !== 1 ? "s" : ""}` : ""})${RESET}`,
  );
  return { exitCode: 0, stdout, stderr };
}

function main(): void {
  const [comando, archivo] = process.argv.slice(2);
  if (comando !== "check" || !archivo) {
    console.log(usageText());
    process.exit(2);
  }

  const { exitCode, stdout, stderr } = checkFile(archivo);
  for (const line of stdout) console.log(line);
  for (const line of stderr) console.error(line);
  process.exit(exitCode);
}

if (!process.env.VITEST) main();
