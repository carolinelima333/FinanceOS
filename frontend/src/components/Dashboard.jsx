import { useMemo } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { PIE_COLORS, fmt, fmtK } from "../constants.js";
import { StatCard }    from "./shared/StatCard.jsx";
import { SectionTitle } from "./shared/SectionTitle.jsx";
import { ChartCard, tooltipStyle } from "./shared/ChartCard.jsx";

export function Dashboard({ debts, t, salary = 0, cashBalance = 0 }) {
  const active     = debts.filter(d => d.status !== "paid");
  const totalM     = active.reduce((s,d) => s + d.monthly, 0);
  const totalD     = active.reduce((s,d) => s + d.total,   0);
  const pct        = salary > 0 ? Math.round((totalM / salary) * 100) : (totalM > 0 ? 999 : 0);
  const urgent     = active.filter(d => d.status === "overdue" || d.status === "urgent");
  const overdueTotal = urgent.reduce((s,d) => s + d.total, 0);
  const soonPayoffs = active
    .filter(d => d.rem > 0 && d.rem <= 3 && d.monthly > 0)
    .sort((a,b) => a.rem - b.rem)
    .slice(0, 5);
  const soonTotal  = soonPayoffs.reduce((s,d) => s + d.monthly, 0);
  const nextDue    = active.filter(d => d.due).sort((a,b) => a.due - b.due)[0];
  const now        = new Date();
  const mesAno     = now.toLocaleDateString("pt-BR", { month:"long", year:"numeric" });

  const months = ["Jun","Jul","Ago","Set","Out","Nov","Dez","Jan","Fev","Mar","Abr","Mai"];
  const evoData = useMemo(() => months.map((m,i) => {
    const freed     = active.filter(d => d.monthly > 0 && d.rem <= i).reduce((s,d) => s + d.monthly, 0);
    const tRemaining = active.reduce((s,d) => s + Math.max(0, d.total - (i * d.monthly)), 0);
    return { month:m, total:Math.round(tRemaining/1000), freed:Math.round(freed) };
  }), [debts]);

  const catMap = {};
  active.filter(d => d.monthly > 0).forEach(d => { catMap[d.cat] = (catMap[d.cat]||0) + d.monthly; });
  const pieData = Object.entries(catMap)
    .sort((a,b) => b[1]-a[1])
    .slice(0,6)
    .map(([name,value]) => ({ name, value:Math.round(value) }));

  return (
    <div>
      <SectionTitle title="Dashboard" sub={`Visão geral · ${mesAno} · Salário: ${salary > 0 ? fmt(salary) : "não configurado"}`} t={t} />

      {urgent.length > 0 && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:12, padding:"14px 20px", marginBottom:22, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>🚨</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#EF4444", marginBottom:2 }}>Ação urgente necessária</div>
            <div style={{ fontSize:12, color:t.muted }}>{urgent.map(d => d.creditor).slice(0,3).join(", ")}{urgent.length > 3 ? ` e mais ${urgent.length - 3}` : ""} — parcelas em atraso. Negocie imediatamente.</div>
          </div>
        </div>
      )}

      <div className="grid-stat" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:14, marginBottom:22 }}>
        <StatCard icon="💰" label="Salário mensal"     value={salary > 0 ? fmt(salary) : "—"} sub={salary > 0 ? "clique no header para editar" : "configure no header"} color="#10B981" t={t} />
        <StatCard icon="📉" label="Total em dívidas"   value={totalD > 0 ? fmtK(totalD) : "—"} sub={overdueTotal > 0 ? `+${fmtK(overdueTotal)} atrasado` : "valor total"} color="#EF4444" t={t} />
        <StatCard icon="🔥" label="Comprometimento"    value={salary > 0 ? pct+"%" : "—"} sub={pct>100?"⚠️ Acima de 100%":"da renda"} color={pct>100?"#EF4444":"#F59E0B"} t={t} />
        <StatCard icon="📆" label="Próx. vencimento"   value={nextDue ? `Dia ${nextDue.due}` : "—"} sub={nextDue ? nextDue.creditor : "sem vencimento cadastrado"} color="#6366F1" t={t} />
        <StatCard icon="✅" label="Liberam em breve"   value={soonPayoffs.length > 0 ? fmt(soonTotal) : "—"} sub={soonPayoffs.length > 0 ? `${soonPayoffs.length} parcela(s) quitando` : "nenhuma"} color="#10B981" t={t} />
        <StatCard icon="⟳" label="Em negociação"       value={debts.filter(d=>d.status==="negotiating").length+"x"} sub="credores" color="#F59E0B" t={t} />
      </div>

      <div className="grid-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
        <ChartCard title="📊 Evolução das dívidas (R$ mil)" t={t}>
          <AreaChart data={evoData}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border}/>
            <XAxis dataKey="month" tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip {...tooltipStyle(t)} formatter={v=>[`R$ ${v}k`,"Dívida total"]}/>
            <Area type="monotone" dataKey="total" stroke="#6366F1" fill="url(#g1)" strokeWidth={2.5}/>
          </AreaChart>
        </ChartCard>

        <ChartCard title="🍩 Distribuição por categoria" t={t}>
          <PieChart>
            <Pie data={pieData} cx="40%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
              {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
            </Pie>
            <Tooltip {...tooltipStyle(t)} formatter={v=>[fmt(v),"Parcela"]}/>
            <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:t.muted}}/>
          </PieChart>
        </ChartCard>
      </div>

      <div className="grid-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:16 }}>🎯 Quitam em breve — libera dinheiro</div>
          {soonPayoffs.map(d => (
            <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${t.border}` }}>
              <div>
                <div style={{ fontSize:13, color:t.text, fontWeight:500 }}>{d.creditor}</div>
                <div style={{ fontSize:11, color:t.muted }}>{d.rem===1 ? "Última parcela! 🎉" : d.rem+"x restantes"}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#10B981" }}>+{fmt(d.monthly)}</div>
                <div style={{ fontSize:10, color:t.muted }}>liberado/mês</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:16 }}>📈 Comprometimento da renda</div>
          <div style={{ marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
              <span style={{ fontSize:12, color:t.muted }}>Comprometido</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#EF4444" }}>{salary > 0 ? pct+"%" : "—"}</span>
            </div>
            <div style={{ height:10, background:t.border, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:salary > 0 ? Math.min(pct,100)+"%" : "0%", background:"linear-gradient(90deg,#EF4444,#F59E0B)", borderRadius:99, transition:"width 0.5s" }}/>
            </div>
            <div style={{ fontSize:10, color:t.muted, marginTop:5 }}>Meta ideal: abaixo de 30%</div>
          </div>
          {salary > 0 ? (
            <div style={{ background: totalM > salary ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border:`1px solid ${totalM > salary ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, borderRadius:12, padding:"14px 18px" }}>
              <div style={{ fontSize:11, color: totalM > salary ? "#EF4444" : "#10B981", fontWeight:600, marginBottom:2 }}>{totalM > salary ? "DÉFICIT MENSAL" : "SALDO LIVRE"}</div>
              <div style={{ fontSize:26, fontWeight:800, color: totalM > salary ? "#EF4444" : "#10B981" }}>{totalM > salary ? "-" : "+"}{fmt(Math.abs(salary - totalM))}</div>
              <div style={{ fontSize:11, color:t.muted, marginTop:4 }}>{totalM > salary ? "Valor que ultrapassa o salário · Negociar obrigatório" : "Valor disponível após pagar as parcelas"}</div>
            </div>
          ) : (
            <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 18px", textAlign:"center" }}>
              <div style={{ fontSize:12, color:t.muted }}>Configure seu salário para ver o comprometimento</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
