# SMU Wiki

Signmeups interne opslagsværk — procedurer, politikker, arbejdsinstruktioner, maskiner, sikkerhed og how-to guides. Bygget som en selvstændig app i samme visuelle og tekniske familie som **SMU OS**.

Se [docs/SMU_DESIGN_SYSTEM.md](docs/SMU_DESIGN_SYSTEM.md) for design- og platformreferencen.

## Stak

Vite 8 · React 19 · TypeScript (strict) · Tailwind v4 · react-router-dom v7 · Supabase · react-markdown · lucide-react.

## Kom i gang (lokalt)

1. **Installer afhængigheder**
   ```bash
   npm install
   ```

2. **Miljøvariabler** — kopier `.env.example` til `.env.local` og udfyld med **samme Supabase-projekt som SMU OS**:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
   Kun anon key. Service_role key må aldrig i frontend.

3. **Kør databasemigrationer** i Supabase SQL Editor (i rækkefølge). De opretter kun `wiki_`-tabeller og rører **ingen** eksisterende OS-tabeller:
   1. `supabase/migrations/20260810150001_wiki_schema.sql`
   2. `supabase/migrations/20260810150002_wiki_rls.sql`
   3. `supabase/migrations/20260810150003_wiki_funktioner.sql`

4. **Indlæs startindhold** (valgfrit, men anbefalet til demo):
   - `supabase/seed/wiki_seed.sql`
   - ⚠️ Alle seed-tekster er **midlertidige demo-tekster** og skal erstattes med Signmeups godkendte personalehåndbog-indhold. Hver seed-side har en tydelig "Demo-indhold"-boks.

5. **Start dev-server**
   ```bash
   npm run dev
   ```

## Roller & admin

- Wiki genbruger SMU OS' `profiler`-tabel. Admin = `profiler.rolle = 'admin'`.
- En bruger bliver admin ved at sætte `rolle='admin'` i `profiler` (fx via SMU OS' brugeradministration eller Supabase).
- Alle andre roller behandles som "almindelig medarbejder".

## Sådan virker godkendelsesflowet

1. En medarbejder opretter et **forslag** (ny side eller ændring) → gemmes som `afventer`. Den publicerede side ændres ikke.
2. Siden viser en diskret besked, når der ligger et afventende forslag.
3. En **admin** gennemgår forslaget under **Admin → Godkendelser**, sammenligner nuværende vs. foreslået, og **godkender** eller **afviser**.
4. Ved godkendelse publiceres forslaget som ny version, og et snapshot gemmes i historikken.

## Sikkerhed

Stramme, wiki-specifikke RLS-politikker (ikke OS' permissive model):
- Alle authenticated kan **læse** publicerede sider + kategorier.
- Alle kan oprette og se **egne** forslag.
- Ingen almindelig bruger kan ændre publicerede sider direkte.
- Kun **admin** (via `wiki_er_admin()`) administrerer og godkender. Publicering sker atomisk gennem `SECURITY DEFINER`-funktioner.

## Scripts

| Kommando | Formål |
|---|---|
| `npm run dev` | Udviklingsserver |
| `npm run build` | Typecheck + produktionsbuild |
| `npm run lint` | ESLint |
| `npm run preview` | Vis produktionsbuild lokalt |

## Ikke med i V1 (bevidst)

Kommentarer, likes, chat, AI/embeddings, avanceret editor, statistik, medarbejderprofiler, notifikationer, PDF, QR, integration til SMU OS-sager, avanceret audit-log. Kan komme senere.
