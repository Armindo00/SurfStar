# SurfStar

Surf statistics platform for coaches and athletes — wave-by-wave sessions, team analytics, heats, multi-coach pairing, and subscriptions.

**Live:** https://www.surfstar.app

## Features

- Technical training, combos, heats & championship (Coach); custom training & sea analysis (Coach Premium+)
- Live session stats on the beach
- Athlete pairing by code (athletes join free)
- Team analytics with 6-month evolution charts
- Plans: **Coach** (€49/mo) · **Coach Premium** (€89/mo) · **Team Academy** (€179/mo, approval-only)
- Annual billing with 2 months free
- **Launch billing:** manual admin approval + payment confirmation (default)
- Stripe checkout + Supabase webhook (Phase 2 — configure when ready)
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

1. Copy `.env.example` → `.env` and fill Supabase (manual payments work without Stripe)
2. Run SQL migrations — see [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md)
3. Deploy frontend (Vercel) with `VITE_*` env vars
4. Complete the ops checklist — [`LAUNCH_OPS.md`](LAUNCH_OPS.md) (IBAN, SMTP, edge functions, smoke test)
5. Optional (Stripe Phase 2): payment links + `supabase/functions/stripe-webhook`

See [`DEPLOY_WEB.md`](DEPLOY_WEB.md) for web deploy steps.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |
| `npm run ops:verify` | Check launch env / optional remote ops |

## Plans

| Plan | Price | Athletes | Highlights |
|------|-------|----------|------------|
| Coach | €49/mo | 20 | Technical, combos, heats, championship, team analytics |
| Coach Premium | €89/mo | Unlimited | + Custom training, sea analysis, psychology check-ins |
| Team Academy | €179/mo | Unlimited | + Multi-coach organization (by approval) |

Annual: €490 / €890 / €1790 (2 months free).

## License

Private — SurfStar
