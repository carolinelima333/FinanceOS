export function Toast({ toast }) {
  if (!toast) return null;
  const colors = { success:"#10B981", info:"#6366F1", error:"#EF4444" };
  const c = colors[toast.type] || "#10B981";
  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:9999,
      background:c, color:"white", padding:"12px 22px",
      borderRadius:12, fontSize:13, fontWeight:500,
      boxShadow:`0 8px 30px ${c}40`,
      animation:"fadeIn 0.2s ease",
      maxWidth:320,
    }}>{toast.msg}</div>
  );
}
