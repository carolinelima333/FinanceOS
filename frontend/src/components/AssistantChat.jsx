import { useState, useRef, useEffect } from "react";
import { fmt } from "../constants.js";

/* ─────────────────────────────────────────────
   Cérebro: analisa dívidas e gera insights
─────────────────────────────────────────────*/
function analyze(debts = [], salary = 0) {
  const active    = debts.filter(d => !["paid","paused"].includes(d.status));
  const overdue   = debts.filter(d => ["overdue","urgent"].includes(d.status));
  const nearly    = active.filter(d => d.rem > 0 && d.rem <= 2);
  const monthly   = active.reduce((s, d) => s + (d.monthly || 0), 0);
  const commit    = salary > 0 ? Math.round(monthly / salary * 100) : 0;
  const totalDebt = debts.filter(d => d.status !== "paid").reduce((s, d) => s + (d.total || 0), 0);
  const paidCount = debts.filter(d => d.status === "paid").length;
  const available = salary > 0 ? salary - monthly : null;

  const scored = [...active].map(d => {
    let s = 0;
    if (["overdue","urgent"].includes(d.status)) s += 100;
    if (d.priority === "Alta")   s += 50;
    else if (d.priority === "Média") s += 20;
    if (d.rem > 0 && d.rem <= 2) s += 40;
    else if (d.rem > 0 && d.rem <= 5) s += 15;
    return { ...d, _s: s };
  }).sort((a, b) => b._s - a._s);

  const snowball  = [...active.filter(d => d.rem > 0)].sort((a, b) => (a.total || 0) - (b.total || 0));
  const avalanche = [...active].sort((a, b) => (b.monthly || 0) - (a.monthly || 0));

  return { active, overdue, nearly, monthly, commit, totalDebt, paidCount, scored, snowball, avalanche, available };
}

/* ─────────────────────────────────────────────
   Geradores de resposta
─────────────────────────────────────────────*/
function buildGreeting(debts = [], salary = 0) {
  if (!debts.length) {
    return "Olá! Sou seu assistente financeiro.\n\nVocê ainda não tem dívidas cadastradas. Adicione-as na tela **Dívidas** e eu te ajudo a organizá-las! 💪";
  }
  const d = analyze(debts, salary);
  const statusEmoji = d.commit > 50 ? "🔴" : d.commit > 30 ? "🟡" : "🟢";
  const statusText  = d.commit > 50 ? "Situação crítica — atenção redobrada!"
                    : d.commit > 30 ? "Atenção: comprometimento elevado"
                    : d.commit > 0  ? "Situação sob controle"
                    : "Configure seu salário para análise completa";
  const lines = [
    `Olá! Analisei suas dívidas. Aqui está o resumo:\n`,
    `📊 ${d.active.length} dívida${d.active.length !== 1 ? "s ativas" : " ativa"} · ${fmt(d.totalDebt)} em aberto`,
    `📅 ${fmt(d.monthly)}/mês em parcelas${salary > 0 ? ` (${d.commit}% da renda)` : ""}`,
  ];
  if (d.overdue.length) lines.push(`⚠️  ${d.overdue.length} em atraso — precisa de atenção!`);
  if (d.nearly.length)  lines.push(`🎯  ${d.nearly.length} quase quitada${d.nearly.length > 1 ? "s" : ""}!`);
  lines.push(`\n${statusEmoji} ${statusText}`);
  lines.push(`\nO que você quer saber?`);
  return lines.join("\n");
}

function replyStart(d) {
  const lines = ["Aqui está seu **plano de ação** em passos:\n"];
  let step = 1;

  if (d.overdue.length) {
    lines.push(`**${step++}️⃣ URGENTE — Regularize os atrasos:**`);
    d.overdue.slice(0, 3).forEach(x =>
      lines.push(`   • ${x.creditor} — ${fmt(x.monthly)}/mês${x.due ? ` (vence dia ${x.due})` : ""}`)
    );
    lines.push("");
  }

  if (d.nearly.length) {
    lines.push(`**${step++}️⃣ GANHO RÁPIDO — Quite dívidas quase no fim:**`);
    d.nearly.forEach(x =>
      lines.push(`   • ${x.creditor} — só ${x.rem} parcela${x.rem > 1 ? "s" : ""}! (${fmt(x.monthly)}/mês)`)
    );
    lines.push("");
  }

  const rest = d.scored.filter(x =>
    !["overdue","urgent"].includes(x.status) && !(x.rem > 0 && x.rem <= 2)
  ).slice(0, 2);

  lines.push(`**${step}️⃣ PRIORIDADE — Foque nestas a seguir:**`);
  if (rest.length) {
    rest.forEach(x => lines.push(`   • ${x.creditor} — ${fmt(x.total)} restante`));
  } else if (d.scored.length) {
    lines.push(`   • ${d.scored[0].creditor} — ${fmt(d.scored[0].total)} restante`);
  }
  lines.push("\nQuer detalhes de algum passo?");
  return lines.join("\n");
}

