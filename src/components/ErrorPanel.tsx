import type { AnalyzerResult } from "@dronescript/core";

interface Props {
  result: AnalyzerResult;
}

export default function ErrorPanel({ result }: Props) {
  const errors = result.errors;
  const warnings = result.warnings;
  if (errors.length === 0 && warnings.length === 0)
    return (
      <div
        style={{
          padding: "14px 16px",
          background: "#00e5a010",
          border: "1px solid #00e5a030",
          borderRadius: 6,
          color: "#00e5a0",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
        }}
      >
        ✓ Sin errores — la cadena es válida en DroneScript
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#6b7280",
          marginBottom: 4,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {errors.length} error{errors.length !== 1 ? "es" : ""}
        {warnings.length > 0 &&
          ` · ${warnings.length} advertencia${warnings.length !== 1 ? "s" : ""}`}
      </div>
      {errors.map((err, i) => (
        <div
          key={i}
          style={{
            padding: "14px 16px",
            background: "#ff3d5a10",
            border: "1px solid #ff3d5a30",
            borderRadius: 6,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 6,
              fontSize: 12,
              color: "#ff3d5a",
            }}
          >
            ✗ Error — línea {err.line || "?"}
          </div>
          <div style={{ color: "#ff8099", fontSize: 11, lineHeight: 1.6 }}>
            {err.message}
          </div>
        </div>
      ))}
      {warnings.map((warn, i) => (
        <div
          key={`w${i}`}
          style={{
            padding: "14px 16px",
            background: "#ffd16610",
            border: "1px solid #ffd16630",
            borderRadius: 6,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 6,
              fontSize: 12,
              color: "#ffd166",
            }}
          >
            ⚠ Advertencia — línea {warn.line || "?"}
          </div>
          <div style={{ color: "#ffe3a3", fontSize: 11, lineHeight: 1.6 }}>
            {warn.message}
          </div>
        </div>
      ))}
    </div>
  );
}
