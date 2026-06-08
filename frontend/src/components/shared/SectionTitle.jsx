export function SectionTitle({ title, sub, t }) {
  return (
    <div style={{ marginBottom:24 }}>
      <h2 style={{ fontSize:22, fontWeight:700, color:t.text, margin:0 }}>{title}</h2>
      {sub && <p style={{ fontSize:13, color:t.muted, margin:"4px 0 0" }}>{sub}</p>}
    </div>
  );
}
