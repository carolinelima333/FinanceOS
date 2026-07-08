import { useState, useEffect, useCallback } from "react";
import { TH, MENU, fmt } from "./constants.js";
import { api } from "./lib/api.js";
import { AuthScreen }   from "./components/AuthScreen.jsx";
import { Sidebar }      from "./components/Sidebar.jsx";
import { BrandLogo }    from "./components/shared/BrandLogo.jsx";
import { Toast }        from "./components/Toast.jsx";
import { Dashboard }    from "./components/Dashboard.jsx";
import { Dividas }      from "./components/Dividas.jsx";
import { Planejamento } from "./components/Planejamento.jsx";
import { Inteligencia } from "./components/Inteligencia.jsx";
import { Relatorios }   from "./components/Relatorios.jsx";
import { Arquivo }      from "./components/Arquivo.jsx";
import { Auditoria }    from "./components/Auditoria.jsx";
import { SalaryModal }    from "./components/modals/SalaryModal.jsx";
import { AssistantChat } from "./components/AssistantChat.jsx";

export default function App() {
  const [authed,      setAuthed]      = useState(false);
  const [screen,      setScreen]      = useState("dashboard");
  const [dark,        setDark]        = useState(true);
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [mobile,      setMobile]      = useState(() => window.innerWidth < 768);
  const [debts,       setDebts]       = useState([]);
  const [toast,       setToast]       = useState(null);
  const [loaded,      setLoaded]      = useState(false);
  const [salary,        setSalary]        = useState(0);
  const [cashBalance,   setCashBalance]   = useState(0);
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [showSalary,    setShowSalary]    = useState(false);
  const [userEmail,     setUserEmail]     = useState("");

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const t     = dark ? TH.dark : TH.light;
  const sideW = mobile ? 0 : (collapsed ? 64 : 232);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadSettings = useCallback((s) => {
    setSalary(Number(s.salary) || 0);
    setCashBalance(Number(s.cash_balance) || 0);
    setEffectiveDate(s.effective_date || null);
  }, []);

  useEffect(() => {
    const savedDark = localStorage.getItem("fos-dark");
    if (savedDark !== null) setDark(savedDark === "1");

    const token = localStorage.getItem("fos-token");
    const email = localStorage.getItem("fos-email");
    if (email) setUserEmail(email);
    if (!token) { setLoaded(true); return; }

    Promise.all([api.getDebts(), api.getSettings()])
      .then(([debtsData, settings]) => {
        setDebts(debtsData);
        loadSettings(settings);
        setAuthed(true);
      })
      .catch(() => localStorage.removeItem("fos-token"))
      .finally(() => setLoaded(true));
  }, []);

  const handleLogin = useCallback((email) => {
    setAuthed(true);
    if (email) { setUserEmail(email); localStorage.setItem("fos-email", email); }
    Promise.all([api.getDebts(), api.getSettings()])
      .then(([debtsData, settings]) => {
        setDebts(debtsData);
        loadSettings(settings);
      })
      .catch(() => showToast("Erro ao carregar dados", "error"));
  }, [showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("fos-token");
    localStorage.removeItem("fos-email");
    setAuthed(false);
    setDebts([]);
    setSalary(0);
    setCashBalance(0);
    setUserEmail("");
    setScreen("dashboard");
  }, []);

  const toggleDark = () => {
    const nd = !dark;
    setDark(nd);
    localStorage.setItem("fos-dark", nd ? "1" : "0");
  };

  const handleSalarySave = async (newSalary, newCash, newDate) => {
    try {
      const saved = await api.saveSettings(newSalary, newCash, newDate);
      loadSettings(saved);
      setShowSalary(false);
      showToast("Configurações salvas!");
    } catch {
      showToast("Erro ao salvar. Tente novamente.", "error");
    }
  };

  const handleSetScreen = useCallback((id) => {
    setScreen(id);
    if (mobile) setMobileOpen(false);
  }, [mobile]);

  const handleHamburger = () => {
    if (mobile) setMobileOpen(o => !o);
    else setCollapsed(c => !c);
  };

  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:"#060C18", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#6366F1", fontSize:14 }}>Carregando FinanceOS...</div>
    </div>
  );

  if (!authed) return <AuthScreen onLogin={handleLogin} />;

  const screens = {
    dashboard:    <Dashboard    debts={debts} t={t} salary={salary} cashBalance={cashBalance} />,
    dividas:      <Dividas      debts={debts} setDebts={setDebts} t={t} showToast={showToast} />,
    planejamento: <Planejamento debts={debts} t={t} salary={salary} />,
    inteligencia: <Inteligencia debts={debts} t={t} salary={salary} />,
    relatorios:   <Relatorios   debts={debts} t={t} showToast={showToast} salary={salary} />,
    arquivo:      <Arquivo      debts={debts} setDebts={setDebts} t={t} showToast={showToast} />,
    auditoria:    <Auditoria    t={t} />,
  };

  return (
    <div style={{ minHeight:"100vh", background:t.bg, color:t.text, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes bounce  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.3); border-radius:99px }
        @media (max-width: 768px) {
          .grid-2col  { grid-template-columns: 1fr !important; }
          .grid-stat  { grid-template-columns: repeat(2, 1fr) !important; }
          .debt-actions { flex-direction: row !important; flex-wrap: wrap !important; align-items: flex-start !important; }
          .filter-bar { overflow-x: auto; padding-bottom: 4px; flex-wrap: nowrap !important; }
        }
        @media (max-width: 480px) {
          .grid-stat  { grid-template-columns: 1fr !important; }
          .grid-2col  { grid-template-columns: 1fr !important; }
          .filter-bar { flex-wrap: nowrap !important; }
        }
      `}</style>

      <Toast toast={toast} />

      {/* Overlay escuro quando sidebar mobile está aberta */}
      {mobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position:"fixed", inset:0, zIndex:99, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(2px)" }}
        />
      )}

      {showSalary && <SalaryModal t={t} salary={salary} cashBalance={cashBalance} effectiveDate={effectiveDate} onSave={handleSalarySave} onClose={() => setShowSalary(false)} />}

      <Sidebar
        screen={screen}
        setScreen={handleSetScreen}
        t={t}
        collapsed={collapsed}
        logout={handleLogout}
        userEmail={userEmail}
        mobile={mobile}
        mobileOpen={mobileOpen}
      />

      <div style={{ marginLeft:sideW, transition:"margin 0.25s ease", minHeight:"100vh" }}>
        {/* Header */}
        <div style={{
          position:"sticky", top:0, zIndex:50, height:58,
          background: dark ? "rgba(6,12,24,0.92)" : t.surface,
          borderBottom:`1px solid ${t.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 20px", backdropFilter:"blur(12px)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={handleHamburger}
              style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:18, padding:"4px 6px", borderRadius:6, flexShrink:0 }}>
              ☰
            </button>
            {mobile ? (
              <BrandLogo size={28} showText layout="row"
                textColor={t.text}
                accentColor={t.primary}
                mutedColor={t.muted}
              />
            ) : (
              <div style={{ fontSize:14, fontWeight:600, color:t.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {MENU.find(m => m.id === screen)?.label}
              </div>
            )}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <button onClick={() => setShowSalary(true)} style={{
              background: salary > 0 ? t.primaryDim : "rgba(239,68,68,0.08)",
              border:`1px solid ${salary > 0 ? t.border : "rgba(239,68,68,0.25)"}`,
              borderRadius:20, padding:"4px 12px", cursor:"pointer",
              color: salary > 0 ? t.muted : "#EF4444",
              fontSize:11, fontWeight:500, fontFamily:"inherit", whiteSpace:"nowrap",
            }}>
              {salary > 0
                ? (mobile
                    ? fmt(salary)
                    : `Salário: ${fmt(salary)}${cashBalance > 0 ? ` · Caixa: ${fmt(cashBalance)}` : ""}${effectiveDate ? ` · desde ${effectiveDate.split("-").reverse().join("/")}` : ""}`)
                : "⚠ Configurar salário"}
            </button>
            {!mobile && (
              <button onClick={toggleDark} style={{
                background:t.primaryDim, border:`1px solid ${t.border}`, borderRadius:8,
                padding:"6px 14px", cursor:"pointer", color:t.text, fontSize:12, fontWeight:500, fontFamily:"inherit",
              }}>
                {dark ? "☀️ Claro" : "🌙 Escuro"}
              </button>
            )}
            {mobile && (
              <button onClick={toggleDark} style={{
                background:t.primaryDim, border:`1px solid ${t.border}`, borderRadius:8,
                padding:"6px 10px", cursor:"pointer", color:t.text, fontSize:14, fontFamily:"inherit",
              }}>
                {dark ? "☀️" : "🌙"}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: mobile ? "16px" : "28px", maxWidth:1280, margin:"0 auto" }}>
          {screens[screen]}
        </div>
      </div>

      <AssistantChat debts={debts} salary={salary} t={t} mobile={mobile} />
    </div>
  );
}
