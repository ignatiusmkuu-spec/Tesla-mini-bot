# TESLA MINI BOT — implementation and design plan

## Product and implementation

Deliver a responsive project website and a downloadable, deployable bot source archive. The website is a static-first Node.js/Express server listening on `PORT` (default 3000), with the bot archive served as a same-origin download. The archive is independently installable and contains a Baileys WhatsApp worker, plugin registry, interactive menu router, owner-only management commands, Postgres-backed auth/key persistence, `.env.example`, Heroku process/deployment metadata and a practical setup guide.

The worker uses an external PostgreSQL URL for durable WhatsApp credentials, plugin state and basic activity counters; it never treats a dyno's local filesystem as permanent. The pairing flow is initiated with an owner phone number and prints the short-lived pairing code to worker logs. Reconnection uses bounded exponential backoff. Plugins register command/button handlers from `plugins/`, and owner authorization is checked on each administrative action. Provider-backed AI and media features are explicit integrations requiring provider credentials; the README lists setup and capabilities. Configuration errors are surfaced rather than hidden.

## Project structure

- `public/`: responsive bot product page, styles, client-side interactions, route manifest and downloadable `tesla-mini-bot.zip`.
- `src/server.js`: serves the site and archive with safe paths and correct content headers.
- `bot/`: standalone bot project (worker entry points, config, plugin loader, menus, PostgreSQL persistence, plugins, Heroku files, docs, tests).
- `plan.md`, `TODO.md`: scope, design and outcome tracking.

## Design

Style candidates: industrial terminal console (<0.10); understated editorial utility (<0.10); **electric signal-room product console** (<0.10; selected).

- **Design movement:** technical product terminal with restrained cybernetic cues, not a generic hacker dashboard.
- **Core principles:** sharp hierarchy; tangible product evidence; legible technical detail; progressive disclosure from benefits to deployment specifics.
- **Color philosophy:** near-black navy and soft white anchor clarity; Tesla cyan-green marks live actions, with amber for setup caveats.
- **Layout paradigm:** asymmetrical editorial hero: commanding headline and paired actions on the left, a tilted WhatsApp-style terminal/product visual on the right; below, a horizontal signal line links feature and setup sections.
- **Signature elements:** a custom bolt/terminal monogram; fine grid/noise texture; compact status chips and numbered deployment steps.
- **Interaction philosophy:** links and buttons reveal real destinations or content; copy/download actions give immediate feedback; reduced-motion preferences are respected.
- **Animation:** subtle entrance/fade and status pulse only; no looping distraction; disable nonessential motion with `prefers-reduced-motion`.
- **Typography:** system sans for display/body, monospace for code and system status; large condensed-feeling headline through weight/spacing rather than an external font dependency.
- **Brand essence:** a deployable WhatsApp command center for builders who need practical automation with explicit setup requirements; precise, capable, transparent.
- **Brand voice:** concise, technical, direct. Example: “One menu. A modular bot. Your rules.” and “Pair once, persist safely, deploy with confidence.”
- **Wordmark & logo:** custom angular bolt inside a rounded terminal frame, paired with a tight two-line TESLA / MINI BOT logotype.
- **Signature brand color:** electric mint-cyan.

## Delivery constraints

Third-party API functionality is credential-gated and documented; no unconfigured provider is described as live. Heroku deployment requires `DATABASE_URL` from a persistent external PostgreSQL service because dyno files are ephemeral. Site publication is not requested; deliver a working Preview and downloadable local ZIP artifact.