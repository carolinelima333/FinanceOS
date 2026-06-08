import { fmt } from "../constants.js";
import { SectionTitle } from "./shared/SectionTitle.jsx";

export function Inteligencia({ debts, t, salary = 0 }) {
  const active        = debts.filter(d => d.status !== "paid");
  const totalM        = active.reduce((s,d) => s + d.monthly, 0);
  const pct           = salary > 0 ? Math.round((totalM / salary) * 100) : (totalM > 0 ? 999 : 0);
  const overdueDebts  = debts.filter(d => ["overdue","urgent"].includes(d.status));
  const overdueTotal  = overdueDebts.reduce((s,d) => s + d.total, 0);
  const nearDone      = active.filter(d => d.rem > 0 && d.rem <= 2);
  const nearDoneM     = nearDone.reduce((s,d) => s + d.monthly, 0);
  const risk          = Math.min(100, Math.round((Math.min(pct, 200) * 0.65) + overdueDebts.length * 18));

  const alerts = [
    ...(overdueDebts.length > 0 ? [{
      type:"danger", icon:"🔴",
      title:`${overdueDebts.slice(0,2).map(d=>d.creditor).join(", ")}${overdueDebts.length > 2 ? ` e mais ${overdueDebts.length-2}` : ""} — ${fmt(overdueTotal)} em atraso`,
      desc:`${overdueDebts.length} dívida(s) em atraso. Risco de negativação. Renegocie o quanto antes.`,
      cta:"Renegociar",
    }] : []),
    {
      type: salary === 0 ? "warning" : pct > 100 ? "danger" : pct > 70 ? "warning" : "success",
      icon: salary === 0 ? "🟡" : pct > 100 ? "🔴" : pct > 70 ? "🟡" : "🟢",
      title: salary > 0 ? `Comprometimento: ${pct}% da renda` : "Configure seu salário",
      desc: salary > 0
        ? (totalM > salary
            ? `Déficit mensal de ${fmt(totalM - salary)}. Matematicamente impossível sem negociação.`
            : `Comprometimento controlado. Saldo livre: ${fmt(salary - totalM)}/mês.`)
        : "Acesse Planejamento e informe seu salário líquido para análise precisa.",
      cta: salary > 0 ? (totalM > salary ? "Renegociar" : "Manter") : "Configurar",
    },
    ...(nearDone.length > 0 ? [{
      type:"warning", icon:"🟡",
      title:`${nearDone.length} dívida(s) com 1-2 parcelas restantes`,
      desc:`${nearDone.slice(0,3).map(d=>d.creditor).join(", ")}${nearDone.length > 3 ? " e mais" : ""}. Liberam ${fmt(nearDoneM)}/mês.`,
      cta:"Manter pagamentos",
    }] : []),
    {
      type:"success", icon:"🟢",
      title:"Lei 14.181/2021 — Superendividamento",
      desc:"Você tem direito legal de renegociar. Credores são obrigados a negociar de boa-fé.",
      cta:"Ver informações",
    },
  ];

  const recs = [
    ...(overdueDebts.length > 0
      ? [{ icon:"📞", title:"Contate os credores em atraso", desc:`${overdueDebts.slice(0,2).map(d=>d.creditor).join(", ")}${overdueDebts.length>2?" e outros":""} com parcelas atrasadas. Solicite renegociação ou parcelamento.` }]
      : [{ icon:"📊", title:"Mantenha os pagamentos", desc:"Sem atrasos no momento. Continue em dia para evitar juros e negativação." }]
    ),
    { icon:"💻", title:"consumidor.gov.br", desc:"Para credores que recusarem negociar. Resposta em 10 dias. Gratuito e eficaz." },
    { icon:"⚖️", title:"Lei do Superendividamento", desc:"Use como argumento em todas as negociações. Credores não podem recusar de boa-fé (Lei 14.181/2021)." },
    ...(nearDone.length > 0
      ? [{ icon:"🎯", title:"Foco nas últimas parcelas", desc:`${nearDone.length} dívida(s) quitam em breve liberando ${fmt(nearDoneM)}/mês. Prioridade máxima para manter em dia.` }]
      : [{ icon:"🎯", title:"Planeje a quitação", desc:"Escolha uma estratégia (bola de neve ou avalanche) em Planejamento para quitar mais rápido." }]
    ),
    { icon:"🚫", title:"Zero compras parceladas", desc:"Qualquer nova parcela aumenta o comprometimento de renda. Sem exceções até estabilizar as finanças." },
    { icon:"💡", title: salary > 0 && totalM > salary ? "Renda extra urgente" : "Renda extra", desc: salary > 0 && totalM > salary ? `Freela, venda de itens, horas extras — para cobrir o déficit de ${fmt(totalM - salary)}/mês.` : "Mantenha a disciplina financeira. Qualquer renda extra acelera a quitação das dívidas." },
  ];

  const rColor = risk > 75 ? "#EF4444" : risk > 45 ? "#F59E0B" : "#10B981";

  return (
    <div>
      <SectionTitle title="Inteligência Financeira" sub="Alertas, análises e recomendações personalizadas" t={t}/>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:18, marginBottom:22 }}>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:24, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:100, height:100, borderRadius:"50%", position:"relative", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
            <svg viewBox="0 0 100 100" style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke={t.border} strokeWidth="8"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke={rColor} strokeWidth="8"
                strokeDasharray={`${risk * 2.638} 263.8`} strokeLinecap="round"/>
            </svg>
            <div style={{ textAlign:"center", position:"relative", zIndex:1 }}>
              <div style={{ fontSize:22, fontWeight:800, color:rColor }}>{risk}</div>
              <div style={{ fontSize:9, color:t.muted }}>/ 100</div>
            </div>
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:rColor }}>Risco {risk>75?"Crítico":risk>45?"Moderado":"Baixo"}</div>
          <div style={{ fontSize:11, color:t.muted, marginTop:4, textAlign:"center" }}>Score de risco financeiro</div>
        </div>

        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:14 }}>⚠️ Alertas ativos</div>
          {alerts.map((a,i) => (
            <div key={i} style={{
              background:t.surface, borderRadius:10, padding:"12px 16px", marginBottom:8,
              borderLeft:`3px solid ${a.type==="danger"?"#EF4444":a.type==="warning"?"#F59E0B":"#10B981"}`,
              display:"flex", gap:10, alignItems:"flex-start",
            }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{a.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:t.text, marginBottom:1 }}>{a.title}</div>
                <div style={{ fontSize:11, color:t.muted }}>{a.desc}</div>
              </div>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:t.primaryDim, color:t.primary, fontWeight:500, whiteSpace:"nowrap", flexShrink:0 }}>{a.cta}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:14 }}>💡 Recomendações</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {recs.map((r,i) => (
          <div key={i} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:22, marginBottom:10 }}>{r.icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:5 }}>{r.title}</div>
            <div style={{ fontSize:12, color:t.muted, lineHeight:1.55 }}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
