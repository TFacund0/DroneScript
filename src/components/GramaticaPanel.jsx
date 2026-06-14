const rules = [
  { lhs: 'programa',    rhs: [{kw:'mision'}, {t:'+'} ] },
  { lhs: 'mision',      rhs: [{kw:'MISION'}, {t:' STRING bloque '}, {kw:'FIN'}] },
  { lhs: 'bloque',      rhs: [{kw:'cmd'}, {t:'*'}] },
  { lhs: 'cmd',         rhs: [{t:'despegar | mover | aterrizar | sensor_cmd | condicional'}] },
  { lhs: 'despegar',    rhs: [{kw:'DESPEGAR ALTITUD'}, {t:' NUMBER UNIT?'}] },
  { lhs: 'mover',       rhs: [{kw:'MOVER'}, {t:' (dirección NUMBER UNIT? ('}, {kw:'VELOCIDAD'}, {t:' NUMBER)? | '}, {kw:'BASE'}, {t:')'}] },
  { lhs: 'aterrizar',   rhs: [{kw:'ATERRIZAR'}] },
  { lhs: 'sensor_cmd',  rhs: [{kw:'SENSOR'}, {t:' tipo_sensor '}, {kw:'FRECUENCIA'}, {t:' NUMBER UNIT?'}] },
  { lhs: 'condicional', rhs: [{kw:'SI'}, {t:' IDENT op NUMBER '}, {kw:'ENTONCES'}, {t:' cmd '}, {kw:'FIN'}] },
  { lhs: 'dirección',   rhs: [{kw:'norte'}, {t:' | '}, {kw:'sur'}, {t:' | '}, {kw:'este'}, {t:' | '}, {kw:'oeste'}, {t:' | '}, {kw:'noreste'}, {t:' | '}, {kw:'noroeste'}, {t:' | '}, {kw:'sureste'}, {t:' | '}, {kw:'suroeste'}] },
  { lhs: 'tipo_sensor', rhs: [{kw:'temperatura'}, {t:' | '}, {kw:'bateria'}, {t:' | '}, {kw:'altura'}, {t:' | '}, {kw:'velocidad'}, {t:' | '}, {kw:'viento'}] },
  { lhs: 'op',          rhs: [{t:'< | > | <= | >= | =='}] },
];

const tokenRules = [
  { name: 'KEYWORD', color: '#00e5a0', regex: 'MISION|FIN|DESPEGAR|ALTITUD|MOVER|ATERRIZAR|SENSOR|FRECUENCIA|SI|ENTONCES|BASE|VELOCIDAD' },
  { name: 'STRING',  color: '#ffd166', regex: '"[^"]*"' },
  { name: 'NUMBER',  color: '#4d9eff', regex: '[0-9]+(\\.[0-9]+)?' },
  { name: 'UNIT',    color: '#a0e0ff', regex: 'm | km | s | %' },
  { name: 'OP',      color: '#ff6b35', regex: '<= | >= | == | < | >' },
  { name: 'IDENT',   color: '#c084fc', regex: '[a-zA-Z_][a-zA-Z0-9_]*' },
];

const mono = { fontFamily: "'Space Mono', monospace" };
const borderStyle = { borderBottom: '1px solid #252a38', padding: '6px 0' };

export default function GramaticaPanel() {
  return (
    <div style={{ ...mono, fontSize: 12 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#6b7280', marginBottom: 12 }}>
        Gramática formal (BNF)
      </div>
      {rules.map((r, i) => (
        <div key={i} style={borderStyle}>
          <span style={{ color: '#4d9eff' }}>{r.lhs}</span>
          <span style={{ color: '#6b7280', margin: '0 8px' }}>→</span>
          {r.rhs.map((part, j) =>
            part.kw
              ? <span key={j} style={{ color: '#00e5a0', fontWeight: 700 }}>{part.kw}</span>
              : <span key={j} style={{ color: '#e8ecf5', opacity: 0.8 }}>{part.t}</span>
          )}
        </div>
      ))}

      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#6b7280', margin: '20px 0 12px' }}>
        Tokens (expresiones regulares)
      </div>
      {tokenRules.map((t, i) => (
        <div key={i} style={borderStyle}>
          <span style={{ color: t.color }}>{t.name}</span>
          <span style={{ color: '#6b7280', margin: '0 8px' }}>→</span>
          <span style={{ color: '#6b7280' }}>{t.regex}</span>
        </div>
      ))}
    </div>
  );
}
