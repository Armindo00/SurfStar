# SurfStar

Plataforma de estatísticas de surf para treinadores e atletas — sessões onda a onda, team analytics, heats, pairing multi-treinador e subscrições.

**Live:** https://surf-star.vercel.app

## Funcionalidades

- Treino técnico, combos, heats, campeonato, análise de mar
- Pairing por código (atletas grátis)
- Team analytics (6 meses)
- Packs Starter / Team / Club com limites aplicados
- Checkout Stripe + webhook Supabase
- Modo local (sem cloud) para desenvolvimento

## Quick start

```bash
npm install
npm run dev
```

Telemóvel na mesma rede:

```bash
npm run dev:phone
```

## Cloud (produção)

1. Copia `.env.example` → `.env` e preenche Supabase + Stripe links
2. Corre as migrations SQL — ver [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md)
3. Deploy webhook: `supabase/functions/stripe-webhook`
4. Deploy frontend (Vercel) com as env vars `VITE_*`

Ver [`DEPLOY_WEB.md`](DEPLOY_WEB.md) para passos detalhados.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build produção |
| `npm test` | Testes (plan limits) |
| `npm run lint` | ESLint |

## Planos

| Pack | Atletas | Modos extra |
|------|---------|-------------|
| Starter | 5 | Técnico, combos |
| Team | 20 | + Team analytics |
| Club | ∞ | + Heats, campeonato, mar |

## Licença

Private — SurfStar
