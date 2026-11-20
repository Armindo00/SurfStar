# Testar SurfStar no telemóvel

Para **produção** (dados na nuvem, login real): usa `https://www.surfstar.app` e o checklist [`LAUNCH_OPS.md`](LAUNCH_OPS.md).  
Este guia é só para **dev local** (mesma Wi‑Fi) ou modo **localStorage** sem Supabase.

---

## 1. Modo local (sem `.env` / sem cloud)

1. No PC: `npm run dev`.
2. **Coach → Create account**: nome, email e palavra-passe (mínimo 8 caracteres).
3. No menu do treinador, **Add Athletes**: para cada atleta, nome + email + palavra-passe.
4. No telemóvel (mesma rede — secção 2), separador **Athlete** → email e palavra-passe definidos.

As palavras-passe ficam **hasheadas** no browser (localStorage). **Não há servidor:** os dados vivem **neste dispositivo/navegador**.

> Contas demo antigas: limpa dados do site no browser se quiseres começar do zero.

---

## 2. Opção A — Mesma Wi‑Fi (rápido para testes)

```bash
npm run dev:phone
```

No terminal aparece algo como `Network: http://192.168.x.x:5173/`.

No telemóvel (mesma Wi‑Fi):

1. Abre Chrome ou Safari com esse IP.
2. **Android:** menu ⋮ → *Instalar app* / *Adicionar ao ecrã inicial*.
3. **iPhone (Safari):** partilhar → *Adicionar ao Ecrã Inicial*.

No Windows, permite a app na firewall se o sistema perguntar.

---

## 3. Opção B — Build + preview na rede

```bash
npm run build
npm run preview:phone
```

Usa o URL `Network:` (porta **4173**) no telemóvel.

---

## 4. Opção C — Produção (HTTPS + Supabase)

1. Segue [`DEPLOY_WEB.md`](DEPLOY_WEB.md) e [`LAUNCH_OPS.md`](LAUNCH_OPS.md).
2. Abre `https://www.surfstar.app` (ou o preview Vercel).
3. Adiciona ao ecrã inicial (PWA).

Neste modo os dados estão na **nuvem** — o mesmo login funciona no PC e no telemóvel.  
Pagamento de coaches no lançamento: **manual** (Admin aprova + IBAN), não Stripe.

---

## Dicas

- Em **modo local**, usa sempre o **mesmo browser** no telemóvel para não “perder” sessões.
- Em **cloud**, a sessão e os treinos sincronizam entre dispositivos (com rede).
- Offline total na praia ainda é limitado — ver riscos em `LAUNCH_OPS.md` secção G.
