# Publicar SurfStar na web (Supabase + Vercel)

Sim — **já faz sentido**. Assim abres no telemóvel com um link `https://...`, sem Wi‑Fi nem firewall, e os dados ficam na nuvem.

**Checklist completo de lançamento (manual billing):** [`LAUNCH_OPS.md`](LAUNCH_OPS.md)

## Resumo

| Modo | Onde corre | Dados |
|------|------------|--------|
| `npm run dev` (sem `.env`) | Só no PC/browser | localStorage |
| Com Supabase + Vercel | Qualquer telemóvel | Nuvem |

---

## Passo 1 — Criar projeto Supabase (grátis)

1. Vai a [https://supabase.com](https://supabase.com) e cria conta.
2. **New project** → escolhe nome e password da base de dados.
3. Quando estiver pronto:
   - **Project Settings → API**
   - Copia **Project URL** → `VITE_SUPABASE_URL`
   - Copia **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. **Authentication → Providers → Email**:
   - **Produção:** mantém **Confirm email** ligado (identidade verificada antes de treinar/pagar).
   - **Só em testes locais:** podes desligar Confirm email para entrar logo após o registo.
5. **Authentication → URL Configuration**:
   - **Site URL:** `https://www.surfstar.app`
   - **Redirect URLs:** inclui `https://www.surfstar.app/reset-password` e `https://www.surfstar.app/forgot-password`
6. **Authentication → Email Templates → Reset password** — usa o código OTP (não só o link):
   - No corpo do email inclui `{{ .Token }}` (código de 6 dígitos)
   - Exemplo: *"Your SurfStar reset code is: **{{ .Token }}**"*
   - Configura o remetente como **SurfStar** / `contact@surfstar.app` (SMTP customizado em Authentication → SMTP)
7. **SQL Editor** — corre **todos** os scripts por ordem (ver [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md)), incluindo `fix-subscription-security.sql` para produção. Confirma com `check-migrations.sql`.
8. **Produção checklist (pagamento manual):** segue [`LAUNCH_OPS.md`](LAUNCH_OPS.md) — IBAN, edge functions de email, Vercel env, smoke test.

---

## Passo 1b — Stripe (fase 2, opcional)

O lançamento atual usa **aprovação admin + confirmação de pagamento manual**. Stripe fica para quando quiseres self-serve.

1. Cria Payment Links para Coach e Coach Premium (mensal + anual) no Stripe Dashboard.
2. Cola os URLs em `.env` / Vercel (`VITE_STRIPE_LINK_*`) e define `VITE_MANUAL_PAYMENTS=false`.
3. Deploy da Edge Function `supabase/functions/stripe-webhook` e configura webhook Stripe (deve atualizar `organization_subscriptions`).
4. Ver detalhes em [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md).

Para **dev sem Stripe**: `VITE_DEMO_SUBSCRIPTION=true` + SQL `demo_subscriptions = true` (nunca em produção).

---

## Passo 2 — Configurar o projeto no PC

Na pasta do projeto, cria um ficheiro `.env` a partir de `.env.example`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_MANUAL_PAYMENTS=true
VITE_DEMO_SUBSCRIPTION=false
```

Testa localmente:

```bash
npm run dev
npm run ops:verify
```

No login deve aparecer **Online · cloud version**. Cria conta de treinador em **Create account**.

---

## Passo 3 — Publicar na Vercel (grátis)

1. Cria conta em [https://vercel.com](https://vercel.com).
2. **Add New → Project** → importa esta pasta (GitHub ou upload).
3. Em **Environment Variables**, adiciona no mínimo:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MANUAL_PAYMENTS=true`
   - `VITE_DEMO_SUBSCRIPTION=false`
   - `VITE_LEGAL_ENTITY_NAME` / `VITE_LEGAL_NIF` / `VITE_LEGAL_ADDRESS`
4. **Deploy**.

Recebes um URL tipo `https://surfstar-xxx.vercel.app` — abre no telemóvel e **Adicionar ao ecrã inicial**.

Lista completa: [`LAUNCH_OPS.md`](LAUNCH_OPS.md) secção E.

---

## Passo 4 — Usar no telemóvel

1. Abre o link HTTPS no Chrome/Safari (`https://www.surfstar.app` ou o preview Vercel).
2. **Treinador** → escolhe pack na landing, cria conta e **submete pedido de pagamento** (manual).
3. No **Admin** (conta em `platform_admin_emails`): aprova → envia IBAN/MB Way → confirma pagamento → ativa.
4. **Gerir atletas** → pede o **código de pairing** ao atleta (conta grátis no separador Atleta).
5. Atleta aceita o pedido na app — fica ligado ao treinador.

Os mesmos logins funcionam no PC e no telemóvel.

Emails transacionais (pedido, IBAN, ativação, renovações): ver [`supabase/COACH_EMAILS.md`](supabase/COACH_EMAILS.md) e [`LAUNCH_OPS.md`](LAUNCH_OPS.md) secção D.

---

## Alternativas à Vercel

- **Netlify**: build `npm run build`, publish folder `dist`, mesmas variáveis `VITE_*`.
- **Cloudflare Pages**: idem.

O ficheiro `vercel.json` já trata das rotas da SPA.

---

## Ainda queres testar só na rede local?

Continua a funcionar `npm run dev:phone`, mas na prática a web + Supabase resolve o problema do “não é possível aceder”.

Guia Wi‑Fi local (dev / localStorage): `INSTALAR_TELEMOVEL.md`.

---

## Notas de segurança

- A chave **anon** pode ir no frontend; as regras **RLS** no Supabase protegem os dados.
- Nunca coloques a **service_role** key no código da app.
- Para produção: confirmação de email ON, `VITE_DEMO_SUBSCRIPTION=false`, e passwords fortes.
