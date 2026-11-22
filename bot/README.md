# TESLA MINI BOT

A modular WhatsApp automation worker built with Node.js and Baileys. It includes a menu system, provider-backed AI/search utilities, group automation, owner controls and PostgreSQL-backed WhatsApp auth. This package is a self-hosted community starter; WhatsApp/Baileys behavior and provider APIs can change independently of this repository.

## Requirements

- Node.js 20 or newer (Heroku stack configured to heroku-24).
- A durable PostgreSQL service, with `DATABASE_URL` reachable from the worker. The bot creates its small schema at startup. **Do not use dyno local storage for the WhatsApp session**: Heroku's filesystem is ephemeral.
- A WhatsApp account for linking. Use a dedicated number if possible and comply with WhatsApp's terms.

## Local setup

```sh
cd bot
cp .env.example .env
# Set DATABASE_URL and OWNER_NUMBERS; optionally set SESSION_ID before pairing
npm install
npm start
```

Set `PAIRING_NUMBER` to the owner's international phone number using digits only (country code included) before the first run. Read the short-lived code from the worker logs and enter it in WhatsApp → Linked devices → Link with phone number. Remove `PAIRING_NUMBER` after linking. Credentials and Signal keys are serialized into PostgreSQL by the custom Baileys auth adapter. Protect and back up the database; anyone with those credentials may control the linked account. Do not share logs containing pairing codes.

## Heroku deployment

1. Provision a persistent PostgreSQL database (Heroku Postgres or another managed service) and keep its URI ready. Pricing and availability vary by provider.
2. Deploy the GitHub repository root, not the `bot/` subdirectory. The Heroku setup form asks for `OWNER_NUMBERS` and optional `PAIRING_NUMBER`, `SESSION_ID`, and `AUTO_REPLY`; the root `Procfile` declares `web: npm start` and `worker: npm --prefix bot start`, and `heroku-postbuild` installs production dependencies from `bot/package-lock.json`.
3. In Heroku Settings → Config Vars, add `DATABASE_URL`. The root `Procfile` declares `web: npm start` for the website and `worker: npm --prefix bot start` for WhatsApp; `web.1` logs only confirm the website is running. New installs keep the worker at zero dynos until the database is ready; then set the worker dyno count to 1 in the Resources tab. This initial formation applies only when an app is created, so scale the worker manually on existing apps after the database and owner settings are ready. A worker dyno may incur Heroku charges. For first pairing, set `PAIRING_NUMBER`, read the worker logs for the short-lived code, link the account, then remove `PAIRING_NUMBER` and restart. Test `.ping` from a number in `OWNER_NUMBERS`; the default `BOT_MODE=private` keeps commands owner-only. Reconnection uses exponential backoff; logged-out sessions require a fresh pairing.
4. Ensure the PostgreSQL service has backups and appropriate access controls. The local `/tmp` or project directory is never used as persistent auth storage.

Heroku's filesystem is temporary, so durable PostgreSQL is mandatory. `DATABASE_URL` is intentionally omitted from the setup form because you will add it separately in Heroku Config Vars. WhatsApp auth is stored in PostgreSQL. `SESSION_ID` is an optional, non-secret namespace label: leave it unset to keep using the legacy default session, or set a stable value to isolate another linked session. Set it before pairing; changing it selects a different, initially unpaired session. `PAIRING_NUMBER` is only the phone number used for first-time linking. Optional provider keys in the table can be added to Config Vars when needed. Do not commit `.env` or credentials.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Durable PostgreSQL connection string |
| `OWNER_NUMBERS` | Yes for owner actions | Comma-separated owner numbers, international digits only |
| `PAIRING_NUMBER` | First link only | Requests a short-lived WhatsApp pairing code in worker logs |
| `SESSION_ID` | No | Optional stable label that selects an isolated PostgreSQL auth namespace; unset preserves existing sessions |
| `BOT_MODE` | No | `private` (default) or `public`; private restricts text commands to owners |
| `AUTO_REPLY` | No | `false` (default) or `true`; enables AI replies to non-owner text/captions in direct chats only; requires `OPENAI_API_KEY` |
| `PREFIX` | No | Command prefix, default `.` |
| `OPENAI_API_KEY` | Optional | `.ai`, `.image`, `.tts`, `.transcribe` |
| `OPENAI_CHAT_MODEL` | No | Chat model override, default `gpt-4o-mini` |
| `OPENWEATHER_API_KEY` | Optional | `.weather` |
| `TAVILY_API_KEY` | Optional | `.web` and video search |
| `DEEPL_API_KEY` | Optional | `.translate` (DeepL Free API endpoint) |
| `MEDIA_PROVIDER_URL`, `MEDIA_PROVIDER_KEY` | Optional | Compatible HTTPS media download API required by `.download` |
| `HEROKU_DEPLOY_WEBHOOK` | Optional | HTTPS deployment-pipeline hook for `.updatebot` |

