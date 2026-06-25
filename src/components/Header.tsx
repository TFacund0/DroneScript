export default function Header() {
  return (
    <header style={{
      padding: '18px 28px', borderBottom: '1px solid #252a38',
      display: 'flex', alignItems: 'center', gap: 16, background: '#13161e',
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', fontFamily: "'Syne', sans-serif" }}>
        Drone<span style={{ color: '#00e5a0' }}>Script</span>
      </div>
      <div style={{
        fontSize: 11, fontFamily: "'Space Mono', monospace",
        background: '#00e5a020', color: '#00e5a0',
        border: '1px solid #00e5a040', padding: '3px 10px',
        borderRadius: 20, letterSpacing: 1,
      }}>
        PARSER DEMO — TC2026
      </div>
    </header>
  );
}
