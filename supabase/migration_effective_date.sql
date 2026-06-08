-- Adiciona data de vigência nas configurações do usuário
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS effective_date date NOT NULL DEFAULT CURRENT_DATE;
