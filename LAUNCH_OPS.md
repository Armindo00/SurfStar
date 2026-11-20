# SurfStar — checklist de ops (lançamento manual)

Fonte única para pôr produção a funcionar **sem Stripe**.  
Produto: aprovação admin + confirmação de pagamento (IBAN / MB Way).

Guia web geral: [`DEPLOY_WEB.md`](DEPLOY_WEB.md) · migrations: [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md)

Verificação local das env vars:

```bash
npm run ops:verify
```

Com service role + URL (opcional), o script também confirma IBAN/MB Way e webhooks em `app_settings`.

---

## Estado desejado

| Área | Produção |
|------|----------|
| Billing | Manual (`VITE_MANUAL_PAYMENTS=true`, sem Stripe links) |
| Demo | Off (`VITE_DEMO_SUBSCRIPTION=false`, `demo_subscriptions = false`) |
| Site | `https://www.surfstar.app` |
| Emails | Amen SMTP → `contact@surfstar.app` |
| Admin app | login pessoal em `platform_admin_emails` |
| Alertas | `admin_notification_emails` (negócio) |

---

## A. Supabase — SQL

- [ ] Correr migrations **1–31** por ordem ([`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md))
- [ ] Correr [`supabase/check-migrations.sql`](supabase/check-migrations.sql) → tudo **OK** (nada **FALTA**)
- [ ] Antes de users reais: [`supabase/cleanup-test-data.sql`](supabase/cleanup-test-data.sql) (preserva emails em `platform_admin_emails`)
- [ ] Confirmar `demo_subscriptions = false` (vem de `fix-subscription-security.sql`)

```sql
select key, value from public.app_settings
where key in (
  'demo_subscriptions',
  'platform_admin_emails',
  'admin_notification_emails',
  'manual_payment_details',
  'admin_notify_webhook',
  'coach_notify_webhook'
);
```

---

## B. Pagamento manual (IBAN / MB Way)

Sem isto, o email de aprovação diz ao coach para contactar suporte.

**Opção 1 — Admin na app** (depois de migration 26): Admin → definições de pagamento.

**Opção 2 — Script** (nunca commits secrets):

```bash
SURFSTAR_MANUAL_IBAN='PT50…' \
SURFSTAR_MANUAL_MBWAY='+351…' \
SURFSTAR_MANUAL_ACCOUNT_NAME='SurfStar' \
VITE_SUPABASE_URL='https://xxxx.supabase.co' \
SUPABASE_SERVICE_ROLE_KEY='…' \
node scripts/apply-manual-payment-details.mjs
```

**Opção 3 — SQL** (ver [`supabase/COACH_EMAILS.md`](supabase/COACH_EMAILS.md)).

- [ ] IBAN real gravado
- [ ] MB Way (se aplicável) gravado
- [ ] Hint de referência (email do registo)

---

## C. Auth (Supabase Dashboard)

- [ ] **Authentication → Providers → Email:** Confirm email **ON**
- [ ] **URL Configuration → Site URL:** `https://www.surfstar.app`
- [ ] **Redirect URLs:** `https://www.surfstar.app/reset-password` e `/forgot-password` (+ preview Vercel se precisares)
- [ ] **Email Templates → Reset password:** inclui `{{ .Token }}` (código OTP de 6 dígitos)
- [ ] **Authentication → SMTP:** Amen / `contact@surfstar.app` (mesmo remetente das edge functions)
- [ ] `platform_admin_emails` = o teu login de Admin (pessoal)

---

## D. Emails — secrets + edge functions

Detalhe: [`ADMIN_NOTIFY.md`](supabase/ADMIN_NOTIFY.md) · [`COACH_EMAILS.md`](supabase/COACH_EMAILS.md) · [`RENEWAL_EMAILS.md`](supabase/RENEWAL_EMAILS.md)

### Secrets (uma vez)

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase secrets set CRON_SECRET=your-long-random-secret
supabase secrets set SMTP_HOST=smtp-pt.securemail.pro
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_USER=contact@surfstar.app
supabase secrets set SMTP_PASSWORD=your-amen-password
supabase secrets set SMTP_FROM=contact@surfstar.app
supabase secrets set SMTP_FROM_NAME=SurfStar
supabase secrets set COACH_NOTIFY_BCC=contact@surfstar.app,armindoapp@outlook.com
```

- [ ] Secrets SMTP + `CRON_SECRET` definidos

### Deploy

```bash
supabase functions deploy admin-notify --no-verify-jwt
supabase functions deploy coach-notify --no-verify-jwt
supabase functions deploy subscription-renewal-cron --no-verify-jwt
```

- [ ] Três functions deployed

### Webhooks em `app_settings`

Substituir `YOUR_PROJECT_REF` e o mesmo `CRON_SECRET`:

```sql
update public.app_settings
set value = jsonb_build_object(
  'enabled', true,
  'url', 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-notify',
  'secret', 'YOUR_CRON_SECRET'
)
where key = 'admin_notify_webhook';

update public.app_settings
set value = jsonb_build_object(
  'enabled', true,
  'url', 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/coach-notify',
  'secret', 'YOUR_CRON_SECRET'
)
where key = 'coach_notify_webhook';
```

- [ ] `admin_notify_webhook` enabled
- [ ] `coach_notify_webhook` enabled

### Cron diário (renovações)

Dashboard → Edge Functions → `subscription-renewal-cron` → Schedule:

- Expressão: `0 9 * * *` (09:00 UTC)
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

- [ ] Cron diário ativo

### Destinatários negócio

- [ ] Corrido `patch-business-email-recipients.sql` (alerts + BCC → contact + armindoapp)

---

## E. Vercel (frontend)

Environment Variables (Production + Preview se quiseres testar):

| Variável | Valor |
|----------|--------|
| `VITE_SUPABASE_URL` | URL do projeto |
| `VITE_SUPABASE_ANON_KEY` | anon public |
| `VITE_MANUAL_PAYMENTS` | `true` |
| `VITE_DEMO_SUBSCRIPTION` | `false` |
| `VITE_APP_URL` | `https://www.surfstar.app` |
| `VITE_CONTACT_EMAIL` | `contact@surfstar.app` |
| `VITE_LEGAL_ENTITY_NAME` | Nome legal |
| `VITE_LEGAL_NIF` | NIF |
| `VITE_LEGAL_ADDRESS` | Morada |
| `VITE_COMPLAINTS_BOOK_URL` | (opcional) livro reclamações |
| `VITE_SENTRY_DSN` | (opcional) |

**Não** definir `VITE_STRIPE_LINK_*` no lançamento (forçaria Stripe se `VITE_MANUAL_PAYMENTS` não estiver `true`).

- [ ] Env de produção preenchidas
- [ ] Redeploy após mudar `VITE_*`
- [ ] Domínio `www.surfstar.app` → Vercel
- [ ] Auth redirect URLs batem certo com o domínio

---

## F. Smoke test (obrigatório antes de convidar coaches)

1. [ ] Registo coach novo → email de confirmação Auth chega
2. [ ] Checkout / pedido de plano → **Admin** vê o pedido
3. [ ] Email **admin** (novo payment request) chega
4. [ ] Admin **aprova** → coach recebe email com **IBAN/MB Way** reais
5. [ ] Admin **confirma pagamento / ativa** → coach recebe “conta ativa”
6. [ ] Coach entra, cria sessão, regista onda no telemóvel (ecrã estável, sem faixa “saving”)
7. [ ] Atleta: conta + código de pairing
8. [ ] (Opcional) curl manual das functions — ver secção abaixo

### Curl de teste

```bash
export PROJECT=YOUR_PROJECT_REF
export CRON_SECRET=your-long-random-secret

curl -sS -X POST "https://$PROJECT.supabase.co/functions/v1/admin-notify" \
  -H "Authorization: Bearer $CRON_SECRET"

curl -sS -X POST "https://$PROJECT.supabase.co/functions/v1/coach-notify" \
  -H "Authorization: Bearer $CRON_SECRET"

curl -sS -X POST "https://$PROJECT.supabase.co/functions/v1/subscription-renewal-cron" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Resposta esperada: JSON com `"ok": true` (e contagens de emails).

### Filas (se algo falhar)

```sql
select event_type, email_sent_at, email_error, created_at
from public.admin_notification_queue
order by created_at desc limit 10;

select event_type, coach_email, email_sent_at, email_error, created_at
from public.coach_notification_queue
order by created_at desc limit 10;
```

---

## G. Depois do soft launch (não bloqueia)

- Stripe Phase 2 — Payment Links + `stripe-webhook` ([`DEPLOY_WEB.md`](DEPLOY_WEB.md) Passo 1b)
- Sentry DSN em produção
- Faturas / recibos a partir dos dados de faturação
- Offline queue para psicologia / spots

---

## Ordem recomendada (1 tarde)

1. SQL 1–31 + `check-migrations.sql`
2. IBAN/MB Way
3. Auth URL + Confirm email + SMTP Auth
4. Secrets + deploy das 3 functions + webhooks + cron
5. Vercel env + redeploy
6. Smoke test A→Z
7. Só então convidar coaches reais
