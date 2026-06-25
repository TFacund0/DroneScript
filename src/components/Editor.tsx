import React from "react";
import MonacoEditor from "@monaco-editor/react";
import { EXAMPLES } from "../constants/exampleCode";

const EXAMPLE_LABELS = [
  { key: "valid1", label: "✓ simple" },
  { key: "valid2", label: "✓ complejo" },
  { key: "valid3", label: "✓ reconocimiento" },
  { key: "invalid1", label: "✗ sin número" },
  { key: "invalid2", label: "✗ falta FIN" },
  { key: "invalid3", label: "✗ cmd inválido" },
];

interface Props {
  code: string;
  setCode: (v: string) => void;
  onAnalyze: () => void;
  isDark: boolean;
}

export default function Editor({ code, setCode, onAnalyze, isDark }: Props) {
  // Theme values
  const theme = {
    bg: isDark ? "#0d0f14" : "#ffffff",
    borderRight: isDark ? "1px solid #252a38" : "1px solid #cbd5e1",
    headerBg: isDark ? "#13161e" : "#f1f5f9",
    headerText: isDark ? "#6b7280" : "#475569",
    headerBorderBottom: isDark ? "1px solid #252a38" : "1px solid #cbd5e1",
    examplesBg: isDark ? "#13161e" : "#f1f5f9",
    examplesBorderTop: isDark ? "1px solid #252a38" : "1px solid #cbd5e1",
    btnBg: isDark ? "#1a1e28" : "#e2e8f0",
    btnText: isDark ? "#6b7280" : "#475569",
    btnBorder: isDark ? "1px solid #252a38" : "1px solid #cbd5e1",
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: theme.borderRight,
        background: theme.bg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          fontSize: 11,
          fontFamily: "'Space Mono', monospace",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: theme.headerText,
          borderBottom: theme.headerBorderBottom,
          background: theme.headerBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>editor.ds</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", background: theme.bg }}>
        <MonacoEditor
          height="100%"
          defaultLanguage="plaintext"
          value={code}
          onChange={(v) => setCode(v || "")}
          theme={isDark ? "vs-dark" : "vs"}
          options={{
            fontSize: 12,
            fontFamily: "'Space Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: "on",
            padding: { top: 12 },
            scrollBeyondLastLine: false,
            lineHeight: 1.8,
          }}
        />
      </div>
      <div
        style={{
          padding: "8px 16px",
          display: "flex",
          gap: 8,
          borderTop: theme.examplesBorderTop,
          background: theme.examplesBg,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: theme.btnText,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Ejemplos:
        </span>
        {EXAMPLE_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCode(EXAMPLES[key])}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 4,
              border: theme.btnBorder,
              background: theme.btnBg,
              color: theme.btnText,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "#00e5a0";
              (e.target as HTMLButtonElement).style.color = "#00e5a0";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = isDark ? "#252a38" : "#cbd5e1";
              (e.target as HTMLButtonElement).style.color = isDark ? "#6b7280" : "#475569";
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={onAnalyze}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          padding: "10px 20px",
          background: "#00e5a0",
          color: "#0d0f14",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          letterSpacing: "0.5px",
        }}
        onMouseEnter={(e) =>
          ((e.target as HTMLButtonElement).style.background = "#00ffb3")
        }
        onMouseLeave={(e) =>
          ((e.target as HTMLButtonElement).style.background = "#00e5a0")
        }
      >
        ▶ ANALIZAR
      </button>
    </div>
  );
}
