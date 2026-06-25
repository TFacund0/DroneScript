import type { Token, ParseError, ParseResult, ProgramaNode, MisionNode, BloqueNode, CmdNode, DespecarNode, MoverNode, AterrizarNode, SensorNode, CondicionalNode, ErrorNode } from '../types';

export function parse(tokens: Token[]): ParseResult {
  let pos = 0;
  const errors: ParseError[] = [];

  function peek(): Token { return tokens[pos] || { type: 'EOF', value: '', line: 0, col: 0 }; }

  function consume(expectedType: string, expectedValue: string | null = null): Token {
    const tok = peek();
    if (tok.type === expectedType && (expectedValue === null || tok.value === expectedValue)) { pos++; return tok; }
    const expected = expectedValue ? `'${expectedValue}'` : expectedType;
    const found = tok.value ? `'${tok.value}'` : tok.type;
    errors.push({ message: `Error sintáctico en línea ${tok.line}: se esperaba ${expected} pero se encontró ${found}`, line: tok.line, col: tok.col });
    pos++;
    return tok;
  }

  function isKeyword(value: string): boolean { const t = peek(); return t.type === 'KEYWORD' && t.value === value; }

  function parsePrograma(): ProgramaNode {
    const node: ProgramaNode = { type: 'programa', misiones: [] };
    while (isKeyword('MISION')) node.misiones.push(parseMision());
    if (peek().type !== 'EOF') {
      const tok = peek();
      errors.push({ message: `Error sintáctico en línea ${tok.line}: token inesperado '${tok.value}' fuera de una misión`, line: tok.line, col: tok.col });
    }
    return node;
  }

  function parseMision(): MisionNode {
    const tok = consume('KEYWORD', 'MISION');
    const nombre = consume('STRING');
    const bloque = parseBloque();
    consume('KEYWORD', 'FIN');
    return { type: 'mision', nombre: nombre.value, bloque, line: tok.line };
  }

  function parseBloque(): BloqueNode {
    const cmds: CmdNode[] = [];
    while (isKeyword('DESPEGAR') || isKeyword('MOVER') || isKeyword('ATERRIZAR') || isKeyword('SENSOR') || isKeyword('SI'))
      cmds.push(parseCmd());
    return { type: 'bloque', cmds };
  }

  function parseCmd(): CmdNode {
    if (isKeyword('DESPEGAR'))  return parseDespegar();
    if (isKeyword('MOVER'))     return parseMover();
    if (isKeyword('ATERRIZAR')) return parseAterrizar();
    if (isKeyword('SENSOR'))    return parseSensorCmd();
    if (isKeyword('SI'))        return parseCondicional();
    const tok = peek();
    errors.push({ message: `Error sintáctico en línea ${tok.line}: token inesperado '${tok.value}'`, line: tok.line, col: tok.col });
    pos++;
    return { type: 'error', line: tok.line } as ErrorNode;
  }

  function parseDespegar(): DespecarNode {
    const tok = consume('KEYWORD', 'DESPEGAR');
    consume('KEYWORD', 'ALTITUD');
    const numero = consume('NUMBER');
    const unidad = parseUnidadOpcional();
    return { type: 'despegar', altitud: numero.value, unidad, line: tok.line };
  }

  function parseMover(): MoverNode {
    const tok = consume('KEYWORD', 'MOVER');
    if (isKeyword('BASE')) { consume('KEYWORD', 'BASE'); return { type: 'mover', modo: 'base', line: tok.line }; }
    const dir = consume('IDENT');
    const distancia = consume('NUMBER');
    const unidad = parseUnidadOpcional();
    const velocidad = parseVelocidadOpcional();
    return { type: 'mover', modo: 'direccion', direccion: dir.value, distancia: distancia.value, unidad, velocidad, line: tok.line };
  }

  function parseAterrizar(): AterrizarNode {
    const tok = consume('KEYWORD', 'ATERRIZAR');
    return { type: 'aterrizar', line: tok.line };
  }

  function parseSensorCmd(): SensorNode {
    const tok = consume('KEYWORD', 'SENSOR');
    const tipoSensor = consume('IDENT');
    consume('KEYWORD', 'FRECUENCIA');
    const frecuencia = consume('NUMBER');
    const unidad = parseUnidadOpcional();
    return { type: 'sensor', sensor: tipoSensor.value, frecuencia: frecuencia.value, unidad, line: tok.line };
  }

  function parseCondicional(): CondicionalNode {
    const tok = consume('KEYWORD', 'SI');
    const variable = consume('IDENT');
    const op = consume('OP');
    const valor = consume('NUMBER');
    consume('KEYWORD', 'ENTONCES');
    const cmd = parseCmd();
    consume('KEYWORD', 'FIN');
    return { type: 'condicional', variable: variable.value, op: op.value, valor: valor.value, cmd, line: tok.line };
  }

  function parseUnidadOpcional(): string | null {
    if (peek().type === 'UNIT') return consume('UNIT').value;
    return null;
  }

  function parseVelocidadOpcional(): string | null {
    if (isKeyword('VELOCIDAD')) { consume('KEYWORD', 'VELOCIDAD'); return consume('NUMBER').value; }
    return null;
  }

  return { ast: parsePrograma(), errors };
}
