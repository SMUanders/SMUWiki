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

- **Alle migrationer ligger i den fælles hub og anvendes kun gennem gaten, altid DEV → LIVE: `node scripts/db-apply.mjs --env dev --yes` → verificér → rapport → STOP → efter GO `--env live --yes --bekraeft-live` (se `smu-os/docs/SUPABASE_MIGRATIONS.md`, TR-092).** Aldrig `supabase link`, aldrig rå `supabase db push`.
- **Versionsnumre skal være globalt unikke på tværs af ALLE repos** (én fælles ledger); gaten afviser remote-only og ændrede anvendte versioner.
- **Rækkefølge håndteres manuelt** — CLI'en garanterer ikke tværgående orden. Kør afhængige migrationer (fx delt `profiler`-hærdning) før app-migrationer.
- **SQL Editor er ikke normal/permanent migrationsvej**; en akut manuel ændring skal straks reconciles i hubben.
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

> **§11–15 er synkroniseret ordret fra den kanoniske `SMU_APP_STANDARD.md` i smu-os** (TR-096, TR-098).
> §-henvisninger i disse afsnit følger den kanoniske nummerering.

## 11. Platform-navigation og app-identitet

**Status: godkendt standard.** Canonical kilde er `smu-hub/src/platform-nav/` (Model D — filerne kopieres
uændret ind i hver app; se modulets egen `README.md`). Følgende er platformens vedtagne UX-model.

**Teknisk deployet er ikke det samme som frigivet til medarbejdere.** Det er den varige
discoverability-regel: Hub er et produktlandskab, ikke en liste over deployede repositories. En app kan være
live på en URL og alligevel stå som "På vej", indtil den er frigivet som almindeligt arbejdsværktøj — og Hub
må vise en kendt produktretning, før der overhovedet findes kode.

Kataloget har to uafhængige akser: **`status`** (`frigivet` | `paa_vej`) og **`synlighed`**
(`discoverable` | `privat`). **SMU Hub viser hele det synlige SMU-univers**, ikke kun brugerens egne apps:

| Tilstand | Betingelse | Kortets opførsel |
|---|---|---|
| Tilgængelig | frigivet **og** aktiv `app_adgang` | klikbart link |
| Ingen adgang | frigivet + discoverable, brugeren mangler adgang | synligt, ikke klikbart, rolig mærkat "Ingen adgang" |
| På vej | ikke frigivet endnu | dæmpet kort, mærkat "På vej", **aldrig klikbart**, **ingen opfundet URL** |
| *(skjult)* | `privat` app uden adgang | optræder slet ikke i brugerens Hub |

Synlighed vurderes før status, så en privat app aldrig kan lække gennem "På vej"- eller "Ingen adgang"-kortet.
En `paa_vej`-app kræver hverken app-key, roller eller adgange endnu; har den ingen officiel identitet, bruges
en neutral platform-placeholder, som **aldrig** må genbruges som appens fremtidige ikon.

At private apps skjules, er en UX-beslutning oven på RLS — ikke sikkerhedsmekanismen i sig selv.
"Ingen adgang" må ikke ligne en teknisk fejl: grå mærkat, aldrig rød, intet fejlikon. Hub forbliver en
launcher/platformoversigt — **ingen** dashboard-data, sager, tider, notifikationer eller cross-app domænedata.

**AppSwitcheren er daglig navigation**, ikke platformoversigt. Den viser Hub, den aktuelle app (markeret) og
brugerens øvrige **frigivne** apps med adgang. Apps uden adgang, apps "på vej" og private apps uden adgang
hører ikke til der.

**Multi-app arbejde:** navigation sker med almindelige links, så brugeren selv kan vælge ny fane. Tving ikke
al navigation ind i samme fane — en medarbejder skal kunne have OS, Tid og Color åbne samtidig.

**URL-disciplin:** app-kataloget skelner mellem `url` (verificeret live-adresse — det eneste der linkes til)
og `maalUrl` (godkendt målmodel `<app>.smu.signmeup.dk`). Skriv aldrig målmodellen som live-sandhed, og gæt
aldrig en app-key, URL, status eller et ikon.

**Cross-app handoff — godkendt princip, ikke bygget endnu.** En app må deep-linke til en anden app med
relevant kontekst, når modtagerappen ejer arbejdsopgaven (fx OS Sag → "Åbn i Color" / "Registrér tid"):
modtageren ejer opgaven og validerer selv; konteksten er en stabil reference (fx `sag_id`/SMU-nummer), aldrig
kopieret domænedata; adgang afgøres hos modtageren (et link er ikke en adgangstildeling); handoff må åbne i ny
fane; ingen skjult skrivning på tværs af domæner. Konkrete handoffs kræver produktbeslutning først.

