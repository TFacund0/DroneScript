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

function usage(): never {
  console.log(`Uso: dronescript check <archivo.ds>

Comandos:
  check <archivo>   Valida la misión: análisis léxico, sintáctico y semántico`);
  process.exit(2);
}

const [comando, archivo] = process.argv.slice(2);
if (comando !== "check" || !archivo) usage();

let codigo: string;
try {
  codigo = readFileSync(archivo, "utf-8");
} catch {
  console.error(
    `${ROJO}error:${RESET} no se pudo leer el archivo '${archivo}'`,
  );
  process.exit(2);
}

const { tokens, errors, warnings } = analyze(codigo);

for (const err of errors) {
  console.error(
    `${ROJO}error${RESET} ${GRIS}${archivo}:${err.line}${RESET} ${err.message}`,
  );
}
for (const warn of warnings) {
  console.warn(
    `${AMARILLO}advertencia${RESET} ${GRIS}${archivo}:${warn.line}${RESET} ${warn.message}`,
  );
}

if (errors.length > 0) {
  console.error(
    `\n${ROJO}✗${RESET} ${errors.length} error${errors.length !== 1 ? "es" : ""}, ${warnings.length} advertencia${warnings.length !== 1 ? "s" : ""}`,
  );
  process.exit(1);
}

const visibles = tokens.filter((t) => t.type !== "EOF").length;
console.log(
  `${VERDE}✓${RESET} ${archivo} es una misión válida ${GRIS}(${visibles} tokens${warnings.length > 0 ? `, ${warnings.length} advertencia${warnings.length !== 1 ? "s" : ""}` : ""})${RESET}`,
);
