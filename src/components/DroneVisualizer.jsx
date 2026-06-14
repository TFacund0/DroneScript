import { useEffect, useRef, useState } from "react";

const GRID_SIZE = 40;
const CANVAS_W = 580;
const CANVAS_H = 460;
const ORIGIN_X = CANVAS_W / 2;
const ORIGIN_Y = CANVAS_H / 2;
const SCALE = 0.8;

const DIR_VECTOR = {
  norte:    [0, -1], sur:      [0,  1],
  este:     [1,  0], oeste:    [-1,  0],
  noreste:  [0.7, -0.7], noroeste: [-0.7, -0.7],
  sureste:  [0.7,  0.7], suroeste: [-0.7,  0.7],
  arriba:   [0, -1], abajo:    [0,  1],
};

function interpretAST(ast) {
  const steps = [];
  if (!ast || !ast.misiones) return steps;

  function interpCmd(cmd, mision) {
    if (!cmd) return;
    switch (cmd.type) {
      case 'despegar':
        steps.push({ kind: 'despegar', label: `DESPEGAR ALTITUD ${cmd.altitud}${cmd.unidad || ''}`, mision }); break;
      case 'mover':
        if (cmd.modo === 'base') {
          steps.push({ kind: 'base', label: 'MOVER BASE', mision });
        } else {
          const [dx, dy] = DIR_VECTOR[cmd.direccion] || [0, 0];
          steps.push({ kind: 'mover', dx, dy, dist: parseFloat(cmd.distancia) || 0, label: `MOVER ${cmd.direccion} ${cmd.distancia}${cmd.unidad || ''}`, mision });
        }
        break;
      case 'aterrizar':
        steps.push({ kind: 'aterrizar', label: 'ATERRIZAR', mision }); break;
      case 'sensor':
        steps.push({ kind: 'sensor', sensor: cmd.sensor, label: `SENSOR ${cmd.sensor}`, mision }); break;
      case 'condicional':
        steps.push({ kind: 'condicional', label: `SI ${cmd.variable} ${cmd.op} ${cmd.valor}`, mision });
        interpCmd(cmd.cmd, mision); break;
    }
  }

  for (const mision of ast.misiones) {
    steps.push({ kind: 'mision', label: `MISION ${mision.nombre}`, mision: mision.nombre });
    for (const cmd of mision.bloque?.cmds || []) interpCmd(cmd, mision.nombre);
  }
  return steps;
}

const STEP_COLOR = {
  despegar:    '#00e5a0',
  mover:       '#4d9eff',
  aterrizar:   '#ff3d5a',
  sensor:      '#ffd166',
  condicional: '#ff6b35',
  base:        '#6b7280',
  mision:      '#c084fc',
};

const STEP_ICON = {
  despegar: '⬆', mover: '➤', aterrizar: '⬇',
  sensor: '◉', condicional: '◆', base: '⌂', mision: '▣',
};

