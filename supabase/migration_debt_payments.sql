-- ─── Tabela de histórico de pagamentos de parcelas ───────────────
CREATE TABLE IF NOT EXISTS debt_payments (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id            uuid        NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  installment_number integer     NOT NULL,
  amount             numeric     NOT NULL DEFAULT 0,
  paid_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── Row Level Security ───────────────────────────────────────────
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_debt_payments" ON debt_payments
  FOR ALL
  USING       (auth.uid() = user_id)
  WITH CHECK  (auth.uid() = user_id);

-- ─── Índices de performance ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS debt_payments_debt_id_idx ON debt_payments (debt_id);
CREATE INDEX IF NOT EXISTS debt_payments_user_id_idx ON debt_payments (user_id);
