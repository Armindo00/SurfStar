# SurfStar

Surf statistics platform for coaches and athletes — wave-by-wave sessions, team analytics, heats, multi-coach pairing, and subscriptions.

**Live:** https://www.surfstar.app

## Features

- Technical training, combos, heats, championship, sea analysis, custom training (Coach Premium)
- Live session stats on the beach
- Athlete pairing by code (athletes join free)
- Team analytics with 6-month evolution charts
- Plans: **Coach** (€49/mo) · **Coach Premium** (€89/mo) · **Team Academy** (€179/mo, approval-only)
- Annual billing with 2 months free
- Stripe checkout + Supabase webhook
- Platform admin panel for Team Academy approvals and account management
- Local mode (no cloud) for development

## Quick start

```bash
npm install
npm run dev
```

Test on your phone (same Wi‑Fi):

```bash
npm run dev:phone
```

## Cloud (production)

1. Copy `.env.example` → `.env` and fill Supabase + Stripe payment links
2. Run SQL migrations — see [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md)
3. Deploy webhook: `supabase/functions/stripe-webhook`
4. Deploy frontend (Vercel) with `VITE_*` env vars

See [`DEPLOY_WEB.md`](DEPLOY_WEB.md) for detailed steps.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |

## Plans

| Plan | Price | Athletes | Highlights |
|------|-------|----------|------------|
| Coach | €49/mo | 20 | Technical, combos, sea analysis, team analytics |
| Coach Premium | €89/mo | 50 | + Custom training, heats, championship |
| Team Academy | €179/mo | Unlimited | + Multi-coach organization (by approval) |

Annual: €490 / €890 / €1790 (2 months free).

## License

Private — SurfStar