export default function DroneVisualizer({ ast, errors }) {
  const canvasRef = useRef(null);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!ast || errors?.length > 0) { setSteps([]); setCurrentStep(-1); setPlaying(false); return; }
    setSteps(interpretAST(ast));
    setCurrentStep(-1);
    setPlaying(false);
  }, [ast, errors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Fondo
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = '#1a1e28';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // Ejes
    ctx.strokeStyle = '#252a38';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(ORIGIN_X, 0); ctx.lineTo(ORIGIN_X, CANVAS_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, ORIGIN_Y); ctx.lineTo(CANVAS_W, ORIGIN_Y); ctx.stroke();
    ctx.setLineDash([]);

    // Labels ejes
    ctx.fillStyle = '#252a38';
    ctx.font = 'bold 11px Space Mono, monospace';
    ctx.fillText('N', ORIGIN_X + 6, 16);
    ctx.fillText('S', ORIGIN_X + 6, CANVAS_H - 6);
    ctx.fillText('E', CANVAS_W - 16, ORIGIN_Y - 6);
    ctx.fillText('O', 6, ORIGIN_Y - 6);

    // BASE
    ctx.fillStyle = '#00e5a020';
    ctx.beginPath(); ctx.arc(ORIGIN_X, ORIGIN_Y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00e5a040';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ORIGIN_X, ORIGIN_Y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#00e5a0';
    ctx.font = 'bold 10px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BASE', ORIGIN_X, ORIGIN_Y + 4);
    ctx.textAlign = 'left';

    // Calcular posición actual
    let px = ORIGIN_X, py = ORIGIN_Y;
    const stepsToRender = currentStep >= 0 ? steps.slice(0, currentStep + 1) : [];
    const path = [{ x: px, y: py }];

    for (const step of stepsToRender) {
      if (step.kind === 'mover') {
        const nx = px + step.dx * step.dist * SCALE;
        const ny = py + step.dy * step.dist * SCALE;
        path.push({ x: nx, y: ny, step });
        px = nx; py = ny;
      } else if (step.kind === 'base') {
        path.push({ x: ORIGIN_X, y: ORIGIN_Y, step });
        px = ORIGIN_X; py = ORIGIN_Y;
      }
    }

    // Trayectoria
    if (path.length > 1) {
      for (let i = 1; i < path.length; i++) {
        const from = path[i - 1];
        const to = path[i];

        // Línea punteada
        ctx.strokeStyle = '#4d9eff44';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
        ctx.setLineDash([]);

        // Flecha en el medio
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        ctx.fillStyle = '#4d9eff';
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(angle) * 7, my + Math.sin(angle) * 7);
        ctx.lineTo(mx + Math.cos(angle + 2.4) * 5, my + Math.sin(angle + 2.4) * 5);
        ctx.lineTo(mx + Math.cos(angle - 2.4) * 5, my + Math.sin(angle - 2.4) * 5);
        ctx.closePath(); ctx.fill();
      }
    }

    // Efectos por tipo
    for (const step of stepsToRender) {
      if (step.kind === 'despegar') {
        ctx.strokeStyle = '#00e5a040';
        ctx.lineWidth = 1;
        for (let r = 10; r <= 25; r += 8) {
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
        }
      }
      if (step.kind === 'aterrizar') {
        ctx.fillStyle = '#ff3d5a22';
        ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();
      }
      if (step.kind === 'sensor') {
        ctx.strokeStyle = '#ffd16644';
        ctx.lineWidth = 1;
        for (let r = 15; r <= 35; r += 10) {
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
        }
      }
      if (step.kind === 'condicional') {
        ctx.strokeStyle = '#ff6b3544';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py - 16); ctx.lineTo(px + 14, py); ctx.lineTo(px, py + 16);
        ctx.lineTo(px - 14, py); ctx.closePath(); ctx.stroke();
      }
    }

    // Dron
    if (currentStep >= 0) {
      // Sombra
      ctx.fillStyle = '#00000055';
      ctx.beginPath(); ctx.ellipse(px + 2, py + 3, 12, 6, 0, 0, Math.PI * 2); ctx.fill();

      // Brazos
      const arms = [[1,1],[-1,1],[1,-1],[-1,-1]];
      ctx.strokeStyle = '#252a38';
      ctx.lineWidth = 2;
      for (const [ax, ay] of arms) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + ax * 12, py + ay * 12);
        ctx.stroke();
      }

      // Hélices
      ctx.fillStyle = '#4d9eff55';
      for (const [ax, ay] of arms) {
        ctx.beginPath(); ctx.arc(px + ax * 12, py + ay * 12, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4d9eff';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px + ax * 12, py + ay * 12, 7, 0, Math.PI * 2); ctx.stroke();
      }

      // Cuerpo
      ctx.fillStyle = '#13161e';
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#00e5a0';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.stroke();

      // LED central
      ctx.fillStyle = '#00e5a0';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#00e5a066';
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    }

  }, [steps, currentStep]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) { setPlaying(false); clearInterval(intervalRef.current); return prev; }
          return prev + 1;
        });
      }, 700);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, steps]);

  const hasErrors = errors?.length > 0;
  const noSteps = steps.length === 0;
  const mono = { fontFamily: "'Space Mono', monospace" };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0f14' }}>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />
        {(hasErrors || noSteps) && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column', gap: 8,
            color: '#252a38', fontSize: 12, textAlign: 'center', ...mono,
          }}>
            <div style={{ fontSize: 32, opacity: 0.4 }}>{hasErrors ? '✗' : '◈'}</div>
            <span>{hasErrors ? 'Corregí los errores para visualizar' : 'Analizá código DroneScript para ver la simulación'}</span>
          </div>
        )}
      </div>

      {/* Controles */}
      {!noSteps && !hasErrors && (
        <div style={{ borderTop: '1px solid #252a38', padding: '10px 16px', background: '#13161e' }}>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => { setPlaying(false); setCurrentStep(i); }}
                title={step.label}
                style={{
                  padding: '3px 8px', borderRadius: 3,
                  border: `1px solid ${i === currentStep ? STEP_COLOR[step.kind] : '#252a38'}`,
                  cursor: 'pointer', fontSize: 11, ...mono,
                  background: i === currentStep ? `${STEP_COLOR[step.kind]}22` : i < currentStep ? '#1a1e28' : '#0d0f14',
                  color: i === currentStep ? STEP_COLOR[step.kind] : i < currentStep ? '#6b7280' : '#252a38',
                  transition: 'all 0.15s',
                }}
              >
                {STEP_ICON[step.kind] || '·'}
              </button>
            ))}
          </div>

          {/* Paso actual */}
          {currentStep >= 0 && (
            <div style={{ fontSize: 11, ...mono, color: STEP_COLOR[steps[currentStep]?.kind] || '#6b7280', marginBottom: 8 }}>
              {steps[currentStep]?.label} <span style={{ color: '#6b7280' }}>— paso {currentStep + 1}/{steps.length}</span>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: '↩ Reset', onClick: () => { setPlaying(false); setCurrentStep(-1); }, bg: '#1a1e28', color: '#6b7280' },
              { label: '◀', onClick: () => setCurrentStep(p => Math.max(-1, p - 1)), bg: '#1a1e28', color: '#4d9eff', disabled: currentStep < 0 },
              { label: playing ? '⏸ Pausar' : '▶ Play', onClick: () => setPlaying(p => !p), bg: playing ? '#ff6b3522' : '#00e5a022', color: playing ? '#ff6b35' : '#00e5a0' },
              { label: '▶', onClick: () => { setPlaying(false); setCurrentStep(p => Math.min(steps.length - 1, p + 1)); }, bg: '#1a1e28', color: '#4d9eff', disabled: currentStep >= steps.length - 1 },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                disabled={btn.disabled}
                style={{
                  background: btn.bg, color: btn.color,
                  border: `1px solid ${btn.color}44`,
                  padding: '6px 14px', borderRadius: 4,
                  cursor: btn.disabled ? 'not-allowed' : 'pointer',
                  fontSize: 12, ...mono,
                  opacity: btn.disabled ? 0.3 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
