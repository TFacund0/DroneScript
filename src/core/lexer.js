// ─── LEXER DE DRONESCRIPT ────────────────────────────────────────────────────

const KEYWORDS = new Set([
  'MISION', 'FIN', 'DESPEGAR', 'ALTITUD', 'MOVER', 'ATERRIZAR',
  'SENSOR', 'FRECUENCIA', 'SI', 'ENTONCES', 'BASE', 'VELOCIDAD'
]);

const DIRECTIONS = new Set([
  'norte', 'sur', 'este', 'oeste',
  'noreste', 'noroeste', 'sureste', 'suroeste',
  'arriba', 'abajo'
]);

const SENSORS = new Set([
  'temperatura', 'bateria', 'altura', 'velocidad', 'viento'
]);

/**
 * Tokeniza el código fuente DroneScript.
 * Retorna { tokens, errors }
 * Cada token: { type, value, line, col }
 */
export function tokenize(source) {
  const tokens = [];
  const errors = [];
  let i = 0;
  let line = 1;
  let lineStart = 0;

  while (i < source.length) {
    const col = i - lineStart + 1;
    const ch = source[i];

    // Salto de línea
    if (ch === '\n') {
      line++;
      lineStart = i + 1;
      i++;
      continue;
    }

    // Espacios y tabs
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
      continue;
    }

    // Comentarios con #
    if (ch === '#') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }

    // String entre comillas dobles
    if (ch === '"') {
      let str = '';
      i++;
      const startCol = col;
      while (i < source.length && source[i] !== '"' && source[i] !== '\n') {
        str += source[i++];
      }
      if (source[i] === '"') {
        i++;
        tokens.push({ type: 'STRING', value: `"${str}"`, line, col: startCol });
      } else {
        errors.push({ message: `String sin cerrar en línea ${line}, col ${startCol}`, line, col: startCol });
      }
      continue;
    }

    // Números
    if (/[0-9]/.test(ch)) {
      let num = '';
      const startCol = col;
      while (i < source.length && /[0-9.]/.test(source[i])) {
        num += source[i++];
      }
      tokens.push({ type: 'NUMBER', value: num, line, col: startCol });
      continue;
    }

    // Operadores relacionales
    if (ch === '<' || ch === '>' || ch === '=') {
      const startCol = col;
      let op = ch;
      if (source[i + 1] === '=' && (ch === '<' || ch === '>' || ch === '=')) {
        op += '=';
        i++;
      }
      if (op === '<' || op === '>' || op === '<=' || op === '>=' || op === '==') {
        tokens.push({ type: 'OP', value: op, line, col: startCol });
        i++;
        continue;
      }
    }

    // Identificadores y palabras reservadas
    if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ_]/.test(ch)) {
      let word = '';
      const startCol = col;
      while (i < source.length && /[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]/.test(source[i])) {
        word += source[i++];
      }

      // Detectar unidades pegadas al número anterior (m, km, s, %)
      // Se manejan como UNIT solo si son exactamente m, km, s
      if (word === 'm' || word === 'km' || word === 's') {
        tokens.push({ type: 'UNIT', value: word, line, col: startCol });
        continue;
      }

      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'KEYWORD', value: word, line, col: startCol });
      } else if (DIRECTIONS.has(word.toLowerCase())) {
        tokens.push({ type: 'IDENT', subtype: 'direccion', value: word.toLowerCase(), line, col: startCol });
      } else if (SENSORS.has(word.toLowerCase())) {
        tokens.push({ type: 'IDENT', subtype: 'sensor', value: word.toLowerCase(), line, col: startCol });
      } else {
        tokens.push({ type: 'IDENT', value: word, line, col: startCol });
      }
      continue;
    }

    // Unidad %
    if (ch === '%') {
      tokens.push({ type: 'UNIT', value: '%', line, col });
      i++;
      continue;
    }

    // Carácter no reconocido — recuperación permisiva
    errors.push({ message: `Carácter no reconocido '${ch}' en línea ${line}, col ${col}`, line, col });
    i++;
  }

  tokens.push({ type: 'EOF', value: '', line, col: source.length - lineStart + 1 });
  return { tokens, errors };
}
