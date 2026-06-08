-- ─── Extensão UUID ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tabela de dívidas ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor   text        NOT NULL,
  cat        text        NOT NULL DEFAULT 'Outros',
  for_       text        NOT NULL DEFAULT 'Minha',
  monthly    numeric     NOT NULL DEFAULT 0,
  ti         integer     NOT NULL DEFAULT 0,
  paid       integer     NOT NULL DEFAULT 0,
  rem        integer     NOT NULL DEFAULT 0,
  total      numeric     NOT NULL DEFAULT 0,
  due        integer,
  status     text        NOT NULL DEFAULT 'active',
  priority   text        NOT NULL DEFAULT 'Média',
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Row Level Security ───────────────────────────────────────────
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_debts" ON debts
  FOR ALL
  USING       (auth.uid() = user_id)
  WITH CHECK  (auth.uid() = user_id);

-- ─── Índice de performance ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS debts_user_id_idx ON debts (user_id);

-- ─── Constraints de status e prioridade ──────────────────────────
ALTER TABLE debts
  ADD CONSTRAINT debts_status_check
    CHECK (status IN ('active','urgent','overdue','negotiating','paused','paid'));

ALTER TABLE debts
  ADD CONSTRAINT debts_priority_check
    CHECK (priority IN ('Alta','Média','Baixa'));
