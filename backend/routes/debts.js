import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middleware/auth.js";

const router   = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED = [
  "creditor","cat","for_","monthly","ti","paid","rem","total",
  "due","status","priority","note",
];

const VALID_STATUS   = ["active","urgent","overdue","negotiating","paused","paid"];
const VALID_PRIORITY = ["Alta","Média","Baixa"];
const UUID_RE        = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fmt = v => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function validateDebtFields(body) {
  const errors = [];

  if (body.creditor !== undefined) {
    if (typeof body.creditor !== "string" || !body.creditor.trim())
      errors.push("Nome do credor é obrigatório");
    else if (body.creditor.length > 100)
      errors.push("Nome do credor: máximo 100 caracteres");
  }
  if (body.cat !== undefined && (typeof body.cat !== "string" || body.cat.length > 100))
    errors.push("Categoria: máximo 100 caracteres");
  if (body.for_ !== undefined && (typeof body.for_ !== "string" || body.for_.length > 50))
    errors.push("Titular: máximo 50 caracteres");
  if (body.note !== undefined && (typeof body.note !== "string" || body.note.length > 500))
    errors.push("Observação: máximo 500 caracteres");

  for (const field of ["monthly","total"]) {
    if (body[field] !== undefined) {
      const n = Number(body[field]);
      if (isNaN(n) || n < 0 || n > 100_000_000)
        errors.push(`${field}: valor inválido`);
    }
  }
  for (const field of ["ti","paid","rem"]) {
    if (body[field] !== undefined) {
      const n = Number(body[field]);
      if (!Number.isInteger(n) || n < 0 || n > 10_000)
        errors.push(`${field}: deve ser um inteiro não-negativo`);
    }
  }
  if (body.due !== undefined && body.due !== null) {
    const n = Number(body.due);
    if (!Number.isInteger(n) || n < 1 || n > 31)
      errors.push("Dia de vencimento: deve ser entre 1 e 31");
  }
  if (body.status !== undefined && !VALID_STATUS.includes(body.status))
    errors.push(`Status inválido. Valores aceitos: ${VALID_STATUS.join(", ")}`);
  if (body.priority !== undefined && !VALID_PRIORITY.includes(body.priority))
    errors.push(`Prioridade inválida. Valores aceitos: ${VALID_PRIORITY.join(", ")}`);

  return errors;
}

async function log(user_id, action, entity, entity_id, description, old_value, new_value) {
  await supabase.from("audit_log").insert([
    { user_id, action, entity, entity_id, description, old_value: old_value ?? null, new_value: new_value ?? null },
  ]);
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: "Erro ao buscar dívidas" });
  res.json(data);
});

router.post("/", async (req, res) => {
  const errors = validateDebtFields(req.body ?? {});
  if (errors.length) return res.status(400).json({ error: errors[0] });

  if (!req.body?.creditor?.trim())
    return res.status(400).json({ error: "Nome do credor é obrigatório" });

  const payload = { user_id: req.user.id };
  for (const key of ALLOWED) {
    if (req.body[key] !== undefined) payload[key] = req.body[key];
  }

  const { data, error } = await supabase
    .from("debts")
    .insert([payload])
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Erro ao criar dívida" });

  await log(
    req.user.id, "CRIAR", "divida", data.id,
    `Dívida criada: ${data.creditor} — ${fmt(data.monthly)}/mês · ${data.ti} parcelas`,
    null, data
  );

  res.status(201).json(data);
});

router.put("/:id", async (req, res) => {
  if (!UUID_RE.test(req.params.id))
    return res.status(400).json({ error: "ID inválido" });

  const errors = validateDebtFields(req.body ?? {});
  if (errors.length) return res.status(400).json({ error: errors[0] });

  const { data: old } = await supabase
    .from("debts")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  const updates = {};
  for (const key of ALLOWED) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const { data, error } = await supabase
    .from("debts")
    .update(updates)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Erro ao atualizar dívida" });
  if (!data)  return res.status(404).json({ error: "Dívida não encontrada" });

  const changes = Object.keys(updates)
    .filter(k => old && String(old[k]) !== String(updates[k]))
    .join(", ");

  await log(
    req.user.id, "EDITAR", "divida", data.id,
    `Dívida editada: ${data.creditor} — ${fmt(data.monthly)}/mês${changes ? ` (${changes})` : ""}`,
    old, data
  );

  res.json(data);
});

router.delete("/:id", async (req, res) => {
  if (!UUID_RE.test(req.params.id))
    return res.status(400).json({ error: "ID inválido" });

  const { data: old } = await supabase
    .from("debts")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: "Erro ao excluir dívida" });

  await log(
    req.user.id, "EXCLUIR", "divida", req.params.id,
    `Dívida excluída: ${old?.creditor ?? "?"} — ${fmt(old?.monthly ?? 0)}/mês · ${old?.rem ?? 0} parcelas restantes`,
    old, null
  );

  res.json({ ok: true });
});

export default router;
