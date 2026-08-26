# Checklist de lansare — Recrutare Directă (SOFT CRUTING S.R.L.)

Ce mai rămâne de făcut ca să trecem de la prototip la site live. Ordonat pe priorități.

---

## 1. Datele firmei (după notar + ONRC) 🔴 blochează lansarea

Se completează **un singur loc**: `src/lib/legal.ts` → `LEGAL_CONFIG`. Se propagă automat în Termeni, Confidențialitate, contact și footer (RO + EN).

- [ ] `cui` — CUI-ul firmei
- [ ] `nrRegCom` — nr. de la Registrul Comerțului
- [ ] `sediu` — adresa sediului social
- [ ] `domeniu` — verifică `"reccrutare.ro"` (are doi „c") — e domeniul real?

Deja completate: denumire (`SOFT CRUTING`), formă juridică (`S.R.L.`), email contact/GDPR, procesator plăți (`Netopia`).

## 2. Plăți reale — Netopia 🔴 (aici vin banii din abonamente)

Necesită CUI-ul (deci după pasul 1).

- [ ] Deschide cont de comerciant Netopia (KYC) → obții `API_KEY` + `POS_SIGNATURE`
- [ ] Pune-le în `.env` (vezi `.env.example`, secțiunea Netopia)
- [ ] Completează cele 2 funcții TODO din `src/lib/netopia.ts` (inițiere plată + verificare confirmare) — folosind sandbox-ul lor
- [ ] Configurează la Netopia URL-ul de confirmare (IPN): `{APP_URL}/api/plata/netopia/confirmare`
- [ ] Testează pe **sandbox**, apoi treci `NETOPIA_SANDBOX="false"`

Structura e deja gata: checkout-ul demo și confirmarea reală folosesc același `activeazaAbonament` (`src/lib/abonamente.ts`). Cât timp `NETOPIA_API_KEY` e gol, rămâne pe demo.

## 3. Bază de date pentru producție 🟠 decizie tehnică

Acum: **SQLite** (fișier local `dev.db`) — perfect pt. dezvoltare, dar **nu persistă** pe hosting serverless (Vercel etc.).

- [ ] Alege: **VPS cu disc** (SQLite merge) SAU **PostgreSQL găzduit** (recomandat: Neon, Supabase, Railway)
- [ ] Dacă Postgres: schimb `provider` în `schema.prisma` + `DATABASE_URL` + migrare. **Pot face eu asta** când decizi.
- [ ] Fișierele încărcate (CV-uri, poze) sunt în folderul local `uploads/` — aceeași problemă pe serverless; pe VPS merge, altfel mutăm pe un storage (ex. S3/Cloudflare R2).

## 4. Domeniu + configurare 🟠

- [ ] Cumpără/confirmă domeniul (`reccrutare.ro`?)
- [ ] `APP_URL` = `https://domeniul-tau.ro` (folosit în emailuri, SEO, sitemap, Netopia)
- [ ] HTTPS (automat pe Vercel; pe VPS — certificat Let's Encrypt)

## 5. Secrete & securitate 🟠

- [ ] Generează un **`AUTH_SECRET` nou** pentru producție (`openssl rand -base64 32`) — nu-l refolosi pe cel de development
- [ ] Toate secretele se pun în panoul de env al hosting-ului, **nu** în cod
- [ ] Actualizează redirect URI-urile Google/Microsoft OAuth cu domeniul real
- [ ] Verifică emailul SMTP (Gmail App Password) — merge și de pe server

## 6. Deploy 🟢

- [ ] Alege hosting (Vercel = cel mai simplu pt. Next.js; sau VPS)
- [ ] Setează toate variabilele din `.env.example`
- [ ] `npm run build` fără erori
- [ ] Rulează migrarea bazei de date pe producție
- [ ] Deploy

## 7. După deploy (verificări) 🟢

- [ ] Înregistrare + verificare email funcționează
- [ ] Login Google/Microsoft
- [ ] Un candidat își face profil + încarcă CV
- [ ] Un angajator caută + trimite ofertă
- [ ] O plată de test reală (sumă mică) prin Netopia
- [ ] Paginile legale afișează datele corecte ale firmei

---

## Apoi: marketing 🚀
Site-ul e gata de creștere. SEO-ul e deja pus (Open Graph, sitemap, robots, meta). Următorii pași țin de promovare, nu de cod.
