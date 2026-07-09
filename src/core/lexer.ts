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

/**
 * Analizador léxico (Lexer) para el lenguaje DroneScript.
 * Se encarga de transformar el código fuente en una secuencia de tokens.
 */
export class Lexer {
  private codigoFuente: string;
  private indiceActual = 0;
  private lineaActual = 1;
  private inicioLinea = 0;
  private tokens: Token[] = [];
  private errores: LexError[] = [];

  constructor(codigoFuente: string) {
    this.codigoFuente = codigoFuente;
  }

  /**
   * Obtiene el número de columna actual en base al índice de lectura.
   */
  private obtenerColumna(): number {
    return this.indiceActual - this.inicioLinea + 1;
  }

  /**
   * Ejecuta el análisis léxico completo sobre el código fuente.
   * @returns Un objeto conteniendo los tokens generados y los errores léxicos encontrados.
   */
  public tokenize(): LexResult {
    this.indiceActual = 0;
    this.lineaActual = 1;
    this.inicioLinea = 0;
    this.tokens = [];
    this.errores = [];

    while (this.indiceActual < this.codigoFuente.length) {
      const caracterActual = this.codigoFuente[this.indiceActual];

      if (caracterActual === "\n") {
        this.lineaActual++;
        this.inicioLinea = this.indiceActual + 1;
        this.indiceActual++;
        continue;
      }
      if (
        caracterActual === " " ||
        caracterActual === "\t" ||
        caracterActual === "\r"
      ) {
        this.indiceActual++;
        continue;
      }
      if (caracterActual === "#") {
        this.omitirComentario();
        continue;
      }
      if (caracterActual === '"') {
        this.leerString();
        continue;
      }
      if (/[0-9]/.test(caracterActual)) {
        this.leerNumero();
        continue;
      }
      if (
        caracterActual === "<" ||
        caracterActual === ">" ||
        caracterActual === "="
      ) {
        this.leerOperador();
        continue;
      }
      if (/[a-zA-Z_]/.test(caracterActual)) {
        this.leerIdentificadorOPalabraClave();
        continue;
      }
      if (caracterActual === "%") {
        this.tokens.push({
          type: "UNIT",
          value: "%",
          line: this.lineaActual,
          col: this.obtenerColumna(),
        });
        this.indiceActual++;
        continue;
      }

      this.errores.push({
        message: `Carácter no reconocido '${caracterActual}' en línea ${this.lineaActual}, col ${this.obtenerColumna()}`,
        line: this.lineaActual,
        col: this.obtenerColumna(),
      });
      this.indiceActual++;
    }

    this.tokens.push({
      type: "EOF",
      value: "",
      line: this.lineaActual,
      col: this.codigoFuente.length - this.inicioLinea + 1,
    });

    return { tokens: this.tokens, errors: this.errores };
  }

  /**
   * Omitir el comentario de una sola línea (iniciado con #).
   */
  private omitirComentario(): void {
    while (
      this.indiceActual < this.codigoFuente.length &&
      this.codigoFuente[this.indiceActual] !== "\n"
    ) {
      this.indiceActual++;
    }
  }

  /**
   * Lee y genera un token de tipo STRING literal.
   */
  private leerString(): void {
    const columnaInicio = this.obtenerColumna();
    let textoString = "";
    this.indiceActual++; // saltar comilla inicial
    while (
      this.indiceActual < this.codigoFuente.length &&
      this.codigoFuente[this.indiceActual] !== '"' &&
      this.codigoFuente[this.indiceActual] !== "\n"
    ) {
      textoString += this.codigoFuente[this.indiceActual++];
    }
    if (this.codigoFuente[this.indiceActual] === '"') {
      this.indiceActual++;
      this.tokens.push({
        type: "STRING",
        value: `"${textoString}"`,
        line: this.lineaActual,
        col: columnaInicio,
      });
    } else {
      this.errores.push({
        message: `String sin cerrar en línea ${this.lineaActual}, col ${columnaInicio}`,
        line: this.lineaActual,
        col: columnaInicio,
      });
    }
  }

  /**
   * Lee y genera un token de tipo NUMBER.
   */
  private leerNumero(): void {
    const columnaInicio = this.obtenerColumna();
    let textoNumero = "";
    while (
      this.indiceActual < this.codigoFuente.length &&
      /[0-9.]/.test(this.codigoFuente[this.indiceActual])
    ) {
      textoNumero += this.codigoFuente[this.indiceActual++];
    }
    this.tokens.push({
      type: "NUMBER",
      value: textoNumero,
      line: this.lineaActual,
      col: columnaInicio,
    });
  }

  /**
   * Lee y genera un token de tipo OP (operador de comparación).
   */
  private leerOperador(): void {
    const columnaInicio = this.obtenerColumna();
    const caracter = this.codigoFuente[this.indiceActual];
    let operador = caracter;

    if (
      this.codigoFuente[this.indiceActual + 1] === "=" &&
      (caracter === "<" || caracter === ">" || caracter === "=")
    ) {
      operador += "=";
      this.indiceActual++;
    }

    if (["<", ">", "<=", ">=", "=="].includes(operador)) {
      this.tokens.push({
        type: "OP",
        value: operador,
        line: this.lineaActual,
        col: columnaInicio,
      });
      this.indiceActual++;
    } else {
      this.errores.push({
        message: `Carácter no reconocido '${caracter}' en línea ${this.lineaActual}, col ${columnaInicio}`,
        line: this.lineaActual,
        col: columnaInicio,
      });
      this.indiceActual++;
    }
  }

  /**
   * Lee y genera un token de tipo KEYWORD, UNIT o IDENT (incluyendo direcciones y sensores).
   */
  private leerIdentificadorOPalabraClave(): void {
    const columnaInicio = this.obtenerColumna();
    let palabra = "";
    while (
      this.indiceActual < this.codigoFuente.length &&
      /[a-zA-Z_]/.test(this.codigoFuente[this.indiceActual])
    ) {
      palabra += this.codigoFuente[this.indiceActual++];
    }

    if (palabra === "m" || palabra === "km" || palabra === "s") {
      this.tokens.push({
        type: "UNIT",
        value: palabra,
        line: this.lineaActual,
        col: columnaInicio,
      });
      return;
    }

    if (KEYWORDS.has(palabra)) {
      this.tokens.push({
        type: "KEYWORD",
        value: palabra,
        line: this.lineaActual,
        col: columnaInicio,
      });
    } else if (DIRECTIONS.has(palabra.toLowerCase())) {
      this.tokens.push({
        type: "IDENT",
        subtype: "direccion",
        value: palabra.toLowerCase(),
        line: this.lineaActual,
        col: columnaInicio,
      });
    } else if (SENSORS.has(palabra.toLowerCase())) {
      this.tokens.push({
        type: "IDENT",
        subtype: "sensor",
        value: palabra.toLowerCase(),
        line: this.lineaActual,
        col: columnaInicio,
      });
    } else {
      this.tokens.push({
        type: "IDENT",
        value: palabra,
        line: this.lineaActual,
        col: columnaInicio,
      });
    }
  }
}

/**
 * Función puente compatible con el frontend para tokenizar el código fuente.
 */
export function tokenize(source: string): LexResult {
  return new Lexer(source).tokenize();
}