**App-ikon og PWA — godkendt standard (TR-098).**
- **Ikonstil:** navy `#213746` bund + ét enkelt hvidt symbol for appen — hver app vælger et passende symbol,
  evt. med blå `#3f9ed3` accent. Ingen tilfældige farver. Gælder nye ikoner; eksisterende afvigere står i
  `NEXT_STEPS.md` → *Deferred housekeeping*, og et ikon ændres kun ved en eksplicit designbeslutning.
- **Samme ikon overalt:** favicon i fanen og app-ikon på mobil (hjemmeskærm) er det samme ikon. Det genereres
  fra appens `public/favicon.svg` — ingen ekstra runtime-dep. Filer og størrelser: §12.
- **PWA = kun ikon + standalone-åbning:** `manifest.webmanifest` med `display: standalone`, `theme_color`
  navy `#213746` og `background_color` beige `#f4f2ed`; `index.html` med `theme-color`,
  `apple-mobile-web-app-capable` + `-title`.
- **Ingen service worker og ingen offline-cache.** Apps kræver internet og login. Den fælles
  update-notifikation (§15) forudsætter, at ingen service worker cacher gamle filer.

## 12. Definition: platformklar app

En ny SMU-app er **platformklar** — altså klar til at komme i Hub og blive rullet ud til medarbejdere — først
når alle relevante punkter er på plads. Punkter der bevidst ikke gælder appen, dokumenteres i dens `CLAUDE.md`.

**Fundament**
1. fælles Supabase-projekt, identity og session (`platformAuthStorage()`);
2. app-key registreret i `app_roller` (og tabel-prefix valgt);
3. adgangsmodel via `app_adgange`/`app_roller` med dokumenterede roller;
4. backend/RLS håndhæver adgangen — frontend-tjek alene er ikke sikkerhed.

**Identitet og ikoner**
5. officielt app-ikon besluttet i platformens ikonstil (§11) — opfind ikke et permanent ikon for en app uden identitet;
6. browser-favicon (SVG + PNG-fallback);
7. iOS `apple-touch-icon` 180×180 som PNG — SVG virker ikke;
8. PWA 192×192 og 512×512 + `manifest.webmanifest` med `theme_color`/`background_color` — uden service worker (§11);
9. ægte maskable 512×512 med indholdet inden for 80 %-sikkerhedszonen (genbrug ikke `any`-filen);
10. samme ikon kopieret til Hubs `public/icons/apps/` — Hub viser appens **egen** identitet.

**Navigation**
11. Hub-metadata med verificeret `url`, korrekt `status` (frigivet/på vej) og `synlighed`
    (discoverable/privat) — en app optages først som *frigivet*, når den er besluttet frigivet til
    medarbejdere, ikke når den er deployet;
12. `<AppSwitcher>` placeret i appens topbar med egen `currentAppKey`;
13. synlig vej tilbage til Hub;
14. mobil/responsiv navigation.

**Drift**
15. korrekt subdomæne (`<app>.smu.signmeup.dk`) — indtil cutover står Netlify-adressen som `url`;
16. Git → Netlify continuous deploy (§9), Node 20 pinnet;
17. `npm run build` grøn (+ lint/tests hvor repoet har dem);
18. fælles update-notifikation (`platform-update`, §15) monteret;
19. live QA før bred rollout.

## 13. Checkliste — ny SMU-app

0. Sæt appens produktversion efter §14 (`package.json` → `"version"`, `src/lib/version.ts`, diskret label).
1. Vite + React 19 + TS (strict) projekt. Kopiér `src/index.css`-tokens fra `smu-os-v2`.
2. Kopiér denne `SMU_APP_STANDARD.md` og `docs/SMU_DESIGN_SYSTEM.md` ind.
3. Vælg et unikt tabel-prefix (`wiki_`, `tid_`, `apv_`, …).
4. `src/lib/supabase.ts` — delt singleton mod **samme** Supabase-projekt.
5. `AuthContext` + `Layout`-gate. Genbrug `profiler`/`auth.users` — opret dem ikke.
6. `netlify.toml` + `.env.example` + pin Node 20.
7. Første migration: tabeller med prefix, `slettet`-kolonne, audit-kolonner, RLS `to authenticated`.
8. Kopiér `platform-nav/` + app-ikoner ind, og indsæt `<AppSwitcher>` i topbaren (§11).
9. Kopiér `platform-update/` uændret ind fra `smu-hub` og montér den (§15).
10. Kør §12 igennem, før appen optages i Hub og rulles ud.
11. Skriv appens egen `CLAUDE.md` og dokumentér enhver afvigelse fra denne standard.

## 14. Produktversion

Hver app har **én** produktversion. Beslutning, regler og begrundelse: `PLANNING.md` TR-071. Aktuel
baseline pr. app: `PROJECT_OVERVIEW.md` → *Produktversionering*. Her står kun, hvordan den implementeres.

