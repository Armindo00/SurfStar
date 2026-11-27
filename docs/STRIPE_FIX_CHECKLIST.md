# Stripe — activação + redirect + EUR

Checklist para o fluxo self-serve ficar completo após o pagamento de teste.

## 1. Moeda EUR

No Stripe Dashboard (modo **Test** e depois **Live**):

- Products → cada Price deve ser **EUR**
- Coach: €49 / mês, €490 / ano
- Coach Premium: €89 / mês, €890 / ano

Se aparecer US$ no checkout, o Price está em USD — cria Prices novos em EUR e actualiza os secrets.

## 2. Secrets Supabase (obrigatório para Checkout Session + redirect)

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  APP_URL=https://www.surfstar.app \
  STRIPE_PRICE_TEAM=price_... \
  STRIPE_PRICE_CLUB=price_... \
  STRIPE_PRICE_TEAM_ANNUAL=price_... \
  STRIPE_PRICE_CLUB_ANNUAL=price_...
```

Opcional (fallback Payment Links — usa IDs `plink_...`, não o slug `buy.stripe.com`):

```bash
supabase secrets set \
  STRIPE_PAYMENT_LINK_ID_TEAM=plink_... \
  STRIPE_PAYMENT_LINK_ID_CLUB=plink_... \
  STRIPE_PAYMENT_LINK_ID_TEAM_ANNUAL=plink_... \
  STRIPE_PAYMENT_LINK_ID_CLUB_ANNUAL=plink_...
```

## 3. Redeploy functions

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy subscription-manage
```

## 4. Webhook

Endpoint: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

Events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 5. Vercel

- `VITE_MANUAL_PAYMENTS=false`
- `VITE_STRIPE_LINK_*` (fallback)
- Redeploy

## 6. Smoke test

1. Criar conta treinador nova
2. Pagar com `4242 4242 4242 4242`
3. Deve voltar a `/checkout?success=1`
4. Em poucos segundos a app deve abrir (subscrição `active`)

## O que o código passa a fazer

- Webhook resolve `plan_id` a partir da row **pending** se metadata/payment link falharem
- `subscription-manage` action `create_checkout` cria Session com `success_url` / metadata
- Checkout faz poll após `?success=1`