function replyPriority(d) {
  if (!d.scored.length) return "Você não tem dívidas ativas para priorizar.";
  const lines = ["Sua lista de **prioridades** (mais urgente primeiro):\n"];
  d.scored.slice(0, 5).forEach((x, i) => {
    const reasons = [];
    if (["overdue","urgent"].includes(x.status)) reasons.push("⚠️ em atraso");
    if (x.priority === "Alta") reasons.push("prioridade alta");
    if (x.rem > 0 && x.rem <= 2) reasons.push(`${x.rem} parcela${x.rem > 1 ? "s" : ""} para quitar`);
    lines.push(`**${i + 1}. ${x.creditor}**${reasons.length ? ` — ${reasons.join(", ")}` : ""}`);
    lines.push(`   ${fmt(x.monthly)}/mês · ${fmt(x.total)} total · ${x.rem ?? "–"} parcelas restantes`);
    if (i < Math.min(d.scored.length - 1, 4)) lines.push("");
  });
  return lines.join("\n");
}

function replyNearly(d) {
  if (!d.nearly.length) {
    const closest = d.active.filter(x => x.rem > 0).sort((a, b) => a.rem - b.rem)[0];
    if (closest) return `Nenhuma dívida com 1–2 parcelas restantes.\n\nA mais próxima de ser quitada é **${closest.creditor}** com **${closest.rem} parcelas** restantes (${fmt(closest.monthly)}/mês).`;
    return "Nenhuma dívida com parcelas definidas no momento.";
  }
  const totalFreed = d.nearly.reduce((s, x) => s + (x.monthly || 0), 0);
  const lines = ["Estas dívidas estão **quase quitadas** — termine-as logo para liberar renda! 🎯\n"];
  d.nearly.forEach(x => {
    lines.push(`✅ **${x.creditor}** — ${x.rem} parcela${x.rem > 1 ? "s" : ""} de ${fmt(x.monthly)}`);
    lines.push(`   Quitando: você libera **${fmt(x.monthly)}/mês** de volta! 🎉`);
    lines.push("");
  });
  lines.push(`Total liberado ao quitar todas: **${fmt(totalFreed)}/mês** 💪`);
  return lines.join("\n");
}

function replyAvailable(d, salary) {
  if (!salary) return "Você não configurou seu salário ainda.\n\nClique em **\"Configurar salário\"** no topo da tela e eu calculo exatamente quanto sobra no mês.";
  const lines = [
    `**Breakdown mensal:**\n`,
    `💰 Salário:            ${fmt(salary)}`,
    `📤 Parcelas totais:    ${fmt(d.monthly)} (${d.commit}% da renda)`,
    `🟢 Disponível/mês:    **${fmt(d.available)}**`,
    "",
  ];
  if (d.available <= 0) {
    lines.push(`⚠️ Suas parcelas superam o salário! Renegociar algumas dívidas pode ser necessário.`);
  } else if (d.nearly.length) {
    lines.push(`Dica: use parte desse valor para antecipar a **${d.nearly[0].creditor}** (só ${d.nearly[0].rem} parcela${d.nearly[0].rem > 1 ? "s" : ""} restante!).`);
  } else if (d.commit > 30) {
    lines.push(`Atenção: ${d.commit}% comprometido é acima do ideal (30%). Tente não assumir novas dívidas.`);
  } else {
    lines.push(`Boa! Você tem margem. Considere usar o excedente para antecipar parcelas.`);
  }
  return lines.join("\n");
}