**Autoritativ kilde er `package.json` → `"version"`.** Ikke git-tags, ikke changelog, ikke database.

**Produktversion ≠ build-id.** Produktversionen er menneskelig og stabil (`v1.0`). Et build-id er et
bygnings-tidsstempel, der kun bruges til update-detektion og fejlsøgning. Build-id'et kommer fra det fælles
modul `platform-update` (§15) — ikke fra `version.ts` — og de to blandes aldrig sammen.

Fire trin, kopieret fra `smu-tid` (referenceimplementeringen):

1. **`package.json`** — sæt `"version"` til baseline, fx `1.0.0`.
2. **`vite.config.ts`** — læs versionen ved build og indlejr den:
   ```ts
   import { readFileSync } from 'node:fs'
   const PRODUCT_VERSION = JSON.parse(readFileSync('./package.json', 'utf-8')).version as string
   export default defineConfig({
     define: { __APP_PRODUCT_VERSION__: JSON.stringify(PRODUCT_VERSION) },
     // …
   })
   ```
   Kræver `@types/node` i `devDependencies` og `"types": ["node"]` i `tsconfig.node.json`.
3. **`src/lib/version.ts`** — kopiér filen fra en eksisterende app. Den deklarerer konstanten, har en
   `'dev'`-fallback til testmiljøer og eksponerer `appProductVersion()`. `formatProductVersion()` klipper
   patch væk, så labelen kun viser `major.minor`.
4. **UI** — én diskret label i topbaren ved siden af `<AppSwitcher>`:
   ```tsx
   <span className="hidden sm:inline text-[11px] font-semibold tabular-nums"
         style={{ color: 'rgba(255,255,255,0.45)' }}>
     {appProductVersion()}
   </span>
   ```
   Ingen fremhævelse, intet redesign. Har appen en testrunner, følger `src/lib/version.test.ts` med.

**Ingen konkurrerende versionsnumre i UI.** Funktionsnavne som "Udskriv ordre v1.4" må ikke vises ved
siden af produktversionen. Statustekster uden tal ("PROTOTYPE · ingen data gemmes") er i orden.

## 15. Update-notifikation (platform-update)

En åben SMU-app skal opdage, at en nyere frontend er deployet, uden at kassere brugerens arbejde. Beslutning:
`PLANNING.md` TR-096. Gælder alle LIVE-apps; bevidst udeladt: SMU Assist, SMU ESG og Projektboard.

**Kanonisk kilde:** `smu-hub/src/platform-update/` (med README). **Model D** som `platform-nav`: mappen
kopieres **uændret** ind i hver app (ingen npm-pakke, intet monorepo, ingen central tjeneste). Ret aldrig lokalt
i en app — ret canonical og kopiér igen til alle apps, så modulet forbliver bit-identisk.

**Produktversion vs. build-id:** produktversionen (§14) er til mennesker. Build-id'et er et tidsstempel pr.
produktionsbuild, som modulets Vite-plugin compiler ind som `__APP_VERSION__` og lægger som `version.json`
**direkte i `dist/`** — aldrig i `public/` og aldrig i repoet.

**UX:**
- **Ny version** → diskret, ikke-modalt banner nederst: "Ny version er klar" + [Opdater]. Tjekkes kun i
  produktion: ved start, ca. hvert 5. minut og når fanen/app-ikonet bliver synligt igen.
- **Lazy-/preload-fejl** (en gammel fane kan ikke hente en kodefil, der er væk efter et deploy) → KUN ét
  centralt recovery-kort med samme tekst og knap — aldrig samtidig med banneret. Hele appen erstattes, også
  header/navigation: én sikker recovery-skærm frem for navigation i en inkonsistent gammel bundle.
- **Ingen automatisk genindlæsning.** Siden genindlæses kun, når brugeren klikker "Opdater".
- `defer` på banneret bruges kun, hvor appen har en åbenlys kritisk redigering (i dag: SMU Tids LeaderDay).

**Implementering i en app:**
1. Kopiér `smu-hub/src/platform-update/` uændret til appens `src/platform-update/`.
2. `vite.config.ts`: `import { platformUpdate } from './src/platform-update/vitePlatformUpdate'` og
   `platformUpdate()` i `plugins`.
3. `main.tsx`: omslut hele appen med `<PlatformUpdateBoundary>` og montér `<UpdateBanner />` som søskende
   uden for den. (Apps med en særlig besked, fx SMU Ports flersprogede, kan bruge `useVersionCheck()` direkte.)
4. Har appen en CSP, skal `connect-src` indeholde `'self'` (fetch af `/version.json`).
5. Verificér efter deploy, at `/version.json` matcher build-id'et i den serverede bundle.
---

*Denne fil er en kopi. Den autoritative version vedligeholdes i `smu-os-v2` — hold dem i sync.*
