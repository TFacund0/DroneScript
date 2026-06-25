import type { TokenType } from "../types";

export const TOKEN_COLORS: Record<
  TokenType,
  { bg: string; text: string; label: string }
> = {
  KEYWORD: { bg: "#1e3a5f", text: "#60a5fa", label: "Palabra reservada" },
  STRING: { bg: "#1a3a2a", text: "#4ade80", label: "Cadena" },
  NUMBER: { bg: "#3a2a1a", text: "#fb923c", label: "Número" },
  UNIT: { bg: "#2a1a3a", text: "#c084fc", label: "Unidad" },
  IDENT: { bg: "#1a2a3a", text: "#38bdf8", label: "Identificador" },
  OP: { bg: "#3a1a1a", text: "#f87171", label: "Operador" },
  EOF: { bg: "#1a1a1a", text: "#6b7280", label: "EOF" },
};
