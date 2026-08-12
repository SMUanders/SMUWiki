# SMU Wiki — sikkerhedsstatus

*Status efter review + afgrænsede rettelser. Ingen migrationer er kørt. Ingen produktionsdatabase er ændret.*

Se det fulde review i samtalen; dette dokument er den handlingsrettede opsummering før migration.

---

## 1. Hvad er rettet (implementeret i kode, ikke kørt)

| # | Emne | Rettelse | Fil |
|---|---|---|---|
| **#A** | Manglende tabel-grants | Eksplicitte least-privilege `GRANT … TO authenticated` på wiki-tabellerne. RLS er stadig den egentlige adgangskontrol. | `wiki_rls.sql` |
| **#B** | Ikke re-runbare migrationer | `CREATE OR REPLACE TRIGGER` på `wiki_pages`; `DROP POLICY IF EXISTS` før hver `CREATE POLICY`; tabeller/indexes/funktioner bruger idempotente mønstre. | `wiki_schema.sql`, `wiki_rls.sql` |
| **#D** | Deaktiveret admin havde adgang | `wiki_er_admin()` kræver nu `rolle='admin'` **og** `aktiv=true`. | `wiki_schema.sql` |
| **#E** | `search_path` på `wiki_slugify` | Sat eksplicit `SET search_path = ''` (funktionen rører ingen tabeller). | `wiki_funktioner.sql` |
| **#F** | Klient kunne spoofe visningsnavn | `created_by_navn` sættes nu server-side af en `BEFORE INSERT`-trigger (`wiki_set_forslag_navn`) ud fra `profiler`. Klienten sender det ikke længere. | `wiki_schema.sql` + `src/lib/wikiApi.ts`, `src/components/ForslagForm.tsx` |
| **#1** | Privilege-escalation via `profiler` | Separat **SMU OS-ejet** migration: `BEFORE UPDATE`-trigger blokerer at ikke-admins ændrer `rolle`/`aktiv`. RLS på profiler er uændret. | `smu-os-v2/…/20260810000001_profiler_rolle_beskyttelse.sql` |

Frontend-ændringer er holdt til det nødvendige for #F (fjernet `created_by_navn` fra forslags-insert). Build + lint er grønne.

---

## 2. Hvad afventer stadig (bevidst ikke gjort nu)

