# TESLA MINI BOT

![TESLA MINI BOT showroom](public/media/tesla-showroom.png)

<p align="center">
  <a href="https://pair-tesla-md.onrender.com/heroku"><strong>⚡ Pair now</strong></a>
  &nbsp; · &nbsp;
  <a href="https://heroku.com/deploy?template=https://github.com/ignatiusmkuu-spec/Tesla-mini-bot" target="_blank" rel="noopener noreferrer"><strong>Deploy to Heroku</strong></a>
  &nbsp; · &nbsp;
  <a href="#heroku-deployment"><strong>Setup guide</strong></a>
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

The Heroku button deploys from the repository root, where `app.json` declares required and optional config vars and the worker formation. The root `Procfile` starts the bot in `bot/`; the root build installs its locked dependencies. Durable PostgreSQL is required because dyno storage is ephemeral. Review [`bot/README.md`](bot/README.md) before pairing.

The public source is [`ignatiusmkuu-spec/Tesla-mini-bot`](https://github.com/ignatiusmkuu-spec/Tesla-mini-bot). Heroku's setup flow asks for `DATABASE_URL` and `OWNER_NUMBERS`; provide a durable PostgreSQL URI and keep all credentials in Heroku Config Vars, never in source control.

## Files

- `bot/` — standalone Baileys worker, plugin architecture, Postgres auth adapter, Heroku files, tests and deployment docs.
- `public/` — website, route manifest, README image and downloadable archive.
- `src/server.js` — website and archive-serving endpoints.
