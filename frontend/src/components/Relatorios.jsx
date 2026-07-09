import { useState } from "react";
import writeXlsxFile from "write-excel-file/browser";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { fmt } from "../constants.js";
import { Badge }        from "./shared/Badge.jsx";
import { SectionTitle } from "./shared/SectionTitle.jsx";
import { ChartCard, tooltipStyle } from "./shared/ChartCard.jsx";
import { PDFPreview }   from "./PDFPreview.jsx";
import { api }          from "../lib/api.js";


export function Relatorios({ debts, t, showToast, salary = 0 }) {
  const [showPDF,       setShowPDF]       = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo,       setEmailTo]       = useState(() => localStorage.getItem("fos-email") || "");
  const [sendingEmail,  setSendingEmail]  = useState(false);

  const active = debts.filter(d => d.status !== "paid");
  const paid   = debts.filter(d => d.status === "paid");
  const totalD = active.reduce((s,d) => s + d.total,   0);
  const totalM = active.reduce((s,d) => s + d.monthly, 0);
  const now    = new Date();
  const date   = now.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
  const mesAno = now.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});

  const maxRem     = active.length > 0 ? Math.max(...active.map(d => d.rem || 0)) : 0;
  const payoffYear = maxRem > 0 ? new Date(now.getFullYear(), now.getMonth() + maxRem).getFullYear() : null;
  const pct        = salary > 0 ? Math.round(totalM / salary * 100) : null;

  const pastMonths = Array.from({length: 6}, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { date: d, m: d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","").replace(/^\w/, c => c.toUpperCase()) };
  });
  const histData = pastMonths.map(({ date: mDate, m }) => {
    const pago = debts.reduce((sum, d) => {
      if (!d.created_at || !d.monthly) return sum;
      const created = new Date(d.created_at);
      const createdMonth = new Date(created.getFullYear(), created.getMonth(), 1);
      if (createdMonth > mDate) return sum;
      const monthsSince = (mDate.getFullYear() - createdMonth.getFullYear()) * 12 + (mDate.getMonth() - createdMonth.getMonth());
      return monthsSince < (d.paid || 0) ? sum + d.monthly : sum;
    }, 0);
    return { m, pago: Math.round(pago) };
  });
  const catMap = {};
  active.filter(d => d.monthly > 0).forEach(d => { catMap[d.cat] = (catMap[d.cat]||0) + d.monthly; });
  const catData = Object.entries(catMap).sort((a,b) => b[1]-a[1]).map(([name,value]) => ({ name, value:Math.round(value) }));

  const exportExcel = async () => {
    try {
      const stLabel = { active:"Ativa", urgent:"Urgente", overdue:"Atrasada", negotiating:"Negociando", paused:"Pausada", paid:"Quitada" };
      const B  = (v) => ({ value: String(v ?? ""), fontWeight: "bold" });
      const S  = (v) => ({ value: String(v ?? "") });
      const N  = (v) => ({ value: Number(v) ?? 0, type: Number });
      const H  = (v) => ({ value: String(v ?? ""), fontWeight: "bold", backgroundColor: "#6366F1", color: "#FFFFFF" });
      const SB = (v) => ({ value: String(v ?? ""), fontWeight: "bold" });

      // Aba 1 — Dívidas detalhadas
      const sheetDividas = [
        [H("Credor"), H("Categoria"), H("Para quem"), H("Parcela Mensal (R$)"), H("Total Restante (R$)"), H("Parc. Restantes"), H("Parc. Pagas"), H("Total Parc."), H("Progresso (%)"), H("Vencimento (dia)"), H("Status"), H("Prioridade"), H("Observação")],
        ...debts.map(d => {
          const ti = Number(d.ti) || (Number(d.rem) + Number(d.paid));
          return [
            S(d.creditor), S(d.cat), S(d.for_),
            N(d.monthly), N(d.total),
            N(d.rem), N(d.paid), N(ti),
            N(ti > 0 ? Math.round(d.paid / ti * 100) : 0),
            S(d.due ?? ""), S(stLabel[d.status] || d.status),
            S(d.priority ?? ""), S(d.note ?? ""),
          ];
        }),
      ];

      // Aba 2 — Resumo financeiro (sem linhas vazias)
      const sheetResumo = [
        [SB("FinanceOS — Resumo Financeiro"), S("")],
        [S("Gerado em"), S(date)],
        [SB("Indicador"), SB("Valor")],
        [S("Total em dívidas (R$)"),         N(totalD)],
        [S("Parcelas mensais (R$)"),          N(totalM)],
        [S("Comprometimento (%)"),            salary > 0 ? N(Math.round(totalM / salary * 100)) : S("—")],
        [S("Salário (R$)"),                   salary > 0 ? N(salary) : S("não configurado")],
        [S("Saldo livre mensal (R$)"),        salary > 0 ? N(salary - totalM) : S("—")],
        [S("Dívidas ativas"),                 N(active.length)],
        [S("Dívidas quitadas"),               N(paid.length)],
        [S("Total de dívidas"),               N(debts.length)],
      ];

      const downloadName = `FinanceOS-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`;

      await writeXlsxFile([
        {
          data: sheetDividas,
          sheet: "Dívidas",
          columns: [
            {width:30},{width:14},{width:12},{width:18},{width:18},
            {width:16},{width:14},{width:12},{width:14},{width:16},
            {width:14},{width:12},{width:30},
          ],
        },
        {
          data: sheetResumo,
          sheet: "Resumo",
          columns: [{width:35},{width:25}],
        },
      ]).toFile(downloadName);

      showToast("✓ Excel exportado com sucesso!");
    } catch (e) {
      console.error("Erro exportExcel:", e);
      showToast("Erro ao exportar: " + (e.message || "erro desconhecido"), "error");
    }
  };

  const sendEmail = async () => {
    if (!emailTo.trim()) return;
    setSendingEmail(true);
    try {
      const stLabel = { active:"Ativa", urgent:"Urgente", overdue:"Atrasada", negotiating:"Negociando", paused:"Pausada", paid:"Quitada" };
      const S  = (v) => ({ value: String(v ?? "") });
      const N  = (v) => ({ value: Number(v) ?? 0, type: Number });
      const H  = (v) => ({ value: String(v ?? ""), fontWeight: "bold", backgroundColor: "#6366F1", color: "#FFFFFF" });
      const SB = (v) => ({ value: String(v ?? ""), fontWeight: "bold" });

      const sheetDividas = [
        [H("Credor"), H("Categoria"), H("Para quem"), H("Parcela Mensal (R$)"), H("Total Restante (R$)"), H("Parc. Restantes"), H("Parc. Pagas"), H("Total Parc."), H("Progresso (%)"), H("Vencimento (dia)"), H("Status"), H("Prioridade"), H("Observação")],
        ...debts.map(d => {
          const ti = Number(d.ti) || (Number(d.rem) + Number(d.paid));
          return [S(d.creditor), S(d.cat), S(d.for_), N(d.monthly), N(d.total), N(d.rem), N(d.paid), N(ti), N(ti > 0 ? Math.round(d.paid/ti*100) : 0), S(d.due ?? ""), S(stLabel[d.status] || d.status), S(d.priority ?? ""), S(d.note ?? "")];
        }),
      ];
      const sheetResumo = [
        [SB("FinanceOS — Resumo Financeiro"), S("")],
        [S("Gerado em"), S(date)],
        [SB("Indicador"), SB("Valor")],
        [S("Total em dívidas (R$)"),  N(totalD)],
        [S("Parcelas mensais (R$)"),  N(totalM)],
        [S("Comprometimento (%)"),    salary > 0 ? N(Math.round(totalM/salary*100)) : S("—")],
        [S("Salário (R$)"),           salary > 0 ? N(salary) : S("não configurado")],
        [S("Saldo livre mensal (R$)"),salary > 0 ? N(salary-totalM) : S("—")],
        [S("Dívidas ativas"),         N(active.length)],
        [S("Dívidas quitadas"),       N(paid.length)],
        [S("Total de dívidas"),       N(debts.length)],
      ];

      const blob = await writeXlsxFile([
        { data: sheetDividas, sheet: "Dívidas", columns: [{width:30},{width:14},{width:12},{width:18},{width:18},{width:16},{width:14},{width:12},{width:14},{width:16},{width:14},{width:12},{width:30}] },
        { data: sheetResumo,  sheet: "Resumo",  columns: [{width:35},{width:25}] },
      ]).toBlob();

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const fileName = `FinanceOS-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`;
      const summary  = {
        date:        date,
        totalDebt:   totalD,
        totalMonthly:totalM,
        activeCount: active.length,
        paidCount:   paid.length,
        commitment:  salary > 0 ? Math.round(totalM/salary*100) : null,
        freeBalance: salary > 0 ? salary-totalM : null,
      };

      await api.sendEmailReport(emailTo.trim(), base64, fileName, summary);
      showToast("✓ E-mail enviado com sucesso!");
      setShowEmailModal(false);
    } catch (e) {
      showToast("Erro ao enviar e-mail: " + (e.message || "erro desconhecido"), "error");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div>
      {showPDF && <PDFPreview debts={debts} salary={salary} onClose={() => setShowPDF(false)}/>}

      {showEmailModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:"32px 36px", width:420, maxWidth:"90vw" }}>
            <div style={{ fontSize:17, fontWeight:700, color:t.text, marginBottom:6 }}>📨 Enviar relatório por e-mail</div>
            <div style={{ fontSize:13, color:t.muted, marginBottom:22 }}>O relatório Excel será enviado como anexo.</div>
            <label style={{ fontSize:12, fontWeight:600, color:t.muted, display:"block", marginBottom:6 }}>Destinatário</label>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendEmail()}
              placeholder="exemplo@email.com"
              style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, border:`1.5px solid ${t.border}`, background:t.bg, color:t.text, fontSize:14, fontFamily:"inherit", outline:"none" }}
              autoFocus
            />
            <div style={{ display:"flex", gap:10, marginTop:22, justifyContent:"flex-end" }}>
              <button onClick={() => setShowEmailModal(false)} disabled={sendingEmail} style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${t.border}`, background:"transparent", color:t.muted, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                Cancelar
              </button>
              <button onClick={sendEmail} disabled={sendingEmail || !emailTo.trim()} style={{ padding:"10px 22px", borderRadius:8, border:"none", background:"#6366F1", color:"#fff", fontSize:13, fontWeight:700, cursor: sendingEmail || !emailTo.trim() ? "not-allowed" : "pointer", opacity: sendingEmail || !emailTo.trim() ? 0.6 : 1, fontFamily:"inherit" }}>
                {sendingEmail ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionTitle title="Relatórios" sub="Análise completa e exportação dos dados" t={t}/>

      <div style={{ display:"flex", gap:10, marginBottom:22, flexWrap:"wrap" }}>
        <button onClick={() => setShowPDF(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:10, border:"1.5px solid #EF4444", background:"rgba(239,68,68,0.08)", color:"#EF4444", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          📄 Exportar PDF
        </button>
        <button onClick={exportExcel} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:10, border:"1.5px solid #10B981", background:"rgba(16,185,129,0.08)", color:"#10B981", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          📊 Exportar Excel
        </button>
        <button onClick={() => setShowEmailModal(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:10, border:"1.5px solid #6366F1", background:"rgba(99,102,241,0.08)", color:"#6366F1", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          📨 Enviar e-mail
        </button>
      </div>

      <div className="grid-stat" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[
          { l:"Total em dívidas",     v:totalD > 0 ? fmt(totalD) : "—",                sub:active.length+" credores ativos", c:"#EF4444" },
          { l:"Comprometimento",      v:pct !== null ? pct+"%" : "—",              sub: pct !== null ? "da renda mensal" : "configure em Planejamento", c:"#F59E0B" },
          { l:"Já quitadas",          v:paid.length+"x",                           sub:"dívidas eliminadas",             c:"#10B981" },
          { l:"Previsão de quitação", v:payoffYear ? `~${payoffYear}` : "—",       sub:"com estratégia atual",           c:"#6366F1" },
        ].map(c => (
          <div key={c.l} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:"18px 20px" }}>
            <div style={{ fontSize:22, fontWeight:800, color:c.c, marginBottom:4 }}>{c.v}</div>
            <div style={{ fontSize:12, fontWeight:600, color:t.text, marginBottom:2 }}>{c.l}</div>
            <div style={{ fontSize:11, color:t.muted }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:20 }}>
        <ChartCard title={`Histórico de pagamentos ${now.getFullYear()}`} t={t}>
          <BarChart data={histData}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border}/>
            <XAxis dataKey="m" tick={{fill:t.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:t.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip {...tooltipStyle(t)} formatter={v=>[fmt(v),"Valor pago"]}/>
            <Bar dataKey="pago" name="Valor pago" fill="#10B981" radius={[6,6,0,0]}/>
          </BarChart>
        </ChartCard>

        <ChartCard title="Distribuição de parcelas" t={t}>
          <BarChart data={catData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={t.border}/>
            <XAxis type="number" tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis type="category" dataKey="name" tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false} width={90}/>
            <Tooltip {...tooltipStyle(t)} formatter={v=>[fmt(v),"Parcela"]}/>
            <Bar dataKey="value" fill="#6366F1" radius={[0,6,6,0]}/>
          </BarChart>
        </ChartCard>
      </div>

      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:24 }}>
        <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:16 }}>Extrato completo — {mesAno}</div>
        <div style={{ overflowX:"auto" }}>
          <div className="extrato-table">
            <div style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 1fr 1fr 1fr", padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
              {["Credor","Para","Parcela","Total","Status"].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:600, color:t.muted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</div>
              ))}
            </div>
            {active.filter(d => d.monthly > 0).sort((a,b) => b.total - a.total).map(d => (
              <div key={d.id} style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 1fr 1fr 1fr", padding:"9px 0", borderBottom:`1px solid ${t.border}`, alignItems:"center" }}>
                <div style={{ fontSize:13, color:t.text, fontWeight:500 }}>{d.creditor}</div>
                <div style={{ fontSize:11, color:t.muted }}>{d.for_}</div>
                <div style={{ fontSize:13, fontWeight:600, color:t.text }}>{fmt(d.monthly)}</div>
                <div style={{ fontSize:13, color:t.text }}>{fmt(d.total)}</div>
                <Badge status={d.status}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", marginTop:4 }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.text }}>Total</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#EF4444" }}>{fmt(totalD)}</div>
        </div>
      </div>
    </div>
  );
}
