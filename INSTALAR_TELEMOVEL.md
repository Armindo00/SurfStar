# Testar SurfStar no telemóvel

## 1. Contas reais

1. No PC, abre a app (`npm run dev` ou o site publicado).
2. **Coach → Create account**: nome, email e palavra-passe (mínimo 8 caracteres).
3. No menu do treinador, **Add Athletes**: para cada atleta, nome + email + palavra-passe.
4. No telemóvel, separador **Athlete** → email e palavra-passe que o treinador definiu.

As palavras-passe ficam **hasheadas** no browser (localStorage). Não há servidor: os dados vivem **neste dispositivo/navegador**.

> Se ainda tinhas contas demo antigas no browser, podes continuar a entrar uma vez; a app atualiza a palavra-passe para formato seguro. Para começar do zero: limpa dados do site no browser (SurfStar / localhost).

---

## 2. Opção A — Mesma Wi‑Fi (rápido para testes)

No PC, na pasta do projeto:

```bash
npm run dev:phone
```

No terminal aparece algo como:

`Network: http://192.168.x.x:5173/`

No telemóvel (ligado à **mesma Wi‑Fi**):

1. Abre Chrome ou Safari.
2. Escreve esse endereço `http://192.168.x.x:5173`.
3. **Android (Chrome):** menu ⋮ → *Instalar app* ou *Adicionar ao ecrã inicial*.
4. **iPhone (Safari):** partilhar → *Adicionar ao Ecrã Inicial*.

No Windows, se não aparecer IP, permite a app na firewall quando o Windows perguntar.

---

## 3. Opção B — Build + preview na rede

```bash
npm run build
npm run preview:phone
```

Usa o URL `Network:` que aparecer (porta **4173**) no telemóvel, da mesma forma.

---

## 4. Opção C — Publicar na internet (HTTPS)

1. `npm run build` → pasta `dist/`.
2. Sobe para [Netlify](https://www.netlify.com/) ou [Vercel](https://vercel.com/) (arrastar `dist` ou ligar GitHub).
3. Abre o URL HTTPS no telemóvel e adiciona ao ecrã inicial.

HTTPS facilita “instalar” como app em muitos telemóveis.

---

## Dicas

- Usa sempre o **mesmo browser** no telemóvel para não “perder” sessões guardadas.
- Sessão de login dura até fechares o separador (sessionStorage); dados de treino ficam em localStorage.
- Para treinar offline depois de abrir a app uma vez na rede, um deploy estático (Opção B/C) costuma ser mais estável que `dev` em localhost.