AI image creation and speech generation use OpenAI endpoints and incur provider charges. Music search uses Apple's public iTunes Search API. Downloading is not bundled with a third-party downloader: configure a trusted compatible HTTPS provider. The bot caps downloaded media at 15 MB. Never expose provider secrets in chats or client code.

When `AUTO_REPLY=true`, the current incoming text or media caption from a non-owner direct chat is sent to the configured OpenAI chat model and its response is returned in that chat. This feature does not read group/status messages, reply to self-authored messages or prefixed commands, or persist message content or conversation history. It works while `BOT_MODE=private`; that setting continues to restrict commands to owners. Keep `AUTO_REPLY=false` to disable this data transfer and automatic replies.

## Commands

Core: `.menu`, `.start`, `.help`. No-key quick tools: `.ping`, `.uptime`, `.uuid`, `.flip`, `.roll [dN]`, `.choose option | option`, `.base64 encode|decode text`, `.calc expression`, `.qr text`. Provider-backed utilities: `.weather city`, `.translate ES | text`, `.ai prompt`, `.image prompt`, `.tts text`, `.transcribe` (reply to an audio message), `.web query`, `.music query`, `.video query`, `.download https://…`, `.sticker` (send/reply to image or short video). Group-admin commands: `.groupinfo`, `.members`, `.kick @member`, `.promote @member`, `.demote @member`, `.antilink on|off`, `.welcome on|off`, `.goodbye on|off`, `.autoreact on|off`, `.autolike on|off`.

Owner commands (numbers in `OWNER_NUMBERS` only): `.owner`, `.plugins`, `.plugininfo name`, `.installplugin name`, `.removeplugin name`, `.enableplugin name`, `.disableplugin name`, `.reloadplugin name`, `.stats` (including users active within 24 hours), `.session`, `.mode public|private`, `.features`, `.broadcast message`, `.updatebot`, `.restart`. Only bundled plugins can be installed/reloaded. Arbitrary remote JavaScript installation is deliberately not supported because executing fetched code as the bot account would be unsafe. Group moderation is restricted to group admins. Anti-link removal requires the bot to be a group admin. Auto-like and auto-react can produce high message volume; use sparingly.

## Menu video, compatibility and plugins

The provided `media/menu.mp4` is sent with the welcome before the button menu. If the asset is absent/unreadable, the bot still attempts to send the interactive menu. Menus of up to three actions use legacy buttons; larger menus use WhatsApp list messages to avoid the legacy button-count limit. If the client rejects both formats, a text menu shows unique action IDs. The menu router handles button, template, list and native-flow response IDs.

Plugins in `plugins/` are loaded at startup and register commands/event hooks; built-in plugin activation state is stored in PostgreSQL. To add trusted code, review a bundled module before including it in a deployment. `.installplugin` activates a known bundled plugin only and refuses arbitrary URLs. `.removeplugin` disables it; source remains in the package.

## Development and tests

```sh
npm test
```

The small automated test suite covers unique menu IDs and the welcome copy. For deployment validation, use a test WhatsApp number and non-production database first. WhatsApp connection tests require real credentials and cannot be run without a linked account and external service keys.

## License and operating notes

No specific license has been granted for redistribution; add an appropriate license file before public GitHub distribution. Keep bot dependencies updated and review WhatsApp platform rules, provider terms, privacy obligations and local law before use. This project does not promise uninterrupted service or official WhatsApp API compatibility.
