import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router   = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAuth(email, password, res) {
  if (!email || !password)
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  if (typeof email !== "string" || !EMAIL_RE.test(email))
    return res.status(400).json({ error: "Formato de email inválido" });
  if (typeof password !== "string" || password.length < 8)
    return res.status(400).json({ error: "A senha deve ter no mínimo 8 caracteres" });
  if (password.length > 128)
    return res.status(400).json({ error: "Senha muito longa" });
  return null;
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const invalid = validateAuth(email, password, res);
  if (invalid) return;

  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return res.status(401).json({ error: "Email ou senha incorretos" });

  res.json({
    token: data.session.access_token,
    user:  { id: data.user.id, email: data.user.email },
  });
});

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body ?? {};
  const invalid = validateAuth(email, password, res);
  if (invalid) return;

  if (name !== undefined && (typeof name !== "string" || name.length > 100))
    return res.status(400).json({ error: "Nome inválido" });

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name?.trim() ?? "" } },
  });
  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({
    token:   data.session?.access_token ?? null,
    user:    { id: data.user.id, email: data.user.email },
    message: data.session
      ? "Conta criada com sucesso!"
      : "Confirme seu e-mail para continuar.",
  });
});

export default router;
