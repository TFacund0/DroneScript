interface Props {
  isDark: boolean;
  toggleTheme: () => void;
}

export default function Header({ isDark, toggleTheme }: Props) {
  return (
    <header
      style={{
        padding: "12px 24px",
        borderBottom: isDark ? "1px solid #252a38" : "1px solid #cbd5e1",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: isDark ? "#13161e" : "#f1f5f9",
        color: isDark ? "#e8ecf5" : "#0f172a",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "-0.5px",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        Drone<span style={{ color: "#00e5a0" }}>Script</span>
      </div>
      <button
        onClick={toggleTheme}
        style={{
          background: "transparent",
          border: isDark ? "1px solid #252a38" : "1px solid #cbd5e1",
          borderRadius: 4,
          color: isDark ? "#6b7280" : "#475569",
          fontSize: 10,
          padding: "3px 8px",
          cursor: "pointer",
          fontFamily: "'Space Mono', monospace",
          display: "flex",
          alignItems: "center",
          gap: 4,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.borderColor = "#00e5a0";
          (e.target as HTMLButtonElement).style.color = "#00e5a0";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.borderColor = isDark ? "#252a38" : "#cbd5e1";
          (e.target as HTMLButtonElement).style.color = isDark ? "#6b7280" : "#475569";
        }}
      >
        {isDark ? "☀️ CLARO" : "🌙 OSCURO"}
      </button>
    </header>
  );
}
