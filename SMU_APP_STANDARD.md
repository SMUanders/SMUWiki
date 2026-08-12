# SMU_APP_STANDARD.md — fælles standard for alle SMU/Signmeup-apps

**Kanonisk kilde: `smu-os-v2`.** Dette er en kopi, der skal holdes i sync med navet. Ved tvivl vinder `smu-os-v2`.
Gælder alle satellit-apps i SMU-universet (Wiki, Tid, APV, …). Dette repo er **SMU Wiki**, tabel-prefix **`wiki_`**.

Design (farver, typografi, hjælpeklasser, "aldrig bryd"-regler) er beskrevet separat i [`docs/SMU_DESIGN_SYSTEM.md`](docs/SMU_DESIGN_SYSTEM.md) — læs den før alt styling-arbejde.

---

## 1. Portefølje & vision

Vi bygger **flere små, selvstændige SMU-apps**, der på sigt kombineres til ét samlet system, **SMU OS**. Hver app = eget repo + egen Netlify, men de **deler** Supabase-projekt, brugere/auth og designunivers.

- **SMU OS (`smu-os-v2`)** = navet/kanonisk kilde (kalkulation + design-system + standard).
- Mål: en app skal senere kunne løftes ind i SMU OS uden omskrivning — derfor delt backend, ren domænelogik, storage bag interface, delt auth/klient.

---

## 2. Grundprincip

- Ejet kode i SMU-universet, bygget så den kan integreres i SMU OS. Ikke en løs prototype.
- Små, fokuserede apps. **Ingen** ERP/dashboard/ekstra moduler før behovet er bevist. **Ingen iframe.**
- Byg kun det, der er bevist behov for. Udskyd resten.

---

## 3. Stack

- **React + Vite + TypeScript (strict).** SMU OS og Wiki kører React 19, Vite, Tailwind v4, `react-router-dom` v7, `@supabase/supabase-js`, `lucide-react` (ikoner).
- Minimale dependencies. Tilføj kun et bibliotek, når behovet er reelt.
- **Node 20** til builds. Vitest til test.
- Tailwind v4 konfigureres i CSS via `@theme` i `src/index.css` — ingen `tailwind.config.js`. `@theme`-blokken holdes **identisk** med `smu-os-v2`.

---

## 4. Backend — DELT Supabase-projekt

- **Samme Supabase-projekt** som SMU OS/Wiki (ref `ggnnfzhhqhwmugubfxuj`).
- Frontend bruger **kun** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon key er offentlig, beskyttet af RLS).
- **`service_role`-nøglen må ALDRIG i frontend** — kun i serverless (Netlify Functions), hvis nødvendigt.
- **App-prefix på ALLE tabeller** (fx `wiki_`, `tid_`, `apv_`) for at undgå kollision i det delte projekt.
- **`profiler` + `auth.users` deles på tværs af apps — læs dem, opret dem ikke igen.** En app må referere `profiler`/`auth.users` (fx til admin-tjek og `created_by`), men ejer dem ikke.
- Én delt Supabase-klient pr. app (`src/lib/supabase.ts`). Storage bag et interface, hvor det giver mening.
- **localStorage kun som dev-fallback** — aldrig den endelige dataløsning.

---

## 5. Auth

- Supabase Auth **email/password**. Login-gate når Supabase er konfigureret; lokal dev uden keys må være åben.
- Genbrug eksisterende brugere (`fornavn@signmeup.dk`). **Ingen signup i appen.** Public signup slået fra.
- Profil hentes fra den delte `profiler`-tabel (`id, fuldt_navn, rolle, aktiv`). Auth-state via en `AuthContext` + `useAuth()`.

---

## 6. Roller & sikkerhed

- **Ingen roller som udgangspunkt** — men et **bevist behov** kan begrunde stram rolle/RLS-adskillelse. **Dokumentér afvigelsen.**
  - *Eksempel (bevist afvigelse):* SMU Wiki har medarbejder/admin + godkendelsesflow, med stram RLS pr. `wiki_`-tabel. Admin = `profiler.rolle = 'admin'`.
