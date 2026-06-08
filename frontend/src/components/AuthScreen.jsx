import { useState } from "react";
import { api } from "../lib/api.js";
import { BrandLogo } from "./shared/BrandLogo.jsx";

const FEATURES = [
  { icon: "📊", title: "Gestão de Dívidas",         desc: "Controle todas as suas dívidas em um só lugar" },
  { icon: "🎯", title: "Planejamento Inteligente",   desc: "Estratégias personalizadas de quitação" },
  { icon: "📈", title: "Relatórios e Análises",      desc: "Visualize seu progresso financeiro" },
  { icon: "🔒", title: "100% Seguro e Privado",      desc: "Seus dados protegidos com criptografia" },
];

function Field({ label, type = "text", value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, color: "#7B8FA6", marginBottom: 7, fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 10, boxSizing: "border-box",
          border: `1px solid ${focused ? "rgba(99,102,241,0.6)" : "rgba(99,102,241,0.18)"}`,
          background: focused ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
          color: "#EDF2FF", fontSize: 14, outline: "none", fontFamily: "inherit",
          transition: "border-color 0.2s, background 0.2s",
        }}
      />
    </div>
  );
}

function PasswordField({ value, onChange, show, onToggle, onEnter }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, color: "#7B8FA6", marginBottom: 7, fontWeight: 500 }}>
        Senha
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          onKeyDown={e => e.key === "Enter" && onEnter()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "12px 48px 12px 16px", borderRadius: 10, boxSizing: "border-box",
            border: `1px solid ${focused ? "rgba(99,102,241,0.6)" : "rgba(99,102,241,0.18)"}`,
            background: focused ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
            color: "#EDF2FF", fontSize: 14, outline: "none", fontFamily: "inherit",
            transition: "border-color 0.2s, background 0.2s",
          }}
        />
        <button type="button" onClick={onToggle} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: "#7B8FA6",
          fontSize: 16, lineHeight: 1, padding: "4px 6px", fontFamily: "inherit",
        }}>
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