| # | Emne | Status | Anbefaling |
|---|---|---|---|
| **#C** | FK'er til `auth.users` uden `ON DELETE` | Åben | Kan vente. Overvej `ON DELETE SET NULL` på `wiki_pages.created_by/updated_by` og at gøre `wiki_change_proposals.created_by` nullable + `SET NULL`, så hard-sletning af en bruger i delt auth ikke blokeres. Lav sandsynlighed (OS bruger `aktiv`, ikke sletning). |
| **#G** | Intet teardown/rollback-script | Åben | Kan vente. Trivielt at levere pga. `wiki_`-præfiks. Bed om det, hvis I vil kunne rulle rent tilbage. |
| **#H** | Modelforenklinger (`kategori_ids uuid[]`, ét afventende forslag pr. side, denormaliserede navne) | Bevidst V1 | Kan vente. Nemme at løsne senere; påvirker ikke sikkerheden. |
| **profiler.aktiv i OS generelt** | Deaktiverede brugere kan stadig logge ind i auth | Uden for Wiki-scope | OS-beslutning: skal deaktivering også spærre login? Wiki respekterer nu `aktiv` for admin-tjek (#D). |

---

## 3. Migrationsfiler der skal køres (senere, efter din godkendelse)

**SMU OS-projektet (delt database).** Kør intet endnu.

### A. SMU OS-ejet sikkerhedsrettelse (bør køres FØRST)
```
smu-os-v2/supabase/migrations/20260810000001_profiler_rolle_beskyttelse.sql
```
Lukker privilege-escalation i `profiler`. Uden denne er Wikis (og OS') admin-adskillelse ikke reelt håndhævet.

### B. SMU Wiki-migrationer (i rækkefølge)
```
SMU Wiki/supabase/migrations/20260810150001_wiki_schema.sql
SMU Wiki/supabase/migrations/20260810150002_wiki_rls.sql
SMU Wiki/supabase/migrations/20260810150003_wiki_funktioner.sql
```

### C. Startindhold (valgfrit, demo)
```
SMU Wiki/supabase/seed/wiki_seed.sql
```
Demo-teksterne skal erstattes med Signmeups godkendte personalehåndbog-indhold.

### Anbefalet rækkefølge
1. **A** — profiler-beskyttelse (OS).
2. **B1 → B2 → B3** — wiki schema, RLS, funktioner.
3. **C** — seed (valgfrit).
4. Kør verifikationstestene i afsnit 4.

> Alle filer er re-runbare, så en afbrudt kørsel kan gentages uden at efterlade en halv tilstand.

---

## 4. Test efter migration (manuelt)

Opret mindst to testbrugere i `profiler`: én **almindelig medarbejder** og én **admin** (`rolle='admin', aktiv=true`).

### Som SMU OS-sikkerhed (profiler) — kør som ALMINDELIG bruger
- [ ] `update profiler set rolle='admin' where id = auth.uid();` → **skal fejle** (`insufficient_privilege`).
- [ ] `update profiler set aktiv=false where id = auth.uid();` → **skal fejle**.
- [ ] `update profiler set fuldt_navn='Test' where id = auth.uid();` → **skal lykkes**.
- [ ] Som **admin**: ændr en anden brugers `rolle`/`aktiv` → **skal lykkes**.

### Som ALMINDELIG medarbejder i Wiki
- [ ] Kan logge ind og se forsiden med publicerede sider (bekræfter at #A-grants virker — ellers "permission denied for table wiki_pages").
- [ ] Kan søge og åbne sider; kan browse kategorier.
- [ ] Kan oprette forslag (ny side + ændring); ser dem under "Mine forslag" som `afventer`.
- [ ] Ser **ikke** andres forslag. Prøv direkte: `select * from wiki_change_proposals;` → kun egne rækker.
- [ ] Kan **ikke** ændre en publiceret side direkte: `update wiki_pages set indhold='hack' where …;` → 0 rækker / afvist.
- [ ] Kan **ikke** godkende: `select wiki_godkend_forslag('<id>');` → fejl "Kun admin…".
- [ ] Kan **ikke** sætte status ved oprettelse: insert med `status='godkendt'` → afvist af WITH CHECK.
- [ ] Forslagets `created_by_navn` matcher brugerens `profiler.fuldt_navn`, uanset hvad klienten måtte sende (#F).
- [ ] Kan **ikke** oprette/redigere kategorier.

### Som ADMIN i Wiki
- [ ] Ser "Admin"-punktet og godkendelseskøen med afventende forslag.
- [ ] Kan sammenligne nuværende vs. foreslået, **godkende** (→ side publiceres, version +1, snapshot i historik) og **afvise** (med note; publiceret side uændret).
- [ ] Efter godkendelse af ny side: siden er synlig for alle; efter godkendelse af ændring: banneret "afventer godkendelse" forsvinder.
- [ ] Kan oprette/redigere kategorier; ser versionshistorik på en side.
- [ ] Efter at admin sættes `aktiv=false`: mister admin-rettigheder i Wiki (#D) — godkendelse fejler.

### Isolation mod SMU OS
- [ ] SMU OS fungerer uændret (spot-check: sager, kunder, brugeradministration).
- [ ] Rolleændring i OS' brugeradministration virker stadig (admin-vejen gennem den nye trigger).

---

## 5. Konklusion

Efter A + B er Wikis adgangsmodel håndhævet i databasen (ikke kun i UI): medarbejdere kan læse publiceret indhold og indsende egne forslag; kun aktive admins kan publicere. **Kør ikke migrationerne, før A (profiler-beskyttelse) er accepteret af OS-siden** — den er forudsætningen for, at admin-rollen overhovedet er troværdig.
