# TasteCrew

**Agents, but with taste.** TasteCrew is an agentic group-night planner for the [Qloo Agentic Hackathon](https://qloo.devpost.com/).

Friends disagree about where to eat and what to watch. A plain LLM guesses. TasteCrew:

1. Resolves each person’s likes into Qloo entities (`/search`)
2. Asks Qloo Insights (`/v2/insights`) for places and movies that sit in the **shared** cultural neighborhood
3. Returns a consensus plan plus a **fair cost split** so the bill is settled without drama

Cultural intelligence is the differentiator: remove Qloo and the plan is vibes again.

## Why this fits the brief

| Requirement | How TasteCrew meets it |
| --- | --- |
| Agentic tool / agent framework | Multi-step planner: resolve → insights → consensus → split |
| Must use Qloo | `/search` + `/v2/insights` with `filter.type` place & movie |
| Would not work the same without Qloo | Rankings come from the taste graph, not invented lists |
| Live demo + public OSS repo + MIT license | This repo; host on Render / Pages later |

Optional later: wire the fair-split UX to Jack’s existing SplitPay / escrow agents (Celo x402, Arc AgentTab). Core demo stays Web2 so judges can click without a wallet.

## Quick start

```bash
npm install
cp .env.example .env
# Leave QLOO_API_KEY empty for mock mode, or paste your hackathon key
npm start
# open http://127.0.0.1:8787
```

Hackathon keys only work against `https://hackathon.api.qloo.com` with header `X-Api-Key`.

Get a free key: [API Key Request Form](https://forms.gle/zz12orkLHTAneLGz6) (issued in a few business days). Guide: [Developer docs](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide).

## API

- `GET /api/health` — service + mock/live mode
- `GET /api/search?q=` — entity lookup
- `POST /api/plan` — body `{ members: [{ name, likes: string[] }], mood?, budgetPerPerson?, city? }`

## Privacy

Do not commit API keys. Do not publish private emails in this repo. Public identity: **jackzhu88**.

## License

MIT — see [LICENSE](./LICENSE).
