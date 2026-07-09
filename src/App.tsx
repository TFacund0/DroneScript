import React, { useState } from "react";
import { useAnalyzer } from "./hooks/useAnalyzer";
import Header from "./components/Header";
import Editor from "./components/Editor";
import TokenPanel from "./components/TokenPanel";
import ASTPanel from "./components/ASTPanel";
import ErrorPanel from "./components/ErrorPanel";
import GramaticaPanel from "./components/GramaticaPanel";
import DroneVisualizer from "./components/DroneVisualizer";
import type { TabId } from "./types";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "tokens", label: "Tokens" },
  { id: "ast", label: "AST" },
  { id: "gramatica", label: "Gramática" },
  { id: "simulacion", label: "🚁 Simulación" },
];

function countNodes(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  const n = node as Record<string, unknown>;
  const children = (n["misiones"] ||
    n["cmds"] ||
    (n["bloque"] ? [n["bloque"]] : []) ||
    (n["cmd"] ? [n["cmd"]] : [])) as unknown[];
  return (
    1 +
    (Array.isArray(children)
      ? children.reduce((s: number, c) => s + countNodes(c), 0)
      : 0)
  );
}

export default function App() {
  const { code, setCode, result, tab, setTab, analyze } = useAnalyzer();
  const [isDark, setIsDark] = useState(true);

  const visibleTokens = result?.tokens.filter((t) => t.type !== "EOF") || [];
  const errors = result?.errors || [];
  const isValid = result && errors.length === 0;

  const tabLabel = (t: { id: TabId; label: string }) => {
    if (t.id === "tokens" && result)
      return `${t.label} (${visibleTokens.length})`;
    if (t.id === "ast" && result && errors.length > 0) return `${t.label} ⚠`;
    return t.label;
  };

  return (
    <div
      style={{
        height: "100vh",
        background: isDark ? "#0d0f14" : "#ffffff",
        fontFamily: "'Syne', 'Inter', sans-serif",
        color: isDark ? "#e8ecf5" : "#0f172a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...({
          "--bg-app": isDark ? "#0d0f14" : "#ffffff",
          "--bg-panel": isDark ? "#13161e" : "#f1f5f9",
          "--text-main": isDark ? "#e8ecf5" : "#0f172a",
          "--text-muted": isDark ? "#6b7280" : "#475569",
          "--border": isDark ? "#252a38" : "#cbd5e1",
          "--scroll-thumb": isDark ? "#252a38" : "#cbd5e1",
        } as React.CSSProperties),
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap"
        rel="stylesheet"
      />

      <Header isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Editor
          code={code}
          setCode={setCode}
          onAnalyze={analyze}
          isDark={isDark}
          errors={result?.errors ?? []}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              borderBottom: isDark ? "1px solid #252a38" : "1px solid #cbd5e1",
              background: isDark ? "#13161e" : "#f1f5f9",
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 16px",
                  fontSize: 11,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color:
                    tab === t.id ? "#00e5a0" : isDark ? "#6b7280" : "#475569",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    tab === t.id
                      ? "2px solid #00e5a0"
                      : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {tabLabel(t)}
              </button>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: tab === "simulacion" ? "hidden" : "auto",
              padding: tab === "simulacion" ? 0 : 14,
              background:
                tab === "simulacion"
                  ? "#0a0f1e"
                  : isDark
                    ? "#0d0f14"
                    : "#ffffff",
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            {!result && tab !== "gramatica" && tab !== "simulacion" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 200,
                  color: isDark ? "#6b7280" : "#475569",
                  fontSize: 12,
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 28, opacity: 0.3 }}>◈</div>
                <span>Presioná ANALIZAR para ver los resultados</span>
              </div>
            )}
            {result && tab === "tokens" && <TokenPanel result={result} />}
            {result && tab === "ast" && <ASTPanel result={result} />}
            {result && tab === "errores" && <ErrorPanel result={result} />}
            {tab === "gramatica" && <GramaticaPanel />}
            {tab === "simulacion" && (
              <DroneVisualizer
                ast={result?.ast ?? null}
                errors={result?.errors ?? []}
              />
            )}
          </div>

          <div
            style={{
              padding: "6px 14px",
              fontSize: 11,
              fontFamily: "'Space Mono', monospace",
              borderTop: isDark ? "1px solid #252a38" : "1px solid #cbd5e1",
              background: isDark ? "#13161e" : "#f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {!result && (
              <span style={{ color: isDark ? "#6b7280" : "#475569" }}>
                — listo para analizar
              </span>
            )}
            {result && isValid && (
              <>
                <span style={{ color: "#00e5a0" }}>✓ Aceptado</span>
                <span style={{ color: isDark ? "#6b7280" : "#475569" }}>·</span>
                <span style={{ color: isDark ? "#6b7280" : "#475569" }}>
                  {visibleTokens.length} tokens · {countNodes(result.ast)} nodos
                  en AST
                </span>
              </>
            )}
            {result && !isValid && (
              <span style={{ color: "#ff3d5a" }}>
                ✗ {errors.length} error{errors.length !== 1 ? "es" : ""} — línea{" "}
                {errors[0]?.line || "?"}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 2px; }
      `}</style>
    </div>
  );
}