- **Nummererede migrations.** Én ændring pr. fil, beskrivende navn.
- **RLS kun `to authenticated`** — aldrig åben `using(true)` i prod. Stram videre (ejer/rolle) når behovet er bevist. `anon` får ingen adgang.
- Admin-tjek via en `SECURITY DEFINER`-funktion med **fast `search_path`** (undgår RLS-rekursion og search_path-angreb). App-lokale helpers (fx `wiki_er_admin()`) frem for at koble sig på OS-interne funktioner.
- Rettighedsfølsomme skrivninger (publicering, godkendelse) sker atomisk via `SECURITY DEFINER`-funktioner, så basistabeller kan holdes admin-only i RLS.
- Beskyt privilegie-relevante kolonner (fx `profiler.rolle`/`aktiv`) mod selv-eskalering (trigger, der kun tillader admin at ændre dem).
- Audit: `created_by` / `updated_by` = `auth.uid()`. Autoritative visningsnavne udledes server-side, ikke fra klienten.
- Soft delete (`slettet boolean`) frem for hard delete i normal drift.

### 6.1 Migrations på tværs af repos (delt database)

Supabase sporer migrationer i **én delt tabel** (`supabase_migrations.schema_migrations`) nøglet på versions-præfikset. Da flere apps deler databasen:

- **Versionsnumre skal være globalt unikke på tværs af ALLE repos.** Ellers springer `supabase db push` en migration over (samme version findes allerede i ledgeren). Reservér gerne intervaller pr. app.
- **Rækkefølge håndteres manuelt** — CLI'en garanterer ikke tværgående orden. Kør afhængige migrationer (fx delt `profiler`-hærdning) før app-migrationer.
- **Vælg én kanal pr. projekt:** enten alt via SQL Editor (versionsnumre = dokumentation) eller alt via `supabase db push` (versionsnumre skal være entydige). Bland ikke.
- Gør migrationer **re-runbare**: `CREATE OR REPLACE FUNCTION/TRIGGER`, `DROP POLICY IF EXISTS` før `CREATE POLICY`, `IF NOT EXISTS` på tabeller/indexes.
- Ny app rører aldrig en anden apps tabeller, policies, funktioner eller triggers.

---

## 7. Design

- **Kilde til sandhed: [`docs/SMU_DESIGN_SYSTEM.md`](docs/SMU_DESIGN_SYSTEM.md)** (kopi af `smu-os-v2`'s designsystem).
- Brug CSS-variabler + hjælpeklasser (`.smu-card`, `.smu-badge*`, `.smu-btn-*`, `.smu-input`, m.fl.) — **aldrig rå hex i komponenter.**
- Overhold "aldrig bryd"-reglerne: ingen gradients, ingen emojis (brug Lucide-ikoner), rød kun til fejl, font-weight aldrig under 600 på synligt, border-radius aldrig under 8px på kort.
- Login, tomme states og fejlskærme skal føles som SMU — ikke default-browser-look.
- Dansk UI.

---

## 8. Deploy

- **Git → Netlify continuous deploy. ALDRIG drag-drop.**
- `netlify.toml` + `public/_redirects` (SPA-fallback til `/index.html`) + **Node 20**.
- `.env.local` gitignored; `.env.example` uden nøgler; rigtige nøgler sættes i Netlify UI (scope: Builds).

---

## 9. Arbejdsmåde

- Byg i **små trin**. **Plan → godkendelse** før større kodeændringer.
- Kør **tsc + tests + build** efter ændringer. Skriv **hvad der er ændret** + **hvad der skal testes manuelt**.
- **Stop og spørg** ved uklarheder.
- Rør ikke den delte produktionsdatabase uden eksplicit godkendelse; skriv migrationer, men kør dem ikke selv, medmindre du bliver bedt om det.

---

*Denne fil er en kopi. Den autoritative version vedligeholdes i `smu-os-v2` — hold dem i sync.*