export function AuthScreen({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [name,     setName]     = useState("");
  const [mode,     setMode]     = useState("login");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const switchMode = (m) => { setMode(m); setError(""); setPass(""); setShowPass(false); };

  const submit = async () => {
    setError("");
    if (!email || !pass) { setError("Preencha e-mail e senha."); return; }
    if (mode === "register" && !name.trim()) { setError("Informe seu nome completo."); return; }
    setLoading(true);
    try {
      const data = mode === "login"
        ? await api.login(email, pass)
        : await api.register(email, pass, name);
      if (data.token) {
        localStorage.setItem("fos-token", data.token);
        onLogin(email);
      } else {
        setError(data.message || "Confirme seu e-mail antes de entrar.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "#060C18",
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    }}>
      <style>{`
        @media (max-width: 768px) {
          .auth-left       { display: none !important; }
          .auth-right      { padding: 32px 24px !important; }
          .auth-logo-mobile { display: flex !important; }
        }
      `}</style>

      {/* ── Painel Esquerdo ─────────────────────────────────────── */}
      <div className="auth-left" style={{
        flex: "0 0 52%", position: "relative", overflow: "hidden",
        background: "linear-gradient(150deg,#0B1422 0%,#111E33 55%,#090f1c 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "60px 64px",
      }}>
        {/* Grade decorativa */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 1px 1px, rgba(99,102,241,0.1) 1px, transparent 0)", backgroundSize:"44px 44px", pointerEvents:"none" }}/>
        {/* Orbs */}
        <div style={{ position:"absolute", top:"-15%", left:"-15%", width:560, height:560, borderRadius:"50%", background:"rgba(99,102,241,0.07)", filter:"blur(110px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:420, height:420, borderRadius:"50%", background:"rgba(55,48,163,0.12)", filter:"blur(100px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"45%", right:"8%", width:220, height:220, borderRadius:"50%", background:"rgba(16,185,129,0.05)", filter:"blur(70px)", pointerEvents:"none" }}/>
        {/* Linha decorativa lateral direita */}
        <div style={{ position:"absolute", top:0, right:0, width:1, height:"100%", background:"linear-gradient(180deg,transparent,rgba(99,102,241,0.2) 30%,rgba(99,102,241,0.2) 70%,transparent)" }}/>

        {/* Conteúdo */}
        <div style={{ position:"relative", zIndex:1, maxWidth:460, width:"100%" }}>
          {/* Logo grande */}
          <div style={{ marginBottom: 52 }}>
            <BrandLogo size={68} showText layout="row" tagline />
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 44 }}>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "#EDF2FF", margin: "0 0 14px", lineHeight: 1.22, letterSpacing: "-0.6px" }}>
              Controle total sobre<br />suas finanças
            </h1>
            <p style={{ fontSize: 15, color: "#7B8FA6", margin: 0, lineHeight: 1.7, maxWidth: 380 }}>
              Gerencie suas dívidas com inteligência, planeje sua liberdade financeira e tome decisões com dados reais.
            </p>
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 650, color: "#EDF2FF", marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: "#7B8FA6", lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé esquerdo */}
          <div style={{ marginTop: 52, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex" }}>
              {["🟣","🟢","🔵"].map((c, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: ["#6366F1","#10B981","#0EA5E9"][i], border: "2px solid #111E33", marginLeft: i > 0 ? -8 : 0, fontSize: 0 }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: "rgba(123,143,166,0.75)", lineHeight: 1.4 }}>
              Seus dados armazenados<br />com segurança total
            </div>
          </div>
        </div>
      </div>

      {/* ── Painel Direito (Formulário) ──────────────────────────── */}
      <div className="auth-right" style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "48px 56px", background: "#060C18", position: "relative",
      }}>
        {/* Linha decorativa lateral esquerda (desktop) */}
        <div style={{ position:"absolute", top:0, left:0, width:1, height:"100%", background:"linear-gradient(180deg,transparent,rgba(99,102,241,0.15) 30%,rgba(99,102,241,0.15) 70%,transparent)" }}/>

        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

          {/* Logo pequena — só aparece no mobile (auth-left oculto) */}
          <div className="auth-logo-mobile" style={{ display:"none", justifyContent:"center", marginBottom:32 }}>
            <BrandLogo size={48} showText layout="col" tagline />
          </div>

          {/* Cabeçalho do formulário */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#EDF2FF", margin: "0 0 8px", letterSpacing: "-0.4px" }}>
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p style={{ fontSize: 14, color: "#7B8FA6", margin: 0, lineHeight: 1.5 }}>
              {mode === "login"
                ? "Entre para acessar seu painel financeiro"
                : "Comece a organizar sua vida financeira hoje"}
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", borderRadius: 12, padding: 4, marginBottom: 28,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {[["login","Entrar"],["register","Criar conta"]].map(([m, l]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: "10px 0", borderRadius: 9, border: "none", cursor: "pointer",
                background: mode === m ? "#6366F1" : "transparent",
                color: mode === m ? "#fff" : "#7B8FA6",
                fontSize: 13, fontWeight: mode === m ? 600 : 400,
                transition: "all 0.2s", fontFamily: "inherit",
                boxShadow: mode === m ? "0 2px 14px rgba(99,102,241,0.35)" : "none",
              }}>{l}</button>
            ))}
          </div>

          {/* Campos */}
          {mode === "register" && (
            <Field label="Nome completo" value={name} onChange={setName} placeholder="Seu nome completo" />
          )}
          <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" />
          <PasswordField value={pass} onChange={setPass} show={showPass} onToggle={() => setShowPass(p => !p)} onEnter={submit} />

          {/* Esqueci senha */}
          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: -8, marginBottom: 22 }}>
              <span style={{ fontSize: 12, color: "#818CF8", cursor: "pointer", fontWeight: 500 }}>
                Esqueci minha senha
              </span>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div style={{
              marginBottom: 18, padding: "12px 16px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10, fontSize: 13, color: "#EF4444",
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Botão */}
          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#4338CA" : "linear-gradient(135deg,#6366F1,#4F46E5)",
            color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "inherit",
            transition: "all 0.2s", opacity: loading ? 0.8 : 1,
            boxShadow: loading ? "none" : "0 4px 24px rgba(99,102,241,0.45)",
            letterSpacing: "-0.1px",
          }}>
            {loading
              ? "Carregando..."
              : (mode === "login" ? "Entrar no sistema →" : "Criar minha conta →")}
          </button>

          {/* Switch de modo */}
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#7B8FA6" }}>
            {mode === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
            <span
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              style={{ color: "#818CF8", cursor: "pointer", fontWeight: 600 }}
            >
              {mode === "login" ? "Criar conta grátis" : "Fazer login"}
            </span>
          </div>

          {/* Rodapé */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", fontSize: 11, color: "rgba(123,143,166,0.5)", lineHeight: 1.6 }}>
            Ao entrar, você concorda com os termos de uso.<br />
            FinanceOS · Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
