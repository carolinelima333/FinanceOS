-- ─── Configurações do usuário (salário e reserva) ─────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salary       numeric     NOT NULL DEFAULT 0,
  cash_balance numeric     NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_settings" ON user_settings
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Log de auditoria ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text        NOT NULL,  -- CRIAR | EDITAR | EXCLUIR | SALARIO | RESERVA
  entity      text        NOT NULL,  -- divida | salario | reserva
  entity_id   uuid,
  description text        NOT NULL,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_audit" ON audit_log
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx   ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);
