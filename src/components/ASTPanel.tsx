import { useState } from "react";
import type {
  AnalyzerResult,
  ProgramaNode,
  MisionNode,
  BloqueNode,
  CmdNode,
} from "../types";

type ASTNodeType = ProgramaNode | MisionNode | BloqueNode | CmdNode;

interface NodeStyle {
  bg: string;
  color: string;
  border: string;
}

const NODE_STYLES: Record<string, NodeStyle> = {
  programa: { bg: "#00e5a015", color: "#00e5a0", border: "#00e5a030" },
  mision: { bg: "#4d9eff15", color: "#4d9eff", border: "#4d9eff30" },
  bloque: { bg: "#c084fc15", color: "#c084fc", border: "#c084fc30" },
  despegar: { bg: "#c084fc15", color: "#c084fc", border: "#c084fc30" },
  mover: { bg: "#c084fc15", color: "#c084fc", border: "#c084fc30" },
  aterrizar: { bg: "#c084fc15", color: "#c084fc", border: "#c084fc30" },
  sensor: { bg: "#ffd16615", color: "#ffd166", border: "#ffd16630" },
  condicional: { bg: "#ff6b3515", color: "#ff6b35", border: "#ff6b3530" },
  error: { bg: "#ff3d5a15", color: "#ff3d5a", border: "#ff3d5a30" },
};

function getLabel(node: ASTNodeType): string {
  switch (node.type) {
    case "programa":
      return "programa";
    case "mision":
      return `MISION ${node.nombre}`;
    case "bloque":
      return `bloque (${node.cmds?.length || 0} cmds)`;
    case "despegar":
      return `DESPEGAR ALTITUD ${node.altitud}${node.unidad || ""}`;
    case "mover":
      return node.modo === "base"
        ? "MOVER BASE"
        : `MOVER ${node.direccion} ${node.distancia}${node.unidad || ""}`;
    case "aterrizar":
      return "ATERRIZAR";
    case "sensor":
      return `SENSOR ${node.sensor} FRECUENCIA ${node.frecuencia}${node.unidad || ""}`;
    case "condicional":
      return `SI ${node.variable} ${node.op} ${node.valor} ENTONCES`;
    case "error":
      return `error línea ${node.line}`;
    default:
      return (node as { type: string }).type;
  }
}

function getChildren(node: ASTNodeType): ASTNodeType[] {
  switch (node.type) {
    case "programa":
      return node.misiones;
    case "mision":
      return node.bloque ? [node.bloque] : [];
    case "bloque":
      return node.cmds;
    case "condicional":
      return [node.cmd];
    default:
      return [];
  }
}

function ASTNodeComp({
  node,
  depth = 0,
}: {
  node: ASTNodeType;
  depth?: number;
}) {
  const [open, setOpen] = useState(true);
  const style = NODE_STYLES[node.type] || {
    bg: "#1a1e2815",
    color: "var(--text-muted)",
    border: "var(--border)",
  };
  const label = getLabel(node);
  const children = getChildren(node);
  const hasChildren = children.length > 0;
  const line = "line" in node ? node.line : undefined;

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 20, position: "relative" }}>
      {depth > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 16,
            width: 12,
            height: 1,
            background: "var(--border)",
          }}
        />
      )}
      {depth > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 1,
            background: "var(--border)",
          }}
        />
      )}
      <div
        onClick={() => hasChildren && setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          borderRadius: 4,
          border: `1px solid ${style.border}`,
          background: style.bg,
          color: style.color,
          fontSize: 11,
          marginBottom: 4,
          cursor: hasChildren ? "pointer" : "default",
          fontFamily: "'Space Mono', monospace",
          userSelect: "none",
          transition: "opacity 0.1s",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLDivElement).style.opacity = "0.8")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLDivElement).style.opacity = "1")
        }
      >
        {hasChildren && (
          <span style={{ opacity: 0.6, fontSize: 10 }}>{open ? "▾" : "▸"}</span>
        )}
        {label}
        {line && (
          <span
            style={{ color: "var(--text-muted)", fontSize: 10, marginLeft: 4 }}
          >
            :{line}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div style={{ marginLeft: 8 }}>
          {children.map((child, i) => (
            <ASTNodeComp key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  result: AnalyzerResult;
}

export default function ASTPanel({ result }: Props) {
  const errors = result.errors;
  const ast = result.ast;

  return (
    <div>
      {errors.length === 0 ? (
        <div
          style={{
            padding: "14px 16px",
            background: "#00e5a010",
            border: "1px solid #00e5a030",
            borderRadius: 6,
            color: "#00e5a0",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
          }}
        >
          ✓ Cadena aceptada — el programa es sintácticamente válido
        </div>
      ) : (
        <div
          style={{
            padding: "14px 16px",
            background: "#ff3d5a10",
            border: "1px solid #ff3d5a30",
            borderRadius: 6,
            color: "#ff3d5a",
            marginBottom: 16,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12 }}>
            ✗ Errores sintácticos
          </div>
          {errors.map((e, i) => (
            <div
              key={i}
              style={{ color: "#ff8099", fontSize: 11, lineHeight: 1.6 }}
            >
              Línea {e.line}: {e.message}
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 12,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        árbol sintáctico abstracto (AST)
      </div>
      {ast && <ASTNodeComp node={ast} />}
    </div>
  );
}
