import type {
  Token,
  ParseError,
  ParseResult,
  ProgramaNode,
  MisionNode,
  BloqueNode,
  CmdNode,
  DespecarNode,
  MoverNode,
  AterrizarNode,
  SensorNode,
  CondicionalNode,
  ErrorNode,
} from "../types";

/**
 * Analizador sintáctico (Parser) para el lenguaje DroneScript.
 * Se encarga de procesar la secuencia de tokens y construir el Árbol Sintáctico Abstracto (AST).
 */
export class Parser {
  private listaTokens: Token[];
  private posicionActual = 0;
  private errores: ParseError[] = [];

  constructor(tokens: Token[]) {
    this.listaTokens = tokens;
  }

  /**
   * Devuelve el token actual bajo análisis sin avanzar de posición.
   */
  private peek(): Token {
    return (
      this.listaTokens[this.posicionActual] || {
        type: "EOF",
        value: "",
        line: 0,
        col: 0,
      }
    );
  }

  /**
   * Valida y consume el token actual si coincide con el tipo y/o valor esperado.
   * Avanza la posición del cursor de lectura y reporta un error si no coincide.
   */
  private consume(
    tipoEsperado: string,
    valorEsperado: string | null = null,
  ): Token {
    const tokenActual = this.peek();
    if (
      tokenActual.type === tipoEsperado &&
      (valorEsperado === null || tokenActual.value === valorEsperado)
    ) {
      this.posicionActual++;
      return tokenActual;
    }
    const esperado = valorEsperado ? `'${valorEsperado}'` : tipoEsperado;
    const encontrado = tokenActual.value
      ? `'${tokenActual.value}'`
      : tokenActual.type;
    this.errores.push({
      message: `Error sintáctico en línea ${tokenActual.line}: se esperaba ${esperado} pero se encontró ${encontrado}`,
      line: tokenActual.line,
      col: tokenActual.col,
    });
    // Estrategia de recuperación por inserción virtual:
    // No incrementamos la posicionActual para que el token real no sea descartado
    // y pueda ser analizado por la siguiente llamada a consume.
    return {
      type: tipoEsperado as any,
      value: valorEsperado || "",
      line: tokenActual.line,
      col: tokenActual.col,
    };
  }

  /**
   * Comprueba si el token actual es una palabra clave con el valor especificado.
   */
  private isKeyword(valor: string): boolean {
    const token = this.peek();
    return token.type === "KEYWORD" && token.value === valor;
  }

  /**
   * Ejecuta el análisis sintáctico completo sobre la secuencia de tokens.
   * @returns Un objeto conteniendo el nodo raíz del AST y la lista de errores sintácticos.
   */
  public parse(): ParseResult {
    this.posicionActual = 0;
    this.errores = [];
    const ast = this.parsePrograma();
    return { ast, errors: this.errores };
  }

  /**
   * Regla: programa → mision lista_misiones
   * Procesa la lista completa de misiones del programa.
   */
  private parsePrograma(): ProgramaNode {
    const nodoPrograma: ProgramaNode = { type: "programa", misiones: [] };
    if (!this.isKeyword("MISION")) {
      const token = this.peek();
      this.errores.push({
        message: `Error sintáctico en línea ${token.line}: se esperaba el inicio de una misión ('MISION')`,
        line: token.line,
        col: token.col,
      });
    }
    while (this.isKeyword("MISION")) {
      nodoPrograma.misiones.push(this.parseMision());
    }
    if (this.peek().type !== "EOF") {
      const token = this.peek();
      this.errores.push({
        message: `Error sintáctico en línea ${token.line}: token inesperado '${token.value}' fuera de una misión`,
        line: token.line,
        col: token.col,
      });
    }
    return nodoPrograma;
  }

  /**
   * Regla: mision → MISION STRING bloque FIN
   * Parsea una misión individual delimitada por las palabras clave MISION y FIN.
   */
  private parseMision(): MisionNode {
    const tokenMision = this.consume("KEYWORD", "MISION");
    const nombreMision = this.consume("STRING");
    const bloqueMision = this.parseBloque();
    this.consume("KEYWORD", "FIN");
    return {
      type: "mision",
      nombre: nombreMision.value,
      bloque: bloqueMision,
      line: tokenMision.line,
    };
  }

  /**
   * Regla: bloque → cmd bloque | λ
   * Parsea una lista secuencial de comandos dentro de una misión.
   */
  private parseBloque(): BloqueNode {
    const comandos: CmdNode[] = [];
    while (
      this.isKeyword("DESPEGAR") ||
      this.isKeyword("MOVER") ||
      this.isKeyword("ATERRIZAR") ||
      this.isKeyword("SENSOR") ||
      this.isKeyword("SI")
    ) {
      comandos.push(this.parseCmd());
    }
    return { type: "bloque", cmds: comandos };
  }

  /**
   * Regla: cmd → despegar | mover | aterrizar | sensor_cmd | condicional
   * Deriva el parser hacia la subregla del comando correspondiente.
   */
  private parseCmd(): CmdNode {
    if (this.isKeyword("DESPEGAR")) return this.parseDespegar();
    if (this.isKeyword("MOVER")) return this.parseMover();
    if (this.isKeyword("ATERRIZAR")) return this.parseAterrizar();
    if (this.isKeyword("SENSOR")) return this.parseSensorCmd();
    if (this.isKeyword("SI")) return this.parseCondicional();

    const tokenInesperado = this.peek();
    this.errores.push({
      message: `Error sintáctico en línea ${tokenInesperado.line}: token inesperado '${tokenInesperado.value}'`,
      line: tokenInesperado.line,
      col: tokenInesperado.col,
    });
    this.posicionActual++;
    return { type: "error", line: tokenInesperado.line } as ErrorNode;
  }

