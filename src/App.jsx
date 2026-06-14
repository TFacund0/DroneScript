import React from "react";
import { useAnalyzer } from "./hooks/useAnalyzer";
import Header from "./components/Header";
import Editor from "./components/Editor";
import TokenPanel from "./components/TokenPanel";
import ASTPanel from "./components/ASTPanel";
import ErrorPanel from "./components/ErrorPanel";
import GramaticaPanel from "./components/GramaticaPanel";
import DroneVisualizer from "./components/DroneVisualizer";

const TABS = [
  { id: 'tokens',     label: 'Tokens' },
  { id: 'ast',        label: 'AST' },
  { id: 'gramatica',  label: 'Gramática' },
  { id: 'simulacion', label: '🚁 Simulación' },
];

function countNodes(node) {
  if (!node) return 0;
  const children = node.misiones || node.cmds || (node.bloque ? [node.bloque] : []) || (node.cmd ? [node.cmd] : []);
  return 1 + (Array.isArray(children) ? children.reduce((s, c) => s + countNodes(c), 0) : 0);
}

export default function App() {
  const { code, setCode, result, tab, setTab, analyze } = useAnalyzer();

  const visibleTokens = result?.tokens.filter(t => t.type !== 'EOF') || [];
  const errors = result?.errors || [];
  const isValid = result && errors.length === 0;

  const tabLabel = (t) => {
    if (t.id === 'tokens' && result) return `${t.label} (${visibleTokens.length})`;
    if (t.id === 'ast' && result && errors.length > 0) return `${t.label} ⚠`;
    return t.label;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0f14',
      fontFamily: "'Syne', 'Inter', sans-serif",
      color: '#e8ecf5',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap" rel="stylesheet" />

      <Header />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        flex: 1,
        height: 'calc(100vh - 61px)',
        overflow: 'hidden',
      }}>
        {/* LEFT — Editor */}
        <Editor code={code} setCode={setCode} onAnalyze={analyze} />

        {/* RIGHT — Output */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #252a38',
            background: '#13161e',
          }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '12px 20px',
                  fontSize: 11,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: tab === t.id ? '#00e5a0' : '#6b7280',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === t.id ? '2px solid #00e5a0' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tabLabel(t)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: tab === 'simulacion' ? 'hidden' : 'auto',
            padding: tab === 'simulacion' ? 0 : 18,
            background: tab === 'simulacion' ? '#0a0f1e' : '#0d0f14',
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            lineHeight: 1.7,
          }}>
            {!result && tab !== 'gramatica' && tab !== 'simulacion' && (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: 200, color: '#6b7280', fontSize: 12, gap: 8,
              }}>
                <div style={{ fontSize: 28, opacity: 0.3 }}>◈</div>
                <span>Presioná ANALIZAR para ver los resultados</span>
              </div>
            )}

            {result && tab === 'tokens'    && <TokenPanel result={result} />}
            {result && tab === 'ast'       && <ASTPanel result={result} />}
            {tab === 'gramatica'           && <GramaticaPanel />}
            {tab === 'simulacion'          && (
              <DroneVisualizer ast={result?.ast || null} errors={result?.errors || []} />
            )}
          </div>

          {/* Status bar */}
          <div style={{
            padding: '8px 18px',
            fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            borderTop: '1px solid #252a38',
            background: '#13161e',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {!result && (
              <span style={{ color: '#6b7280' }}>— listo para analizar</span>
            )}
            {result && isValid && (
              <>
                <span style={{ color: '#00e5a0' }}>✓ Aceptado</span>
                <span style={{ color: '#6b7280' }}>·</span>
                <span style={{ color: '#6b7280' }}>{visibleTokens.length} tokens · {countNodes(result.ast)} nodos en AST</span>
              </>
            )}
            {result && !isValid && (
              <span style={{ color: '#ff3d5a' }}>
                ✗ {errors.length} error{errors.length !== 1 ? 'es' : ''} — línea {errors[0]?.line || '?'}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #252a38; border-radius: 2px; }
      `}</style>
    </div>
  );
}
