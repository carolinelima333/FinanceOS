import { ResponsiveContainer } from "recharts";

export function ChartCard({ title, children, t, height = 220 }) {
  return (
    <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:24 }}>
      <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:20 }}>{title}</div>
      <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
    </div>
  );
}

export const tooltipStyle = t => ({
  contentStyle: { background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, color:t.text, fontSize:12 },
  itemStyle:    { color:t.text },
});
