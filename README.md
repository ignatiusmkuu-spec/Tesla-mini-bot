# TESLA MINI BOT

![TESLA MINI BOT showroom](public/media/tesla-showroom.png)

<p align="center">
  <a href="https://pair-tesla-md.onrender.com/heroku"><strong>⚡ Pair now</strong></a>
  &nbsp; · &nbsp;
  <a href="#heroku-deployment"><strong>Deploy to Heroku — setup guide</strong></a>
</p>

A modular WhatsApp automation bot with interactive menus, owner controls, provider-backed tools and PostgreSQL-backed session storage. The supplied video is sent with the bot's welcome menu.

> **Pairing safety:** “Pair now” opens a user-provided third-party site, not this repository. A WhatsApp pairing code grants access to your account. Only enter account details or codes on a service you trust; never share a code in a chat or public log.

## Shiny glowing snippet

For a neon-style title in a custom web page, this copyable HTML/CSS snippet adds a soft, animated glow:

```html
<style>
  .tesla-glow {
    color: #effcff;
    font: 700 1.35rem/1.4 system-ui, sans-serif;
    text-shadow: 0 0 5px #b2f6ff, 0 0 14px #13c6e8, 0 0 28px #0089bd;
    animation: tesla-glow 2.4s ease-in-out infinite alternate;
  }

  @keyframes tesla-glow {
    from { text-shadow: 0 0 5px #b2f6ff, 0 0 12px #13c6e8; }
    to { text-shadow: 0 0 9px #fff, 0 0 20px #13c6e8, 0 0 34px #0089bd; }
  }

  @media (prefers-reduced-motion: reduce) {
    .tesla-glow { animation: none; }
  }
</style>
<p class="tesla-glow">⚡ TESLA MINI BOT</p>
```

GitHub displays this as source code; it does not execute custom CSS in a README.

## Website

The responsive product site is served by Node.js/Express. Run it locally with Node.js 20+:

```sh
npm install
npm start
```

The site listens on `PORT` or 3000. `GET /healthz` is a health endpoint, and `/tesla-mini-bot.zip` downloads the standalone bot package.

## Heroku deployment

The button above links to the included deployment instructions in [`bot/README.md`](bot/README.md). The bot uses Heroku's `worker` process and requires durable PostgreSQL for its WhatsApp auth state—dyno local storage is ephemeral. Configure `DATABASE_URL`, `OWNER_NUMBERS`, pair through worker logs, and see the detailed environment-variable guide before enabling the worker.

The complete website and bot source are publicly available at [`ignatiusmkuu-spec/Tesla-mini-bot`](https://github.com/ignatiusmkuu-spec/Tesla-mini-bot). This README links to the deployment guide rather than a one-click Heroku deploy action; use the steps in [`bot/README.md`](bot/README.md) and configure durable PostgreSQL before starting the worker.

## Files

- `bot/` — standalone Baileys worker, plugin architecture, Postgres auth adapter, Heroku files, tests and deployment docs.
- `public/` — website, route manifest, README image and downloadable archive.
- `src/server.js` — website and archive-serving endpoints.
