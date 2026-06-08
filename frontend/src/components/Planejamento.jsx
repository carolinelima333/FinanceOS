import { useState, useMemo } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { fmt } from "../constants.js";
import { SectionTitle } from "./shared/SectionTitle.jsx";
import { ChartCard, tooltipStyle } from "./shared/ChartCard.jsx";

export function Planejamento({ debts, t, salary: salaryProp = 0 }) {
  const [method, setMethod] = useState("snowball");
  const [salary, setSalary] = useState(salaryProp);

  const active  = debts.filter(d => d.status !== "paid" && d.monthly > 0);
  const totalM  = active.reduce((s,d) => s + d.monthly, 0);
  const totalD  = debts.filter(d => d.status !== "paid").reduce((s,d) => s + d.total, 0);
  const deficit = salary - totalM;
  const moradia = active.filter(d => d.cat === "Moradia").reduce((s,d) => s + d.monthly, 0);
  const outros  = totalM - moradia;

  const sorted = method === "snowball"
    ? [...active].filter(d => d.rem > 0).sort((a,b) => a.total - b.total)
    : [...active].filter(d => d.rem > 0).sort((a,b) => b.monthly - a.monthly);

  const months   = ["Jun","Jul","Ago","Set","Out","Nov","Dez","Jan","Fev","Mar","Abr","Mai"];
  const projData = useMemo(() => {
    let rem = totalD;
    return months.map(m => {
      rem = Math.max(0, rem - Math.min(salary * 0.9, rem));
      return { month:m, total:Math.round(rem/1000) };
    });
  }, [debts, salary]);

  const budget = [
    { l:"Salário", v:fmt(salary),  color:"#10B981" },
    { l:"Moradia", v:fmt(moradia), color:"#6366F1" },
    { l:"Dívidas", v:fmt(outros),  color:"#EF4444" },
    { l:"Saldo",   v:fmt(deficit), color:deficit>=0?"#10B981":"#EF4444" },
  ];

  return (
    <div>
      <SectionTitle title="Planejamento Financeiro" sub="Simule sua estratégia de quitação" t={t}/>

      <div className="grid-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:"18px 22px" }}>
          <div style={{ fontSize:12, color:t.muted, marginBottom:8, fontWeight:500 }}>Salário líquido</div>
          <input type="number" value={salary} onChange={e => setSalary(Number(e.target.value))}
            style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${t.border}`, background:t.surface, color:t.text, fontSize:16, fontWeight:700, boxSizing:"border-box", outline:"none", fontFamily:"inherit" }}/>
        </div>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:"18px 22px" }}>
          <div style={{ fontSize:12, color:t.muted, marginBottom:8, fontWeight:500 }}>Estratégia de quitação</div>
          <select value={method} onChange={e => setMethod(e.target.value)}
            style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${t.border}`, background:t.surface, color:t.text, fontSize:14, outline:"none", fontFamily:"inherit" }}>
            <option value="snowball">❄️ Bola de Neve — menores primeiro</option>
            <option value="avalanche">🌋 Avalanche — maiores parcelas primeiro</option>
          </select>
        </div>
      </div>

      <div className="grid-stat" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {budget.map(c => (
          <div key={c.l} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px 20px", borderTop:`2px solid ${c.color}` }}>
            <div style={{ fontSize:18, fontWeight:800, color:c.color, marginBottom:2 }}>{c.v}</div>
            <div style={{ fontSize:11, color:t.muted }}>{c.l}</div>
          </div>
        ))}
      </div>

      <div className="grid-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
        <ChartCard title="📈 Projeção de quitação (R$ mil)" t={t}>
          <AreaChart data={projData}>
            <defs>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border}/>
            <XAxis dataKey="month" tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip {...tooltipStyle(t)} formatter={v=>[`R$ ${v}k`,"Saldo devedor"]}/>
            <Area type="monotone" dataKey="total" stroke="#EF4444" fill="url(#g2)" strokeWidth={2.5}/>
          </AreaChart>
        </ChartCard>

        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:16 }}>
            {method==="snowball" ? "❄️ Bola de Neve" : "🌋 Avalanche"} — ordem de ataque
          </div>
          <div style={{ overflowY:"auto", maxHeight:190 }}>
            {sorted.map((d,i) => (
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:t.primaryDim, color:t.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:t.text, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.creditor}</div>
                  <div style={{ fontSize:10, color:t.muted }}>{d.rem}x · {fmt(d.total)}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:t.text, flexShrink:0 }}>{fmt(d.monthly)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
