# TasteCrew

**Agents, but with taste.** TasteCrew is an agentic group-night planner for the [Qloo Agentic Hackathon](https://qloo.devpost.com/).

Friends disagree about where to eat and what to watch. A plain LLM guesses. TasteCrew:

1. Resolves each person’s likes into Qloo entities (`/search`, filtered to taste types such as artist, movie, TV show, brand, book)
2. Maps the group’s mood text to Qloo place tags (`/v2/tags`, e.g. “casual dinner” → `urn:tag:good_for:qloo:casual_dinner`)
3. Asks Qloo Insights (`/v2/insights`) for **restaurants** (`filter.tags=urn:tag:category:place:restaurant`) in the chosen city (`filter.location.query`) and for movies that sit in the **shared** cultural neighborhood
4. Returns a consensus plan plus a **fair cost split** so the bill is settled without drama

Cultural intelligence is the differentiator: remove Qloo and the plan is vibes again.

## Why this fits the brief

| Requirement | How TasteCrew meets it |
| --- | --- |
| Agentic tool / agent framework | Multi-step planner: resolve → mood tags → insights → consensus → split |
| Must use Qloo | `/search` + `/v2/tags` + `/v2/insights` (place + restaurant tag + city, and movie) |
| Would not work the same without Qloo | Rankings come from the taste graph, not invented lists |
| Live demo + public OSS repo + MIT license | Live: https://tastecrew.onrender.com · this repo · MIT |

Optional later: wire the fair-split UX to Jack’s existing SplitPay / escrow agents (Celo x402, Arc AgentTab). Core demo stays Web2 so judges can click without a wallet.

## Quick start

```bash
npm install
cp .env.example .env
# Paste your hackathon key into QLOO_API_KEY. Without a key the app falls back to offline demo data.
npm start
# open http://127.0.0.1:8787
```

Hackathon keys only work against `https://hackathon.api.qloo.com` with header `X-Api-Key`.

Get a free key: [API Key Request Form](https://forms.gle/zz12orkLHTAneLGz6) (issued in a few business days). Guide: [Developer docs](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide).

Live demo: https://tastecrew.onrender.com

## API

- `GET /api/health` — service status; `qlooMode` is `live` when a key is configured
- `GET /api/search?q=` — entity lookup
- `POST /api/plan` — body `{ members: [{ name, likes: string[] }], mood?, budgetPerPerson?, city? }`

Partial Qloo failures are returned in an `errors[]` array and shown in the UI.

## Privacy

Do not commit API keys. Do not publish private emails in this repo. Public identity: **jackzhu88**.

## License

MIT — see [LICENSE](./LICENSE).
