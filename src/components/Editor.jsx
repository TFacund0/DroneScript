import MonacoEditor from "@monaco-editor/react";
import { EXAMPLES } from "../constants/exampleCode";

const EXAMPLE_LABELS = [
  { key: 'valid1',   label: '✓ simple' },
  { key: 'valid2',   label: '✓ complejo' },
  { key: 'valid3',   label: '✓ reconocimiento' },
  { key: 'invalid1', label: '✗ sin número' },
  { key: 'invalid2', label: '✗ falta FIN' },
  { key: 'invalid3', label: '✗ cmd inválido' },
];

export default function Editor({ code, setCode, onAnalyze }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #252a38',
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '12px 18px',
        fontSize: 11,
        fontFamily: "'Space Mono', monospace",
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: '#6b7280',
        borderBottom: '1px solid #252a38',
        background: '#13161e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>editor.ds</span>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#00e5a0',
          boxShadow: '0 0 6px #00e5a0',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
      </div>

      {/* Monaco */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MonacoEditor
          height="100%"
          defaultLanguage="plaintext"
          value={code}
          onChange={v => setCode(v || '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            lineHeight: 1.8,
          }}
        />
      </div>

      {/* Ejemplos */}
      <div style={{
        padding: '10px 18px',
        display: 'flex',
        gap: 8,
        borderTop: '1px solid #252a38',
        background: '#13161e',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: '#6b7280', fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap' }}>
          Ejemplos:
        </span>
        {EXAMPLE_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCode(EXAMPLES[key])}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              padding: '5px 12px',
              borderRadius: 4,
              border: '1px solid #252a38',
              background: '#1a1e28',
              color: '#6b7280',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.target.style.borderColor = '#00e5a0'; e.target.style.color = '#00e5a0'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#252a38'; e.target.style.color = '#6b7280'; }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Botón analizar */}
      <button
        onClick={onAnalyze}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 13,
          padding: '12px 24px',
          background: '#00e5a0',
          color: '#0d0f14',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '0.5px',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.target.style.background = '#00ffb3'}
        onMouseLeave={e => e.target.style.background = '#00e5a0'}
      >
        ▶ ANALIZAR
      </button>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
