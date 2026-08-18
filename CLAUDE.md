# SMU Wiki — satellit-app i SMU/Signmeup-universet

> **SMU Platform.** Dette repo er en del af SMU Platform. Fælles platform-sandhed og sandhedshierarki ligger i
> `smu-os-v2`'s Truth Reset-dokumenter (`PROJECT_OVERVIEW`/`DOMAIN_MODEL`/`DESIGNKATALOG`/`ROADMAP`/`NEXT_STEPS`/`PLANNING`),
> `SMU_APP_STANDARD.md` og det globale Claude Code-lag. Ved konflikt vinder platformens sandhedshierarki.
> Denne fil beskriver kun app-specifikke forhold.

**SMU Wiki** er en lille, fokuseret vidensbase i SMU-familien. Den **deler Supabase-projekt, auth og
designunivers** med resten. Følg `SMU_APP_STANDARD.md` + `docs/SMU_DESIGN_SYSTEM.md` — læs dem først.

## App-specifikke forhold
- **Tabel-prefix:** `wiki_`. `profiler` + `auth.users` deles på tværs af apps — læs dem, opret dem ikke igen.
- **Roller (bevist behov):** medarbejder/admin med **forslag → admin-godkendelse**-flow. Håndhæves via den
  fælles adgangsmodel (`har_app_adgang('wiki')` / `har_app_rolle('wiki', …)`) i RLS **og** i frontend.
  Godkend/afvis sker via SECURITY DEFINER-RPC'er med fast `search_path` og intern authz.
- **Migrationer:** i den fælles hub `smu-os-v2/supabase/migrations/` (Wiki ejer sine `wiki_`-migrations logisk,
  men de køres fra hubben via `supabase db push` — ikke en parallel historik, ikke SQL Editor som normal vej).
- Alt på dansk. Kør `tsc`/build/lint efter ændringer; skriv hvad der er ændret + hvad der skal testes manuelt.
