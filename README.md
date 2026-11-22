# TESLA MINI BOT

![TESLA MINI BOT showroom](public/media/tesla-showroom.png)

<p align="center">
  <a href="https://pair-tesla-md.onrender.com/heroku"><strong>⚡ Pair now</strong></a>
  &nbsp; · &nbsp;
  <a href="#heroku-deployment"><strong>Deploy to Heroku — setup guide</strong></a>
</p>

A modular WhatsApp automation bot with interactive menus, owner controls, provider-backed tools and PostgreSQL-backed session storage. The supplied video is sent with the bot's welcome menu.

> **Pairing safety:** “Pair now” opens a user-provided third-party site, not this repository. A WhatsApp pairing code grants access to your account. Only enter account details or codes on a service you trust; never share a code in a chat or public log.

## Website

The responsive product site is served by Node.js/Express. Run it locally with Node.js 20+:

```sh
npm install
npm start
```

The site listens on `PORT` or 3000. `GET /healthz` is a health endpoint, and `/tesla-mini-bot.zip` downloads the standalone bot package.

## Heroku deployment

The button above links to the included deployment instructions in [`bot/README.md`](bot/README.md). The bot uses Heroku's `worker` process and requires durable PostgreSQL for its WhatsApp auth state—dyno local storage is ephemeral. Configure `DATABASE_URL`, `OWNER_NUMBERS`, pair through worker logs, and see the detailed environment-variable guide before enabling the worker.

A true one-click Heroku Deploy button must point at a public GitHub repository. This repository is currently stored in the Manus project remote; no public GitHub URL was provided, so the README deliberately avoids a nonfunctional placeholder deploy link. Once the source is pushed to a public GitHub repository, the standard Heroku button can target that exact repository URL.

## Files

- `bot/` — standalone Baileys worker, plugin architecture, Postgres auth adapter, Heroku files, tests and deployment docs.
- `public/` — website, route manifest, README image and downloadable archive.
- `src/server.js` — website and archive-serving endpoints.
