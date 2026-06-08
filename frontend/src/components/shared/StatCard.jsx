export function StatCard({ icon, label, value, sub, color, t }) {
  return (
    <div style={{
      background:t.card, border:`1px solid ${t.border}`, borderRadius:16,
      padding:"20px 22px", borderTop:`3px solid ${color}`,
    }}>
      <div style={{ fontSize:22, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:700, color:t.text, marginBottom:3 }}>{value}</div>
      <div style={{ fontSize:12, color:t.muted, marginBottom:sub ? 6 : 0 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color, fontWeight:500 }}>{sub}</div>}
    </div>
  );
}
