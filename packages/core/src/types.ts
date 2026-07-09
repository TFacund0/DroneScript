// ─── TIPOS COMPARTIDOS DE DRONESCRIPT ────────────────────────────────────────

// ── Lexer ────────────────────────────────────────────────────────────────────

export type TokenType =
  "KEYWORD" | "STRING" | "NUMBER" | "UNIT" | "IDENT" | "OP" | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
  subtype?: "direccion" | "sensor";
}

export interface LexError {
  message: string;
  line: number;
  col: number;
}

export interface LexResult {
  tokens: Token[];
  errors: LexError[];
}

// ── AST ──────────────────────────────────────────────────────────────────────

export interface ProgramaNode {
  type: "programa";
  misiones: MisionNode[];
}

export interface MisionNode {
  type: "mision";
  nombre: string;
  bloque: BloqueNode;
  line: number;
}

export interface BloqueNode {
  type: "bloque";
  cmds: CmdNode[];
}

export type CmdNode =
  | DespegarNode
  | MoverNode
  | AterrizarNode
  | SensorNode
  | CondicionalNode
  | ErrorNode;

export interface DespegarNode {
  type: "despegar";
  altitud: number;
  unidad: string | null;
  line: number;
}

export interface MoverNode {
  type: "mover";
  modo: "base" | "direccion";
  direccion?: string;
  distancia?: number;
  unidad?: string | null;
  velocidad?: number | null;
  line: number;
}

export interface AterrizarNode {
  type: "aterrizar";
  line: number;
}

export interface SensorNode {
  type: "sensor";
  sensor: string;
  frecuencia: number;
  unidad: string | null;
  line: number;
}

export interface CondicionalNode {
  type: "condicional";
  variable: string;
  op: string;
  valor: number;
  cmd: CmdNode;
  line: number;
}

export interface ErrorNode {
  type: "error";
  line: number;
}

// ── Parser ───────────────────────────────────────────────────────────────────

export interface ParseError {
  message: string;
  line: number;
  col?: number;
}

export interface ParseResult {
  ast: ProgramaNode;
  errors: ParseError[];
}

// ── Semantic ─────────────────────────────────────────────────────────────────

export interface SemanticError {
  message: string;
  line: number;
  col?: number;
  severity: "error" | "warning";
}

// ── Pipeline completo ────────────────────────────────────────────────────────

export interface AnalyzerResult {
  tokens: Token[];
  ast: ProgramaNode;
  errors: Array<LexError | ParseError | SemanticError>;
  warnings: SemanticError[];
}