function replyStrategy(d) {
  const lines = [];
  if (d.nearly.length) {
    lines.push(`**Recomendação: Snowball** 🏔️\n`);
    lines.push(`Você tem ${d.nearly.length} dívida${d.nearly.length > 1 ? "s" : ""} quase quitada${d.nearly.length > 1 ? "s" : ""}. Termine-${d.nearly.length > 1 ? "as" : "a"} logo — libera renda e mantém a motivação!\n`);
    lines.push(`Comece por: **${d.nearly[0].creditor}** (${d.nearly[0].rem} parcela${d.nearly[0].rem > 1 ? "s" : ""})`);
  } else if (d.commit > 35) {
    lines.push(`**Recomendação: Avalanche** 🌊\n`);
    lines.push(`Seu comprometimento está em ${d.commit}%. Pague o mínimo em todas e coloque o extra na **${d.avalanche[0]?.creditor}** (maior parcela: ${fmt(d.avalanche[0]?.monthly)}/mês).\n`);
    lines.push(`Isso reduz mais rápido o peso no seu orçamento mensal.`);
  } else {
    lines.push(`**Ambas as estratégias funcionam bem para você.**\n`);
    lines.push(`• **Snowball**: quite a menor primeiro (**${d.snowball[0]?.creditor}**) — vitória rápida e motivação`);
    lines.push(`• **Avalanche**: quite a maior parcela primeiro (**${d.avalanche[0]?.creditor}**) — economiza mais no total`);
    lines.push(`\nA melhor estratégia é a que você vai seguir! 💪`);
  }
  return lines.join("\n");
}

function replyRenegotiate(d) {
  const candidates = d.active.filter(x =>
    ["overdue","urgent"].includes(x.status) || (x.total > 5000 && x.priority !== "Baixa")
  );
  if (!candidates.length) return "No momento nenhuma dívida parece candidata óbvia para renegociação.\n\nFoque em quitá-las conforme o plano de ação.";
  const lines = ["Dívidas que **vale tentar renegociar**:\n"];
  candidates.slice(0, 3).forEach(x => {
    lines.push(`• **${x.creditor}** — ${fmt(x.total)} restante`);
    if (["overdue","urgent"].includes(x.status))
      lines.push(`  ↳ Em atraso: explique a situação e peça desconto de juros`);
    else
      lines.push(`  ↳ Saldo alto: tente antecipar parcelas ou reduzir juros`);
    lines.push("");
  });
  lines.push(`💡 Canais úteis: **consumer.gov.br** · Procon · Serasa Consumidor`);
  return lines.join("\n");
}

function replySummary(d, salary) {
  const statusEmoji = d.commit > 50 ? "🔴" : d.commit > 30 ? "🟡" : "🟢";
  const statusText  = d.commit > 50 ? "Crítico" : d.commit > 30 ? "Atenção" : "Saudável";
  const lines = [
    `**Diagnóstico financeiro completo:**\n`,
    `📊 Dívidas ativas:      ${d.active.length}`,
    `💸 Total em aberto:    ${fmt(d.totalDebt)}`,
    `📅 Parcelas/mês:       ${fmt(d.monthly)}`,
    salary > 0 ? `📈 Comprometimento:    ${d.commit}% da renda` : `📈 Renda:              não configurada`,
    d.overdue.length ? `⚠️  Em atraso:          ${d.overdue.length} dívida${d.overdue.length > 1 ? "s" : ""}` : `✅ Em atraso:          nenhuma`,
    d.nearly.length  ? `🎯  Quase quitadas:     ${d.nearly.length} dívida${d.nearly.length > 1 ? "s" : ""}` : null,
    d.paidCount > 0  ? `🏆 Já quitadas:        ${d.paidCount}` : null,
    ``,
    `Status geral: **${statusEmoji} ${statusText}**`,
  ].filter(Boolean);
  return lines.join("\n");
}

function replyHelp() {
  return `Posso te ajudar com:\n\n• **"Por onde começo?"** — plano de ação passo a passo\n• **"Qual a mais urgente?"** — lista priorizada\n• **"Quase quitadas"** — dívidas fáceis de terminar agora\n• **"Sobra quanto?"** — quanto fica livre no mês\n• **"Estratégia"** — Snowball vs Avalanche explicado\n• **"Renegociar"** — quais dívidas convém renegociar\n• **"Situação geral"** — diagnóstico completo\n\nO que você quer saber?`;
}

