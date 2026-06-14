import { useState } from "react";

const NODE_STYLES = {
  programa: { bg: '#00e5a015', color: '#00e5a0', border: '#00e5a030' },
  mision:   { bg: '#4d9eff15', color: '#4d9eff', border: '#4d9eff30' },
  bloque:   { bg: '#c084fc15', color: '#c084fc', border: '#c084fc30' },
  despegar: { bg: '#c084fc15', color: '#c084fc', border: '#c084fc30' },
  mover:    { bg: '#c084fc15', color: '#c084fc', border: '#c084fc30' },
  aterrizar:{ bg: '#c084fc15', color: '#c084fc', border: '#c084fc30' },
  sensor:   { bg: '#ffd16615', color: '#ffd166', border: '#ffd16630' },
  condicional:{ bg: '#ff6b3515', color: '#ff6b35', border: '#ff6b3530' },
  error:    { bg: '#ff3d5a15', color: '#ff3d5a', border: '#ff3d5a30' },
};

const LABELS = {
  programa:    (n) => `programa`,
  mision:      (n) => `MISION ${n.nombre}`,
  bloque:      (n) => `bloque (${n.cmds?.length || 0} cmds)`,
  despegar:    (n) => `DESPEGAR ALTITUD ${n.altitud}${n.unidad || ''}`,
  mover:       (n) => n.modo === 'base' ? 'MOVER BASE' : `MOVER ${n.direccion} ${n.distancia}${n.unidad || ''}`,
  aterrizar:   (n) => `ATERRIZAR`,
  sensor:      (n) => `SENSOR ${n.sensor} FRECUENCIA ${n.frecuencia}${n.unidad || ''}`,
  condicional: (n) => `SI ${n.variable} ${n.op} ${n.valor} ENTONCES`,
  error:       (n) => `error línea ${n.line}`,
};

function ASTNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(true);
  if (!node || typeof node !== 'object') return null;

  const style = NODE_STYLES[node.type] || { bg: '#1a1e2815', color: '#6b7280', border: '#252a38' };
  const label = LABELS[node.type] ? LABELS[node.type](node) : node.type;

  const children = (() => {
    switch (node.type) {
      case 'programa':    return node.misiones || [];
      case 'mision':      return node.bloque ? [node.bloque] : [];
      case 'bloque':      return node.cmds || [];
      case 'condicional': return [node.cmd].filter(Boolean);
      default:            return [];
    }
  })();

  const hasChildren = children.length > 0;

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 20, position: 'relative' }}>
      {depth > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 16,
          width: 12, height: 1, background: '#252a38',
        }} />
      )}
      {depth > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 1, background: '#252a38',
        }} />
      )}
      <div
        onClick={() => hasChildren && setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 10px', borderRadius: 4,
          border: `1px solid ${style.border}`,
          background: style.bg, color: style.color,
          fontSize: 11, marginBottom: 4,
          cursor: hasChildren ? 'pointer' : 'default',
          fontFamily: "'Space Mono', monospace",
          userSelect: 'none',
          transition: 'opacity 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {hasChildren && (
          <span style={{ opacity: 0.6, fontSize: 10 }}>{open ? '▾' : '▸'}</span>
        )}
        {label}
        {node.line && (
          <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 4 }}>:{node.line}</span>
        )}
      </div>
      {hasChildren && open && (
        <div style={{ marginLeft: 8 }}>
          {children.map((child, i) => (
            <ASTNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ASTPanel({ result }) {
  const errors = result?.errors || [];
  const ast = result?.ast;

  return (
    <div>
      {errors.length === 0 ? (
        <div style={{
          padding: '14px 16px',
          background: '#00e5a010',
          border: '1px solid #00e5a030',
          borderRadius: 6,
          color: '#00e5a0',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
        }}>
          ✓ Cadena aceptada — el programa es sintácticamente válido
        </div>
      ) : (
        <div style={{
          padding: '14px 16px',
          background: '#ff3d5a10',
          border: '1px solid #ff3d5a30',
          borderRadius: 6,
          color: '#ff3d5a',
          marginBottom: 16,
          fontFamily: "'Space Mono', monospace",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12 }}>✗ Errores sintácticos</div>
          {errors.map((e, i) => (
            <div key={i} style={{ color: '#ff8099', fontSize: 11, lineHeight: 1.6 }}>
              Línea {e.line}: {e.message}
            </div>
          ))}
        </div>
      )}

      <div style={{
        fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
        color: '#6b7280', marginBottom: 12,
        fontFamily: "'Space Mono', monospace",
      }}>
        árbol sintáctico abstracto (AST)
      </div>

      {ast && <ASTNode node={ast} />}
    </div>
  );
}
