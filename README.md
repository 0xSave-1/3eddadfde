# NEXORA Telegram Mini App

NEXORA is designed to open from a Telegram bot, not as a standalone customer site. The browser is useful only as a local development preview.

## First launch on Windows 10

1. Install [Node.js LTS](https://nodejs.org/) and PostgreSQL 16 (or use an existing managed PostgreSQL database).
2. Run `corepack enable` once, then `pnpm install` in this directory.
3. Copy `.env.example` to `.env.local` and fill in every required value. Keep `.env.local` private: it contains passwords, bot tokens, and payment credentials.
4. Create the database tables from the project schema, then run [0001_wallet_transactions_owner.sql](db/migrations/0001_wallet_transactions_owner.sql). The project contains schema definitions but no database migration runner, so this initial schema must be provisioned before the app can serve data.
5. Run `pnpm dev`. Open `http://localhost:3000` only for local preview.

## Connect Telegram

1. Create a bot with BotFather and put its token in `TELEGRAM_BOT_TOKEN`.
2. Deploy this app to a public HTTPS address and set `NEXT_PUBLIC_APP_URL` to that exact address.
3. Set the bot's Menu Button / Web App URL to `NEXT_PUBLIC_APP_URL` in BotFather.
4. Sign in at `/admin` with the owner account, then use **Telegram Bot → Register webhook**. The app verifies Telegram Web App `initData` server-side and creates a signed, httpOnly session before it associates a visitor with orders or wallet activity.

## Security notes

- Admin account passwords are stored only as salted scrypt hashes in PostgreSQL table `admin_users.password_hash`.
- The one-time owner bootstrap password is read from `ADMIN_PASSWORD`; it is never stored in source code.
- Admin and Telegram visitor sessions are signed, httpOnly cookies. Configure the two session secrets before deploying.
- Telegram bot tokens must stay in environment variables. Do not place them in `NEXT_PUBLIC_*` variables or commit `.env.local`.
- The `bot_instances.bot_token` database column in the pre-existing project is plaintext. Rotate any token that was already saved there and move token encryption to a managed secret store before using mirror bots in production.
