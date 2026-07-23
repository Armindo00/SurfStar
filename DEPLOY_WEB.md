# Publicar SurfStar na web (Supabase + Vercel)

Sim — **já faz sentido**. Assim abres no telemóvel com um link `https://...`, sem Wi‑Fi nem firewall, e os dados ficam na nuvem.

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
   - Desliga **Confirm email** (para entrar logo após registo, ideal para testes).
5. **SQL Editor → New query** → cola todo o ficheiro `supabase/schema.sql` → **Run**.

---

## Passo 2 — Configurar o projeto no PC

Na pasta do projeto, cria um ficheiro `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

Testa localmente:

```bash
npm run dev
```

No login deve aparecer **Online · cloud version**. Cria conta de treinador em **Create account**.

---

## Passo 3 — Publicar na Vercel (grátis)

1. Cria conta em [https://vercel.com](https://vercel.com).
2. **Add New → Project** → importa esta pasta (GitHub ou upload).
3. Em **Environment Variables**, adiciona:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**.

Recebes um URL tipo `https://surfstar-xxx.vercel.app` — abre no telemóvel e **Adicionar ao ecrã inicial**.

---

## Passo 4 — Usar no telemóvel

1. Abre o link HTTPS no Chrome/Safari.
2. **Coach → Create account** (ou Sign in).
3. **Athletes & logins** → adiciona atletas com email/palavra-passe.
4. Atletas entram no separador **Athlete** com essas credenciais.

Os mesmos logins funcionam no PC e no telemóvel.

---

## Alternativas à Vercel

- **Netlify**: build `npm run build`, publish folder `dist`, mesmas variáveis `VITE_*`.
- **Cloudflare Pages**: idem.

O ficheiro `vercel.json` já trata das rotas da SPA.

---

## Ainda queres testar só na rede local?

Continua a funcionar `npm run dev:phone`, mas na prática a web + Supabase resolve o problema do “não é possível aceder”.

Guia Wi‑Fi local: `INSTALAR_TELEMOVEL.md`.

---

## Notas de segurança

- A chave **anon** pode ir no frontend; as regras **RLS** no Supabase protegem os dados.
- Nunca coloques a **service_role** key no código da app.
- Para produção séria, ativa confirmação de email e passwords mais fortes.
