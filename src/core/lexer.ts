import type { Token, LexError, LexResult } from "../types";

const KEYWORDS = new Set([
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
]);
const DIRECTIONS = new Set([
  "norte",
  "sur",
  "este",
  "oeste",
  "noreste",
  "noroeste",
  "sureste",
  "suroeste",
  "arriba",
  "abajo",
]);
const SENSORS = new Set([
  "temperatura",
  "bateria",
  "altura",
  "velocidad",
  "viento",
]);

export function tokenize(source: string): LexResult {
  const tokens: Token[] = [];
  const errors: LexError[] = [];
  let i = 0,
    line = 1,
    lineStart = 0;

  while (i < source.length) {
    const col = i - lineStart + 1;
    const ch = source[i];

    if (ch === "\n") {
      line++;
      lineStart = i + 1;
      i++;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\r") {
      i++;
      continue;
    }
    if (ch === "#") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }

    if (ch === '"') {
      let str = "";
      i++;
      const startCol = col;
      while (i < source.length && source[i] !== '"' && source[i] !== "\n")
        str += source[i++];
      if (source[i] === '"') {
        i++;
        tokens.push({ type: "STRING", value: `"${str}"`, line, col: startCol });
      } else
        errors.push({
          message: `String sin cerrar en línea ${line}, col ${startCol}`,
          line,
          col: startCol,
        });
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let num = "";
      const startCol = col;
      while (i < source.length && /[0-9.]/.test(source[i])) num += source[i++];
      tokens.push({ type: "NUMBER", value: num, line, col: startCol });
      continue;
    }

    if (ch === "<" || ch === ">" || ch === "=") {
      const startCol = col;
      let op = ch;
      if (source[i + 1] === "=" && (ch === "<" || ch === ">" || ch === "=")) {
        op += "=";
        i++;
      }
      if (["<", ">", "<=", ">=", "=="].includes(op)) {
        tokens.push({ type: "OP", value: op, line, col: startCol });
        i++;
        continue;
      }
    }

    if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ_]/.test(ch)) {
      let word = "";
      const startCol = col;
      while (i < source.length && /[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]/.test(source[i]))
        word += source[i++];
      if (word === "m" || word === "km" || word === "s") {
        tokens.push({ type: "UNIT", value: word, line, col: startCol });
        continue;
      }
      if (KEYWORDS.has(word))
        tokens.push({ type: "KEYWORD", value: word, line, col: startCol });
      else if (DIRECTIONS.has(word.toLowerCase()))
        tokens.push({
          type: "IDENT",
          subtype: "direccion",
          value: word.toLowerCase(),
          line,
          col: startCol,
        });
      else if (SENSORS.has(word.toLowerCase()))
        tokens.push({
          type: "IDENT",
          subtype: "sensor",
          value: word.toLowerCase(),
          line,
          col: startCol,
        });
      else tokens.push({ type: "IDENT", value: word, line, col: startCol });
      continue;
    }

    if (ch === "%") {
      tokens.push({ type: "UNIT", value: "%", line, col });
      i++;
      continue;
    }
    errors.push({
      message: `Carácter no reconocido '${ch}' en línea ${line}, col ${col}`,
      line,
      col,
    });
    i++;
  }

  tokens.push({
    type: "EOF",
    value: "",
    line,
    col: source.length - lineStart + 1,
  });
  return { tokens, errors };
}