function getReply(input, debts, salary) {
  const q = input.toLowerCase();
  const d = analyze(debts, salary);

  if (!d.active.length) return "Parabéns! Você não tem dívidas ativas no momento. Continue assim! 🎉";

  if (/começ|por onde|início|inicio|começar|comecar|plano|action/.test(q)) return replyStart(d);
  if (/urgent|atraso|atrasad|pagar prime|qual prime|mais import|priorid/.test(q)) return replyPriority(d);
  if (/quase|quita|última|ultima|últim|ultim|1 parcela|2 parcela|poucas parcela/.test(q)) return replyNearly(d);
  if (/sobr|disponív|disponivel|quanto rest|resta|livre|sobrar/.test(q)) return replyAvailable(d, salary);
  if (/strateg|estratég|estrateg|snowball|avalanche|rápido|rapido|dica/.test(q)) return replyStrategy(d);
  if (/reneg|negoc/.test(q)) return replyRenegotiate(d);
  if (/situ|saúde|saude|resumo|geral|total|diagnós|diagnos/.test(q)) return replySummary(d, salary);

  return replyHelp();
}

/* ─────────────────────────────────────────────
   Componente principal
─────────────────────────────────────────────*/
const CHIPS = [
  "Por onde começo?",
  "Qual a mais urgente?",
  "Quase quitadas 🎉",
  "Sobra quanto?",
  "Situação geral",
];

