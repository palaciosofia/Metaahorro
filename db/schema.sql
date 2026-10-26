CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  target_amount BIGINT       NOT NULL CHECK (target_amount > 0),
  balance       BIGINT       NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals (user_id);

CREATE TABLE IF NOT EXISTS movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id         UUID         NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(10)  NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL')),
  amount          BIGINT       NOT NULL CHECK (amount > 0),
  idempotency_key VARCHAR(100) NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_movements_user_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_movements_goal_created ON movements (goal_id, created_at DESC);
