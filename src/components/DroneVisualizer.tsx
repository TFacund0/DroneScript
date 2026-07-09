import { useEffect, useRef, useState } from "react";
import {
  interpretAST,
  type ProgramaNode,
  type Step,
  type StepKind,
} from "@dronescript/core";

const CANVAS_W = 580;
const CANVAS_H = 460;
const ORIGIN_X = CANVAS_W / 2;
const ORIGIN_Y = CANVAS_H / 2;
const SCALE = 0.8;

const STEP_COLOR: Record<StepKind, string> = {
  despegar: "#00e5a0",
  mover: "#4d9eff",
  aterrizar: "#ff3d5a",
  sensor: "#ffd166",
  condicional: "#ff6b35",
  base: "#6b7280",
  mision: "#c084fc",
};

const STEP_ICON: Record<StepKind, string> = {
  despegar: "⬆",
  mover: "➤",
  aterrizar: "⬇",
  sensor: "◉",
  condicional: "◆",
  base: "⌂",
  mision: "▣",
};

// Helper para dibujar rectángulos redondeados con compatibilidad hacia atrás
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (r > w / 2) r = w / 2;
  if (r > h / 2) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface Props {
  ast: ProgramaNode | null;
  errors: Array<{ message: string; line: number }>;
}

export default function DroneVisualizer({ ast, errors }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [isIsometric, setIsIsometric] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<0.5 | 1 | 2>(1);

  const dronePosRef = useRef({ x: 0, y: 0, z: 0 });
  const rotorAngleRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs de elementos HUD para actualizaciones rápidas (60fps) sin re-renderizar React
  const altValRef = useRef<HTMLSpanElement>(null);
  const xValRef = useRef<HTMLSpanElement>(null);
  const yValRef = useRef<HTMLSpanElement>(null);
  const statusValRef = useRef<HTMLSpanElement>(null);
  const rotorsValRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ast || errors?.length > 0) {
      setSteps([]);
      setCurrentStep(-1);
      setPlaying(false);
      dronePosRef.current = { x: 0, y: 0, z: 0 };
      return;
    }
    setSteps(interpretAST(ast));
    setCurrentStep(-1);
    setPlaying(false);
    dronePosRef.current = { x: 0, y: 0, z: 0 };
  }, [ast, errors]);

  // Bucle de animación para interpolación suave y renderizado continuo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;

    const update = () => {
      // 1. Calcular posición destino
      const target =
        currentStep >= 0 && steps[currentStep]
          ? {
              x: steps[currentStep].x,
              y: steps[currentStep].y,
              z: steps[currentStep].z,
            }
          : { x: 0, y: 0, z: 0 };

      const dx = target.x - dronePosRef.current.x;
      const dy = target.y - dronePosRef.current.y;
      const dz = target.z - dronePosRef.current.z;

      // Velocidad de interpolación proporcional a la velocidad de simulación
      const lerpFactor = Math.min(0.3, 0.08 * speedMultiplier);
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dz) < 0.1) {
        dronePosRef.current = target;
      } else {
        dronePosRef.current.x += dx * lerpFactor;
        dronePosRef.current.y += dy * lerpFactor;
        dronePosRef.current.z += dz * lerpFactor;
      }

      // Animación de rotación de las hélices
      if (dronePosRef.current.z > 0.5) {
        rotorAngleRef.current += 0.25 * speedMultiplier;
      } else {
        // Detener hélices alineándolas gradualmente
        const diff = 0 - (rotorAngleRef.current % (Math.PI * 2));
        rotorAngleRef.current += diff * 0.1;
      }

      // 2. Actualizar paneles HUD directamente en el DOM
      const dronePos = dronePosRef.current;
      if (altValRef.current)
        altValRef.current.innerText = `${dronePos.z.toFixed(1)} m`;
      if (xValRef.current)
        xValRef.current.innerText = `${dronePos.x.toFixed(1)} m`;
      // Invertimos Y para que Norte sea positivo visualmente
      if (yValRef.current)
        yValRef.current.innerText = `${(-dronePos.y).toFixed(1)} m`;

      let statusStr = "EN TIERRA";
      let statusColor = "#ff3d5a";
      let rotorsStr = "APAGADOS";
      let rotorsColor = "#ff3d5a";

      if (dronePos.z > 0.5) {
        rotorsStr = "ACTIVOS";
        rotorsColor = "#00e5a0";

        const dzDiff = target.z - dronePos.z;
        if (Math.abs(dzDiff) > 1) {
          statusStr = dzDiff > 0 ? "ASCENDIENDO" : "DESCENDIENDO";
          statusColor = "#ffd166";
        } else {
          statusStr = "EN VUELO";
          statusColor = "#4d9eff";
        }
      } else if (target.z > 0) {
        statusStr = "INICIANDO";
        statusColor = "#00e5a0";
        rotorsStr = "ARRANCANDO";
        rotorsColor = "#ffd166";
      }

      if (statusValRef.current) {
        statusValRef.current.innerText = statusStr;
        statusValRef.current.style.color = statusColor;
      }
      if (rotorsValRef.current) {
        rotorsValRef.current.innerText = rotorsStr;
        rotorsValRef.current.style.color = rotorsColor;
      }

      // 3. Renderizar Canvas
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#0a0f1d";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Parámetros de transformación isométrica
      const SCALE_Z_ISO = 0.7;
      const SCALE_Z_2D = 0.7;
      const ISO_SCALE = SCALE * 0.9;
      const cos30 = Math.cos(Math.PI / 6);
      const sin30 = Math.sin(Math.PI / 6);

      const project = (px: number, py: number, pz: number) => {
        if (isIsometric) {
          return {
            x: ORIGIN_X + (px - py) * cos30 * ISO_SCALE,
            y: ORIGIN_Y + (px + py) * sin30 * ISO_SCALE - pz * SCALE_Z_ISO,
          };
        } else {
          return {
            x: ORIGIN_X + px * SCALE,
            y: ORIGIN_Y + py * SCALE - pz * SCALE_Z_2D,
          };
        }
      };

      // Dibujar cuadrícula basada en coordenadas físicas
      const limit = 350;
      const gridStep = 50;
      ctx.strokeStyle = "#141923";
      ctx.lineWidth = 1;

      for (let g = -limit; g <= limit; g += gridStep) {
        // Línea paralela a eje Y (Y variable, X constante)
        const p1 = project(g, -limit, 0);
        const p2 = project(g, limit, 0);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Línea paralela a eje X (X variable, Y constante)
        const p3 = project(-limit, g, 0);
        const p4 = project(limit, g, 0);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      // Dibujar ejes principales
      ctx.strokeStyle = "#1f2736";
      ctx.lineWidth = 1.5;
      const x1 = project(-limit, 0, 0);
      const x2 = project(limit, 0, 0);
      ctx.beginPath();
      ctx.moveTo(x1.x, x1.y);
      ctx.lineTo(x2.x, x2.y);
      ctx.stroke();

      const y1 = project(0, -limit, 0);
      const y2 = project(0, limit, 0);
      ctx.beginPath();
      ctx.moveTo(y1.x, y1.y);
      ctx.lineTo(y2.x, y2.y);
      ctx.stroke();

      // Indicaciones de puntos cardinales
      ctx.fillStyle = "#3e485c";
      ctx.font = "bold 11px Space Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelOffset = limit + 18;
      const posN = project(0, -labelOffset, 0);
      const posS = project(0, labelOffset, 0);
      const posE = project(labelOffset, 0, 0);
      const posO = project(-labelOffset, 0, 0);
      ctx.fillText("N", posN.x, posN.y);
      ctx.fillText("S", posS.x, posS.y);
      ctx.fillText("E", posE.x, posE.y);
      ctx.fillText("O", posO.x, posO.y);

      // Dibujar base
      const basePos = project(0, 0, 0);
      ctx.fillStyle = "rgba(0, 229, 160, 0.08)";
      ctx.strokeStyle = "rgba(0, 229, 160, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (isIsometric) {
        ctx.ellipse(basePos.x, basePos.y, 22, 11, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(basePos.x, basePos.y, 16, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#00e5a0";
      ctx.font = "bold 9px Space Mono, monospace";
      ctx.fillText("BASE", basePos.x, basePos.y);

      // Dibujar trayectorias
      const stepsToRender =
        currentStep >= 0 ? steps.slice(0, currentStep + 1) : [];
      const path: Array<{ x: number; y: number; z: number }> = [
        { x: 0, y: 0, z: 0 },
      ];
      for (const step of stepsToRender) {
        path.push({ x: step.x, y: step.y, z: step.z });
      }

      // 1. Sombra de la trayectoria en el suelo
      if (path.length > 1) {
        ctx.strokeStyle = "rgba(77, 158, 255, 0.12)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const pStart = project(path[0].x, path[0].y, 0);
        ctx.moveTo(pStart.x, pStart.y);
        for (let i = 1; i < path.length; i++) {
          const p = project(path[i].x, path[i].y, 0);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Línea de vuelo 3D
      if (path.length > 1) {
        ctx.strokeStyle = "rgba(77, 158, 255, 0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const pStart = project(path[0].x, path[0].y, path[0].z);
        ctx.moveTo(pStart.x, pStart.y);
        for (let i = 1; i < path.length; i++) {
          const p = project(path[i].x, path[i].y, path[i].z);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // Flechas de dirección
        for (let i = 1; i < path.length; i++) {
          const pFrom = project(path[i - 1].x, path[i - 1].y, path[i - 1].z);
          const pTo = project(path[i].x, path[i].y, path[i].z);
          const dist2D = Math.hypot(pTo.x - pFrom.x, pTo.y - pFrom.y);
          if (dist2D > 18) {
            const angle = Math.atan2(pTo.y - pFrom.y, pTo.x - pFrom.x);
            const mx = (pFrom.x + pTo.x) / 2;
            const my = (pFrom.y + pTo.y) / 2;
            ctx.fillStyle = "#4d9eff";
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(angle) * 5, my + Math.sin(angle) * 5);
            ctx.lineTo(
              mx + Math.cos(angle + 2.4) * 3.5,
              my + Math.sin(angle + 2.4) * 3.5,
            );
            ctx.lineTo(
              mx + Math.cos(angle - 2.4) * 3.5,
              my + Math.sin(angle - 2.4) * 3.5,
            );
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // Dibujar marcadores de eventos en el recorrido
      for (const step of stepsToRender) {
        const stepGround = project(step.x, step.y, 0);
        const stepPos = project(step.x, step.y, step.z);

        if (step.kind === "despegar") {
          ctx.strokeStyle = "rgba(0, 229, 160, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (isIsometric) {
            ctx.ellipse(stepGround.x, stepGround.y, 16, 8, 0, 0, Math.PI * 2);
          } else {
            ctx.arc(stepGround.x, stepGround.y, 14, 0, Math.PI * 2);
          }
          ctx.stroke();
        }
        if (step.kind === "aterrizar") {
          ctx.fillStyle = "rgba(255, 61, 90, 0.1)";
          ctx.strokeStyle = "rgba(255, 61, 90, 0.4)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (isIsometric) {
            ctx.ellipse(stepGround.x, stepGround.y, 16, 8, 0, 0, Math.PI * 2);
          } else {
            ctx.arc(stepGround.x, stepGround.y, 14, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.stroke();
        }
        if (step.kind === "sensor") {
          ctx.strokeStyle = "rgba(255, 209, 102, 0.35)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (isIsometric) {
            ctx.ellipse(stepPos.x, stepPos.y, 20, 10, 0, 0, Math.PI * 2);
          } else {
            ctx.arc(stepPos.x, stepPos.y, 16, 0, Math.PI * 2);
          }
          ctx.stroke();
        }
        if (step.kind === "condicional") {
          ctx.strokeStyle = "rgba(255, 107, 53, 0.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(stepPos.x, stepPos.y - 10);
          ctx.lineTo(stepPos.x + 8, stepPos.y);
          ctx.lineTo(stepPos.x, stepPos.y + 10);
          ctx.lineTo(stepPos.x - 8, stepPos.y);
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Dibujar Dron y su Sombra
      const shadowPos = project(dronePos.x, dronePos.y, 0);
      const dronePosRender = project(dronePos.x, dronePos.y, dronePos.z);

      // Sombra en el suelo (se difumina y agranda según la altitud)
      const hFactor = Math.min(1.6, 1 + dronePos.z / 180);
      const shadowOpacity = Math.max(0.08, 0.42 - dronePos.z / 220);
      ctx.fillStyle = `rgba(5, 7, 12, ${shadowOpacity})`;
      ctx.beginPath();
      if (isIsometric) {
        ctx.ellipse(
          shadowPos.x,
          shadowPos.y,
          16 * hFactor,
          8 * hFactor,
          0,
          0,
          Math.PI * 2,
        );
      } else {
        ctx.ellipse(
          shadowPos.x,
          shadowPos.y,
          14 * hFactor,
          7 * hFactor,
          0,
          0,
          Math.PI * 2,
        );
      }
      ctx.fill();

      // Línea vertical indicadora de altitud
      if (dronePos.z > 1) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(shadowPos.x, shadowPos.y);
        ctx.lineTo(dronePosRender.x, dronePosRender.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Etiqueta flotante con altitud
        ctx.fillStyle = "rgba(10, 15, 25, 0.8)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        const tagW = 38;
        const tagH = 14;
        const tagX = (shadowPos.x + dronePosRender.x) / 2 + 10;
        const tagY = (shadowPos.y + dronePosRender.y) / 2 - tagH / 2;

        drawRoundRect(ctx, tagX, tagY, tagW, tagH, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#8f99ad";
        ctx.font = "bold 8px Space Mono, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${dronePos.z.toFixed(0)}m`,
          tagX + tagW / 2,
          tagY + tagH / 2,
        );
      }

      // Estructura del Dron (brazos, motores y hélices)
      const dScale = isIsometric ? 1 : 1 + dronePos.z / 300;
      const armLen = 11 * dScale;
      const arms: [number, number][] = [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ];

      // Brazos diagonales (adaptando la elipse si es isométrica)
      ctx.strokeStyle = "#1d2330";
      ctx.lineWidth = 3.5 * dScale;
      for (const [ax, ay] of arms) {
        ctx.beginPath();
        ctx.moveTo(dronePosRender.x, dronePosRender.y);
        ctx.lineTo(
          dronePosRender.x + ax * armLen,
          dronePosRender.y + ay * armLen * (isIsometric ? 0.65 : 1),
        );
        ctx.stroke();
      }

      // Motores / Protectores de rotores
      for (const [ax, ay] of arms) {
        const mx = dronePosRender.x + ax * armLen;
        const my = dronePosRender.y + ay * armLen * (isIsometric ? 0.65 : 1);
        const radius = 5.5 * dScale;

        ctx.fillStyle = "rgba(77, 158, 255, 0.18)";
        ctx.beginPath();
        if (isIsometric) {
          ctx.ellipse(mx, my, radius, radius * 0.5, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(mx, my, radius, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.strokeStyle = "#4d9eff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (isIsometric) {
          ctx.ellipse(mx, my, radius, radius * 0.5, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(mx, my, radius, 0, Math.PI * 2);
        }
        ctx.stroke();
      }

      // Hélices en movimiento
      const bAngle = rotorAngleRef.current;
      const bladeLen = 6 * dScale;
      ctx.strokeStyle = "rgba(224, 231, 255, 0.75)";
      ctx.lineWidth = 1.2;
      for (const [ax, ay] of arms) {
        const mx = dronePosRender.x + ax * armLen;
        const my = dronePosRender.y + ay * armLen * (isIsometric ? 0.65 : 1);

        // Aspa 1
        ctx.beginPath();
        ctx.moveTo(
          mx - Math.cos(bAngle) * bladeLen,
          my - Math.sin(bAngle) * bladeLen * (isIsometric ? 0.5 : 1),
        );
        ctx.lineTo(
          mx + Math.cos(bAngle) * bladeLen,
          my + Math.sin(bAngle) * bladeLen * (isIsometric ? 0.5 : 1),
        );
        ctx.stroke();

        // Aspa 2
        ctx.beginPath();
        ctx.moveTo(
          mx - Math.cos(bAngle + Math.PI / 2) * bladeLen,
          my -
            Math.sin(bAngle + Math.PI / 2) * bladeLen * (isIsometric ? 0.5 : 1),
        );
        ctx.lineTo(
          mx + Math.cos(bAngle + Math.PI / 2) * bladeLen,
          my +
            Math.sin(bAngle + Math.PI / 2) * bladeLen * (isIsometric ? 0.5 : 1),
        );
        ctx.stroke();
      }

      // Cuerpo Central (Fusible)
      const bodyRad = 8.5 * dScale;
      ctx.fillStyle = "#161b26";
      ctx.beginPath();
      if (isIsometric) {
        ctx.ellipse(
          dronePosRender.x,
          dronePosRender.y,
          bodyRad,
          bodyRad * 0.65,
          0,
          0,
          Math.PI * 2,
        );
      } else {
        ctx.arc(dronePosRender.x, dronePosRender.y, bodyRad, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.strokeStyle = "#00e5a0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (isIsometric) {
        ctx.ellipse(
          dronePosRender.x,
          dronePosRender.y,
          bodyRad,
          bodyRad * 0.65,
          0,
          0,
          Math.PI * 2,
        );
      } else {
        ctx.arc(dronePosRender.x, dronePosRender.y, bodyRad, 0, Math.PI * 2);
      }
      ctx.stroke();

      // LED de estado central parpadeante
      const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
      const ledColor =
        dronePos.z > 0.5
          ? `rgba(0, 229, 160, ${0.4 + pulse * 0.6})`
          : "rgba(255, 61, 90, 0.8)";
      ctx.fillStyle = ledColor;
      ctx.beginPath();
      ctx.arc(dronePosRender.x, dronePosRender.y, 3 * dScale, 0, Math.PI * 2);
      ctx.fill();

      animFrameId = requestAnimationFrame(update);
    };

    animFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrameId);
  }, [steps, currentStep, isIsometric, speedMultiplier]);

  // Manejo del control automático del paso a paso
  useEffect(() => {
    if (playing) {
      const intervalTime = 700 / speedMultiplier;
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, intervalTime);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, steps, speedMultiplier]);

  const hasErrors = errors?.length > 0;
  const noSteps = steps.length === 0;
  const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };

  const btnStyle = (
    bg: string,
    color: string,
    disabled = false,
  ): React.CSSProperties => ({
    background: bg,
    color,
    border: `1px solid ${color.startsWith("var") ? "var(--border)" : `${color}44`}`,
    padding: "6px 14px",
    borderRadius: 4,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 12,
    ...mono,
    opacity: disabled ? 0.3 : 1,
    transition: "all 0.15s",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-app)",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
        />

        {/* HUD de Telemetría (Esquina superior izquierda) */}
        {!noSteps && !hasErrors && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(10, 15, 30, 0.75)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(77, 158, 255, 0.2)",
              borderRadius: 6,
              padding: "10px 14px",
              ...mono,
              fontSize: 10,
              color: "#8f99ad",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                color: "#4d9eff",
                fontWeight: "bold",
                fontSize: 11,
                marginBottom: 2,
              }}
            >
              TELEMETRÍA DRON
            </div>
            <div>
              ALTITUD:{" "}
              <span
                ref={altValRef}
                style={{ color: "#e8ecf5", fontWeight: "bold" }}
              >
                0.0 m
              </span>
            </div>
            <div>
              COORD X:{" "}
              <span
                ref={xValRef}
                style={{ color: "#e8ecf5", fontWeight: "bold" }}
              >
                0.0 m
              </span>
            </div>
            <div>
              COORD Y:{" "}
              <span
                ref={yValRef}
                style={{ color: "#e8ecf5", fontWeight: "bold" }}
              >
                0.0 m
              </span>
            </div>
          </div>
        )}

        {/* HUD de Estado de Motores (Esquina superior derecha) */}
        {!noSteps && !hasErrors && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(10, 15, 30, 0.75)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(77, 158, 255, 0.2)",
              borderRadius: 6,
              padding: "10px 14px",
              ...mono,
              fontSize: 10,
              color: "#8f99ad",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                color: "#4d9eff",
                fontWeight: "bold",
                fontSize: 11,
                marginBottom: 2,
              }}
            >
              SISTEMA DE MOTORES
            </div>
            <div>
              ESTADO:{" "}
              <span
                ref={statusValRef}
                style={{ color: "#ff3d5a", fontWeight: "bold" }}
              >
                EN TIERRA
              </span>
            </div>
            <div>
              ROTORES:{" "}
              <span
                ref={rotorsValRef}
                style={{ color: "#ff3d5a", fontWeight: "bold" }}
              >
                APAGADOS
              </span>
            </div>
          </div>
        )}

        {/* HUD de Selección de Vista (Esquina inferior derecha) */}
        {!noSteps && !hasErrors && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              display: "flex",
              gap: 6,
            }}
          >
            <button
              onClick={() => setIsIsometric(false)}
              style={{
                background: !isIsometric ? "#4d9eff" : "rgba(16, 22, 35, 0.8)",
                color: !isIsometric ? "#0d0f14" : "#8f99ad",
                border: "1px solid rgba(77, 158, 255, 0.3)",
                borderRadius: 4,
                padding: "5px 12px",
                fontSize: 10,
                cursor: "pointer",
                fontWeight: "bold",
                ...mono,
                transition: "all 0.15s",
              }}
            >
              VISTA 2D
            </button>
            <button
              onClick={() => setIsIsometric(true)}
              style={{
                background: isIsometric ? "#4d9eff" : "rgba(16, 22, 35, 0.8)",
                color: isIsometric ? "#0d0f14" : "#8f99ad",
                border: "1px solid rgba(77, 158, 255, 0.3)",
                borderRadius: 4,
                padding: "5px 12px",
                fontSize: 10,
                cursor: "pointer",
                fontWeight: "bold",
                ...mono,
                transition: "all 0.15s",
              }}
            >
              ISOMÉTRICA 3D
            </button>
          </div>
        )}

        {(hasErrors || noSteps) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
              color: "#252a38",
              fontSize: 12,
              textAlign: "center",
              ...mono,
            }}
          >
            <div style={{ fontSize: 32, opacity: 0.4 }}>
              {hasErrors ? "✗" : "◈"}
            </div>
            <span>
              {hasErrors
                ? "Corregí los errores para visualizar"
                : "Analizá código DroneScript para ver la simulación"}
            </span>
          </div>
        )}
      </div>

      {!noSteps && !hasErrors && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 16px",
            background: "var(--bg-panel)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => {
                  setPlaying(false);
                  setCurrentStep(i);
                }}
                title={step.label}
                style={{
                  padding: "3px 8px",
                  borderRadius: 3,
                  border: `1px solid ${i === currentStep ? STEP_COLOR[step.kind] : "var(--border)"}`,
                  cursor: "pointer",
                  fontSize: 11,
                  ...mono,
                  background:
                    i === currentStep
                      ? `${STEP_COLOR[step.kind]}22`
                      : i < currentStep
                        ? "var(--bg-panel)"
                        : "var(--bg-app)",
                  color:
                    i === currentStep
                      ? STEP_COLOR[step.kind]
                      : i < currentStep
                        ? "var(--text-muted)"
                        : "var(--border)",
                  transition: "all 0.15s",
                }}
              >
                {STEP_ICON[step.kind] || "·"}
              </button>
            ))}
          </div>
          {currentStep >= 0 && (
            <div
              style={{
                fontSize: 11,
                ...mono,
                color: STEP_COLOR[steps[currentStep]?.kind],
                marginBottom: 8,
              }}
            >
              {steps[currentStep]?.label}{" "}
              <span style={{ color: "var(--text-muted)" }}>
                — paso {currentStep + 1}/{steps.length}
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setPlaying(false);
                setCurrentStep(-1);
                dronePosRef.current = { x: 0, y: 0, z: 0 };
              }}
              style={btnStyle("var(--bg-panel)", "var(--text-muted)")}
            >
              ↩ Reset
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setCurrentStep((p) => Math.max(-1, p - 1));
              }}
              disabled={currentStep < 0}
              style={btnStyle("var(--bg-panel)", "#4d9eff", currentStep < 0)}
            >
              ◀
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              style={btnStyle(
                playing ? "#ff6b3522" : "#00e5a022",
                playing ? "#ff6b35" : "#00e5a0",
              )}
            >
              {playing ? "⏸ Pausar" : "▶ Play"}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setCurrentStep((p) => Math.min(steps.length - 1, p + 1));
              }}
              disabled={currentStep >= steps.length - 1}
              style={btnStyle(
                "var(--bg-panel)",
                "#4d9eff",
                currentStep >= steps.length - 1,
              )}
            >
              ▶
            </button>

            {/* Separador vertical y botones de velocidad */}
            <div
              style={{ width: 1, background: "var(--border)", margin: "0 6px" }}
            />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  marginRight: 4,
                  ...mono,
                }}
              >
                Velocidad:
              </span>
              {([0.5, 1, 2] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  style={{
                    background:
                      speedMultiplier === spd
                        ? "rgba(77, 158, 255, 0.15)"
                        : "var(--bg-panel)",
                    color:
                      speedMultiplier === spd ? "#4d9eff" : "var(--text-muted)",
                    border: `1px solid ${speedMultiplier === spd ? "#4d9eff" : "var(--border)"}`,
                    padding: "4px 8px",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: "bold",
                    ...mono,
                    transition: "all 0.15s",
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
