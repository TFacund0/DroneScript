export default function TokenPanel({ result }) {
  const tokens = result?.tokens.filter(t => t.type !== 'EOF') || [];
  const errors = result?.errors || [];

  const TYPE_COLORS = {
    KEYWORD: '#00e5a0',
    STRING:  '#ffd166',
    NUMBER:  '#4d9eff',
    OP:      '#ff6b35',
    IDENT:   '#c084fc',
    UNIT:    '#a0e0ff',
  };

  if (errors.length > 0) {
    return (
      <div style={{
        padding: '14px 16px',
        background: '#ff3d5a10',
        border: '1px solid #ff3d5a30',
        borderRadius: 6,
        color: '#ff3d5a',
        marginBottom: 16,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>✗ Errores encontrados</div>
        {errors.map((e, i) => (
          <div key={i} style={{ color: '#ff8099', fontSize: 11, lineHeight: 1.6, fontFamily: "'Space Mono', monospace" }}>
            Línea {e.line}: {e.message}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{
        fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
        color: '#6b7280', marginBottom: 12,
        fontFamily: "'Space Mono', monospace",
      }}>
        {tokens.length} tokens encontrados
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tokens.map((tok, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 60px',
            gap: 12,
            padding: '6px 10px',
            borderRadius: 4,
            background: '#13161e',
            alignItems: 'center',
            fontFamily: "'Space Mono', monospace",
          }}>
            <span style={{
              fontSize: 11, letterSpacing: '0.5px', fontWeight: 700,
              color: TYPE_COLORS[tok.type] || '#e8ecf5',
            }}>
              {tok.type}
            </span>
            <span style={{ color: '#e8ecf5', opacity: 0.85, fontSize: 12, wordBreak: 'break-all' }}>
              {tok.value}
            </span>
            <span style={{ color: '#6b7280', textAlign: 'right', fontSize: 10 }}>
              línea {tok.line}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
