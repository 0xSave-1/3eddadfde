-- Run once against the PostgreSQL database before deploying this version.
-- New transactions are tied to one Telegram Mini App visitor. Old shared-wallet
-- transactions remain available to administrators but are not shown to users.
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS visitor_id text;

CREATE INDEX IF NOT EXISTS wallet_transactions_visitor_created_at_idx
  ON wallet_transactions (visitor_id, created_at DESC);