  /**
   * Regla: despegar → DESPEGAR ALTITUD NUMBER unidad_opcional
   * Parsea la instrucción para elevar el dron.
   */
  private parseDespegar(): DespecarNode {
    const tokenDespegar = this.consume("KEYWORD", "DESPEGAR");
    this.consume("KEYWORD", "ALTITUD");
    const tokenNumero = this.consume("NUMBER");
    const unidadOpcional = this.parseUnidadOpcional();
    return {
      type: "despegar",
      altitud: tokenNumero.value,
      unidad: unidadOpcional,
      line: tokenDespegar.line,
    };
  }

  /**
   * Regla: mover → MOVER movimiento | MOVER BASE
   * Parsea la instrucción de movimiento espacial o retorno a base.
   */
  private parseMover(): MoverNode {
    const tokenMover = this.consume("KEYWORD", "MOVER");
    if (this.isKeyword("BASE")) {
      this.consume("KEYWORD", "BASE");
      return { type: "mover", modo: "base", line: tokenMover.line };
    }
    const tokenDireccion = this.consume("IDENT");
    if (
      tokenDireccion.type === "IDENT" &&
      tokenDireccion.subtype !== "direccion"
    ) {
      this.errores.push({
        message: `Error sintáctico en línea ${tokenDireccion.line}: se esperaba una dirección (como norte, sur, este, oeste, etc.) pero se encontró '${tokenDireccion.value}'`,
        line: tokenDireccion.line,
        col: tokenDireccion.col,
      });
    }
    const tokenDistancia = this.consume("NUMBER");
    const unidadOpcional = this.parseUnidadOpcional();
    const velocidadOpcional = this.parseVelocidadOpcional();
    return {
      type: "mover",
      modo: "direccion",
      direccion: tokenDireccion.value,
      distancia: tokenDistancia.value,
      unidad: unidadOpcional,
      velocidad: velocidadOpcional,
      line: tokenMover.line,
    };
  }

  /**
   * Regla: aterrizar → ATERRIZAR
   * Parsea el comando para posar al dron sobre tierra.
   */
  private parseAterrizar(): AterrizarNode {
    const tokenAterrizar = this.consume("KEYWORD", "ATERRIZAR");
    return { type: "aterrizar", line: tokenAterrizar.line };
  }

  /**
   * Regla: sensor_cmd → SENSOR tipo_sensor FRECUENCIA NUMBER unidad_opcional
   * Parsea la configuración de frecuencia de monitoreo de sensores.
   */
  private parseSensorCmd(): SensorNode {
    const tokenSensor = this.consume("KEYWORD", "SENSOR");
    const tokenTipoSensor = this.consume("IDENT");
    if (
      tokenTipoSensor.type === "IDENT" &&
      tokenTipoSensor.subtype !== "sensor"
    ) {
      this.errores.push({
        message: `Error sintáctico en línea ${tokenTipoSensor.line}: se esperaba un tipo de sensor (como temperatura, bateria, altura, etc.) pero se encontró '${tokenTipoSensor.value}'`,
        line: tokenTipoSensor.line,
        col: tokenTipoSensor.col,
      });
    }
    this.consume("KEYWORD", "FRECUENCIA");
    const tokenFrecuencia = this.consume("NUMBER");
    const unidadOpcional = this.parseUnidadOpcional();
    return {
      type: "sensor",
      sensor: tokenTipoSensor.value,
      frecuencia: tokenFrecuencia.value,
      unidad: unidadOpcional,
      line: tokenSensor.line,
    };
  }

  /**
   * Regla: condicional → SI IDENT op NUMBER ENTONCES cmd FIN
   * Parsea comandos condicionales reactivos.
   */
  private parseCondicional(): CondicionalNode {
    const tokenSi = this.consume("KEYWORD", "SI");
    const tokenVariable = this.consume("IDENT");
    const tokenOperador = this.consume("OP");
    const tokenValor = this.consume("NUMBER");
    this.consume("KEYWORD", "ENTONCES");
    const comandoCondicional = this.parseCmd();
    this.consume("KEYWORD", "FIN");
    return {
      type: "condicional",
      variable: tokenVariable.value,
      op: tokenOperador.value,
      valor: tokenValor.value,
      cmd: comandoCondicional,
      line: tokenSi.line,
    };
  }

  /**
   * Regla: unidad_opcional → UNIT | λ
   * Obtiene la unidad de medida si se encuentra presente.
   */
  private parseUnidadOpcional(): string | null {
    if (this.peek().type === "UNIT") return this.consume("UNIT").value;
    return null;
  }

  /**
   * Regla: velocidad_opcional → VELOCIDAD NUMBER | λ
   * Obtiene el valor opcional de velocidad.
   */
  private parseVelocidadOpcional(): string | null {
    if (this.isKeyword("VELOCIDAD")) {
      this.consume("KEYWORD", "VELOCIDAD");
      return this.consume("NUMBER").value;
    }
    return null;
  }
}

/**
 * Función puente compatible con el frontend para procesar tokens y generar el AST.
 */
export function parse(tokens: Token[]): ParseResult {
  return new Parser(tokens).parse();
}
