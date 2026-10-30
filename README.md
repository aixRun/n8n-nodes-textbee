# @aixrun/n8n-nodes-textbee

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)
[![npm](https://img.shields.io/npm/v/@aixrun/n8n-nodes-textbee.svg)](https://www.npmjs.com/package/@aixrun/n8n-nodes-textbee)

Unofficial n8n community node for [textbee](https://textbee.dev) — send and receive SMS through your Android phone over REST and webhooks.

Maintained by [aixRun](https://www.aixrun.de) ([info@axirun.de](`mailto:info@aixrun.de`)).

**Not affiliated with or endorsed by textbee / Nuver Labs.** The textbee name is used only to identify the service this package connects to. This package does not include the textbee logo or other brand assets ([textbee Terms of Service](https://textbee.dev/terms-of-service): MIT covers their code, not their name or logo).

## Installation

### Self-hosted n8n (GUI)

1. Go to **Settings → Community Nodes**
2. Select **Install**
3. Enter `@aixrun/n8n-nodes-textbee`
4. Agree to the risks and install

### Self-hosted n8n (environment)

```bash
N8N_COMMUNITY_PACKAGES=@aixrun/n8n-nodes-textbee
```

### Local development

```bash
npm install
npm run dev
```

This starts a local n8n instance with the node loaded (`n8n-node dev`). Open http://localhost:5678 and search for **TextBee**.

## Credentials

Create a **TextBee API** credential:

| Field                      | Required     | Description                                                                                                                                                      |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Key**                | Yes          | From the [TextBee dashboard](https://app.textbee.dev/dashboard)                                                                                                  |
| **Base URL**               | No           | Defaults to `https://api.textbee.dev`. Change for [self-hosted](https://textbee.dev/docs/self-hosting) instances. `/api/v1` is optional and added automatically. |
| **Webhook Signing Secret** | Trigger only | At least 20 characters. Used to create TextBee webhook subscriptions and verify `X-Signature`.                                                                   |

## Nodes

### TextBee (action)

Resources:

- **Message** — Send, Send Bulk, Get Many, Get, Get Batch
- **Device** — Get Many, Get
- **Account** — Get account totals (sent/received SMS, devices, API keys)
- **Webhook Subscription** — Create, Get, Get Many, Update, Delete, Get Notifications

### TextBee Trigger

Starts a workflow when TextBee POSTs an SMS event (`MESSAGE_RECEIVED`, `MESSAGE_SENT`, `MESSAGE_DELIVERED`, `MESSAGE_FAILED`, `UNKNOWN_STATE`).

On activate, the trigger registers a webhook subscription with TextBee using your n8n production webhook URL and the credential signing secret. On deactivate, it deletes that subscription.

Incoming requests are verified with HMAC-SHA256 over the raw body (`X-Signature` hex digest). Invalid signatures receive HTTP 401.

## Usage examples

### Send an SMS

1. Add a **TextBee** node
2. Resource: **Message**, Operation: **Send**
3. Set **Message** and **Recipients** (E.164, comma-separated)
4. Optionally pick a **Device**

A `200` means TextBee accepted the batch (`smsBatchId`). It is not delivery confirmation — use **Get Batch** or **Get Many** filtered by `smsBatchId`.

### Receive SMS

1. Enable **Receive SMS** in the TextBee Android app
2. Add a **TextBee Trigger** and select **Message Received**
3. Activate the workflow (production URL must be publicly reachable HTTPS)
4. Ensure the credential has a signing secret (≥20 chars)

TextBee may retry deliveries. Deduplicate using the `idempotencyKey` field in the payload.

## API reference

- [TextBee API reference](https://textbee.dev/docs/api-reference)
- [Webhooks](https://textbee.dev/docs/webhooks)
- [Self-hosting](https://textbee.dev/docs/self-hosting)

## Compatibility

- Node.js ≥ 22
- Built with `@n8n/node-cli` for community node verification guidelines (MIT, no runtime dependencies, English UI)

## CI / Publishing

One workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

- **Pull requests:** lint + build
- **Push to `main`:** lint + build → semantic-release (changelog, version, tag) → npm publish with provenance

Use conventional commits (`feat:`, `fix:`, `feat!:`, …).

On npm ([aixrun](https://www.npmjs.com/settings/aixrun/packages)), set Trusted Publisher to workflow **`ci.yml`** (or set `NPM_TOKEN`).

After publish: `npx @n8n/scan-community-package @aixrun/n8n-nodes-textbee`  
Local hooks: `npx husky` · dry-run: `npx semantic-release --dry-run`

## License

This package is [MIT](./LICENSE.md).

Third-party notices (Heroicons glyph attribution, textbee trademark/logo boundaries, affiliation disclaimer) are in [NOTICE.md](./NOTICE.md).