export function AssistantChat({ debts = [], salary = 0, t, mobile = false }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState(null);
  const [input,    setInput]    = useState("");
  const [typing,   setTyping]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Inicia conversa com saudação quando abre pela primeira vez
  useEffect(() => {
    if (open && messages === null) {
      setMessages([{ role:"assistant", text: buildGreeting(debts, salary), id: 1 }]);
    }
  }, [open]);

  // Scroll automático para o final
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, typing]);

  // Foca o input ao abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = (text) => {
    const q = (text || input).trim();
    if (!q || typing) return;
    setInput("");

    const userMsg = { role:"user", text:q, id: Date.now() };
    setMessages(prev => [...(prev||[]), userMsg]);
    setTyping(true);

    setTimeout(() => {
      const botText = getReply(q, debts, salary);
      setMessages(prev => [...prev, { role:"assistant", text: botText, id: Date.now() }]);
      setTyping(false);
    }, 500);
  };

  const clearChat = () => {
    setMessages([{ role:"assistant", text: buildGreeting(debts, salary), id: Date.now() }]);
    setInput("");
    setTyping(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const panelW = mobile ? Math.min(360, window.innerWidth - 16) : 370;
  const panelR = mobile ? Math.max(8, (window.innerWidth - panelW) / 2) : 24;

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Assistente Financeiro"
        style={{
          position:"fixed", bottom:24, right:24, zIndex:1000,
          width:52, height:52, borderRadius:"50%", border:"none", cursor:"pointer",
          background:"linear-gradient(135deg,#6366F1,#4F46E5)",
          boxShadow: open
            ? "0 0 0 4px rgba(99,102,241,0.25), 0 8px 32px rgba(99,102,241,0.5)"
            : "0 4px 20px rgba(99,102,241,0.5)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, transition:"all 0.2s ease",
          transform: open ? "scale(0.9) rotate(90deg)" : "scale(1)",
        }}
      >
        {open ? "✕" : "✨"}
      </button>

      {/* Painel de chat */}
      {open && (
        <div style={{
          position:"fixed", bottom:88, right:panelR, zIndex:999,
          width:panelW, height: mobile ? "min(510px, calc(100vh - 110px))" : 510, borderRadius:18,
          background:t.card, border:`1px solid ${t.border}`,
          boxShadow:"0 20px 60px rgba(0,0,0,0.4)",
          display:"flex", flexDirection:"column", overflow:"hidden",
          animation:"slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}>

          {/* Cabeçalho */}
          <div style={{
            padding:"12px 16px", borderBottom:`1px solid ${t.border}`,
            display:"flex", alignItems:"center", gap:10, flexShrink:0,
            background:`linear-gradient(135deg,${t.card},rgba(99,102,241,0.05))`,
          }}>
            <div style={{
              width:34, height:34, borderRadius:"50%", flexShrink:0,
              background:"linear-gradient(135deg,#6366F1,#4F46E5)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
            }}>✨</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:t.text }}>Assistente Financeiro</div>
              <div style={{ fontSize:11, color:"#10B981", fontWeight:500 }}>● análise em tempo real</div>
            </div>
            <button
              onClick={clearChat}
              title="Limpar conversa"
              style={{
                background:"transparent", border:"none", cursor:"pointer",
                color:t.muted, fontSize:13, padding:"4px 7px", borderRadius:6,
                fontFamily:"inherit",
              }}
            >🗑</button>
            <button onClick={() => setOpen(false)} style={{
              background:"transparent", border:"none", cursor:"pointer",
              color:t.muted, fontSize:16, padding:"4px 6px", borderRadius:6,
            }}>✕</button>
          </div>

          {/* Área de mensagens */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px 12px", display:"flex", flexDirection:"column", gap:10 }}>
            {(messages || []).map((m, i) => (
              <div key={m.id}>
                <MessageBubble m={m} t={t} />
                {/* Chips de ação rápida após a saudação */}
                {m.role === "assistant" && i === 0 && debts.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10, marginLeft:42 }}>
                    {CHIPS.map(c => (
                      <button key={c} onClick={() => send(c)} style={{
                        padding:"5px 11px", borderRadius:20,
                        border:`1px solid ${t.border}`, background:t.surface,
                        color:t.muted, fontSize:11, cursor:"pointer",
                        fontFamily:"inherit", fontWeight:500,
                      }}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Indicador de digitando */}
            {typing && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%", flexShrink:0,
                  background:`rgba(99,102,241,0.15)`, border:`1px solid ${t.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
                }}>✨</div>
                <div style={{
                  padding:"10px 14px", borderRadius:12, borderBottomLeftRadius:3,
                  background:t.surface, border:`1px solid ${t.border}`,
                  display:"flex", gap:4, alignItems:"center",
                }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width:6, height:6, borderRadius:"50%", background:t.muted,
                      animation:`bounce 1s ease ${i*0.2}s infinite`,
                      display:"inline-block",
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{
            padding:"10px 12px", borderTop:`1px solid ${t.border}`,
            display:"flex", gap:8, flexShrink:0,
            background:t.card,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pergunte sobre suas dívidas..."
              style={{
                flex:1, padding:"9px 13px", borderRadius:10,
                border:`1px solid ${t.border}`, background:t.surface,
                color:t.text, fontSize:12, outline:"none", fontFamily:"inherit",
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || typing}
              style={{
                width:38, height:38, borderRadius:10, border:"none", cursor:"pointer",
                background: input.trim() && !typing ? "linear-gradient(135deg,#6366F1,#4F46E5)" : t.border,
                color: input.trim() && !typing ? "white" : t.muted,
                fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, transition:"all 0.15s",
              }}
            >↑</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   Bolha de mensagem
─────────────────────────────────────────────*/
function MessageBubble({ m, t }) {
  const isUser = m.role === "user";
  return (
    <div style={{ display:"flex", flexDirection: isUser ? "row-reverse" : "row", alignItems:"flex-start", gap:8 }}>
      {!isUser && (
        <div style={{
          width:28, height:28, borderRadius:"50%", flexShrink:0, marginTop:2,
          background:`rgba(99,102,241,0.15)`, border:`1px solid rgba(99,102,241,0.3)`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
        }}>✨</div>
      )}
      <div style={{
        maxWidth:"85%", padding:"10px 13px", fontSize:12.5, lineHeight:1.65,
        borderRadius:13,
        borderBottomRightRadius: isUser ? 3 : 13,
        borderBottomLeftRadius:  isUser ? 13 : 3,
        background: isUser ? "linear-gradient(135deg,#6366F1,#4F46E5)" : t.surface,
        border: isUser ? "none" : `1px solid ${t.border}`,
        color: isUser ? "white" : t.text,
        wordBreak:"break-word",
      }}>
        <RenderText text={m.text} faintColor={isUser ? "rgba(255,255,255,0.7)" : t.muted}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Renderizador de texto com **negrito**
─────────────────────────────────────────────*/
function RenderText({ text }) {
  return (
    <div style={{ whiteSpace:"pre-wrap" }}>
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i} style={{ minHeight: line === "" ? "0.4em" : undefined }}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j}>{p.slice(2, -2)}</strong>
                : <span key={j}>{p}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
