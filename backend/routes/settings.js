import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middleware/auth.js";

const router   = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(str) {
  if (!DATE_RE.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("user_settings")
    .select("salary, cash_balance, effective_date")
    .eq("user_id", req.user.id)
    .single();

  if (error && error.code !== "PGRST116")
    return res.status(500).json({ error: "Erro ao buscar configurações" });

  res.json(data || { salary: 0, cash_balance: 0, effective_date: null });
});

router.put("/", async (req, res) => {
  const salary       = Number(req.body?.salary)       || 0;
  const cash_balance = Number(req.body?.cash_balance) || 0;
  const rawDate      = req.body?.effective_date;
  const effective_date = rawDate && isValidDate(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10);

  if (isNaN(salary) || salary < 0 || salary > 100_000_000)
    return res.status(400).json({ error: "Valor de salário inválido" });
  if (isNaN(cash_balance) || cash_balance < 0 || cash_balance > 100_000_000)
    return res.status(400).json({ error: "Valor de reserva inválido" });

  const { data: old } = await supabase
    .from("user_settings")
    .select("salary, cash_balance, effective_date")
    .eq("user_id", req.user.id)
    .single();

  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: req.user.id, salary, cash_balance, effective_date, updated_at: new Date().toISOString() })
    .select("salary, cash_balance, effective_date")
    .single();

  if (error) return res.status(500).json({ error: "Erro ao salvar configurações" });

  const logs = [];
  const fmt = v => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const fmtDate = iso => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  if (!old || Number(old.salary) !== salary || old.effective_date !== effective_date) {
    logs.push({
      user_id:     req.user.id,
      action:      "SALARIO",
      entity:      "salario",
      description: `Salário atualizado: ${fmt(old?.salary ?? 0)} → ${fmt(salary)} · Vigência: ${fmtDate(effective_date)}`,
      old_value:   { salary: old?.salary ?? 0, effective_date: old?.effective_date },
      new_value:   { salary, effective_date },
    });
  }
  if (!old || Number(old.cash_balance) !== cash_balance) {
    logs.push({
      user_id:     req.user.id,
      action:      "RESERVA",
      entity:      "reserva",
      description: `Reserva atualizada: ${fmt(old?.cash_balance ?? 0)} → ${fmt(cash_balance)} · Vigência: ${fmtDate(effective_date)}`,
      old_value:   { cash_balance: old?.cash_balance ?? 0, effective_date: old?.effective_date },
      new_value:   { cash_balance, effective_date },
    });
  }
  if (logs.length > 0) await supabase.from("audit_log").insert(logs);

  res.json(data);
});

export default router;
