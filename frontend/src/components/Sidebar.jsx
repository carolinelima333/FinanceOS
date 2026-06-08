import { MENU } from "../constants.js";
import { BrandLogo } from "./shared/BrandLogo.jsx";

export function Sidebar({ screen, setScreen, t, collapsed, logout, userEmail = "", mobile = false, mobileOpen = false }) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "??";

  const w = mobile ? 232 : (collapsed ? 64 : 232);
  const translateX = mobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)";

  return (
    <div style={{
      width: w,
      height:"100vh",
      background: t.surface,
      borderRight:`1px solid ${t.border}`,
      display:"flex",
      flexDirection:"column",
      position:"fixed",
      left:0,
      top:0,
      zIndex:100,
      transition:"width 0.25s ease, transform 0.25s ease",
      transform: translateX,
    }}>
      <div style={{ padding: (!mobile && collapsed) ? "14px 0" : "18px 20px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:(!mobile && collapsed) ? "center" : "flex-start", overflow:"hidden" }}>
        {(!mobile && collapsed) ? (
          <BrandLogo size={36} showText={false} />
        ) : (
          <BrandLogo size={38} showText layout="row" tagline
            textColor={t.text}
            accentColor={t.primary}
            mutedColor={t.muted}
          />
        )}
      </div>

      <nav style={{ flex:1, padding:"10px 0", overflowY:"auto" }}>
        {MENU.map(m => (
          <button key={m.id} onClick={() => setScreen(m.id)} style={{
            display:"flex", alignItems:"center", gap:10,
            width:"100%", padding: (!mobile && collapsed) ? "12px 0" : "11px 18px",
            border:"none", cursor:"pointer", textAlign:"left",
            background: screen===m.id ? t.primaryDim : "transparent",
            color: screen===m.id ? t.primary : t.muted,
            borderRight: screen===m.id ? `3px solid ${t.primary}` : "3px solid transparent",
            fontSize:14, fontWeight: screen===m.id ? 600 : 400,
            transition:"all 0.15s",
            justifyContent: (!mobile && collapsed) ? "center" : "flex-start",
            fontFamily:"inherit",
          }}>
            <span style={{ fontSize:18, lineHeight:1 }}>{m.icon}</span>
            {(mobile || !collapsed) && <span>{m.label}</span>}
          </button>
        ))}
      </nav>

      <div style={{
        padding: (!mobile && collapsed) ? "14px 0" : "14px 18px",
        borderTop:`1px solid ${t.border}`,
        display:"flex", alignItems:"center", gap:10,
        justifyContent: (!mobile && collapsed) ? "center" : "flex-start",
        overflow:"hidden",
      }}>
        <div onClick={logout} title="Sair" style={{
          width:34, height:34, borderRadius:"50%",
          background:"linear-gradient(135deg,#6366F1,#818CF8)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:700, color:"white", cursor:"pointer", flexShrink:0,
        }}>{initials}</div>
        {(mobile || !collapsed) && (
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userEmail || "Usuário"}</div>
            <div style={{ fontSize:10, color:t.muted }}>Clique para sair</div>
          </div>
        )}
      </div>
    </div>
  );
}
