import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middleware/auth.js";

const router   = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.use(requireAuth);

router.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, entity, entity_id, description, old_value, new_value, created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: "Erro ao buscar auditoria" });
  res.json(data || []);
});

export default router;
