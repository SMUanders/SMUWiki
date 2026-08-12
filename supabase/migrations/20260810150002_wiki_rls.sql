-- =============================================================
-- SMU Wiki — Fase 2: RLS (STRAM model — bevidst IKKE OS' permissive stil)
-- =============================================================
-- Princip:
--   * authenticated kan LÆSE publicerede sider + kategorier
--   * authenticated kan oprette EGNE forslag (og kun se egne)
--   * INGEN almindelig bruger kan ændre publicerede sider direkte
--   * admin (via wiki_er_admin()) administrerer alt + godkender/afviser
--
-- Godkendelse sker via SECURITY DEFINER-funktioner (migration 3), så
-- INSERT/UPDATE på wiki_pages kan holdes 100% admin-only her.
--
-- Denne migration er RE-RUNBAR: hver policy droppes med IF EXISTS før
-- den genoprettes, og GRANT/ALTER-udsagn er idempotente.
-- =============================================================


-- =============================================================
-- #A — Tabel-niveau grants til authenticated.
-- RLS er STADIG den egentlige adgangskontrol; disse grants giver blot
-- rollen ret til overhovedet at røre tabellerne. Least-privilege:
-- kun de operationer klienten reelt udfører direkte (skrivning til
-- wiki_pages / _versions / _page_categories sker via SECURITY DEFINER-
-- funktioner, som kører som ejer og derfor ikke kræver grants her).
-- =============================================================
GRANT SELECT                 ON wiki_pages            TO authenticated;
GRANT SELECT                 ON wiki_page_versions    TO authenticated;
GRANT SELECT                 ON wiki_page_categories  TO authenticated;
GRANT SELECT, INSERT         ON wiki_change_proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON wiki_categories       TO authenticated;


-- ─────────────────────────────────────────────
-- wiki_categories — læs alle; kun admin skriver
-- ─────────────────────────────────────────────
ALTER TABLE wiki_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wiki_kat_select_alle"   ON wiki_categories;
DROP POLICY IF EXISTS "wiki_kat_admin_insert"  ON wiki_categories;
DROP POLICY IF EXISTS "wiki_kat_admin_update"  ON wiki_categories;
DROP POLICY IF EXISTS "wiki_kat_admin_delete"  ON wiki_categories;

CREATE POLICY "wiki_kat_select_alle"
  ON wiki_categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "wiki_kat_admin_insert"
  ON wiki_categories FOR INSERT TO authenticated
  WITH CHECK (wiki_er_admin());

CREATE POLICY "wiki_kat_admin_update"
  ON wiki_categories FOR UPDATE TO authenticated
  USING (wiki_er_admin()) WITH CHECK (wiki_er_admin());

CREATE POLICY "wiki_kat_admin_delete"
  ON wiki_categories FOR DELETE TO authenticated
  USING (wiki_er_admin());


-- ─────────────────────────────────────────────
-- wiki_pages — læs publiceret; kun admin skriver
-- ─────────────────────────────────────────────
ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wiki_pages_select_publiceret" ON wiki_pages;
DROP POLICY IF EXISTS "wiki_pages_admin_insert"      ON wiki_pages;
DROP POLICY IF EXISTS "wiki_pages_admin_update"      ON wiki_pages;
DROP POLICY IF EXISTS "wiki_pages_admin_delete"      ON wiki_pages;

-- Alle authenticated kan læse publicerede sider. Arkiverede kun admin.
CREATE POLICY "wiki_pages_select_publiceret"
  ON wiki_pages FOR SELECT TO authenticated
  USING (status = 'publiceret' OR wiki_er_admin());

CREATE POLICY "wiki_pages_admin_insert"
  ON wiki_pages FOR INSERT TO authenticated
  WITH CHECK (wiki_er_admin());

CREATE POLICY "wiki_pages_admin_update"
  ON wiki_pages FOR UPDATE TO authenticated
  USING (wiki_er_admin()) WITH CHECK (wiki_er_admin());

CREATE POLICY "wiki_pages_admin_delete"
  ON wiki_pages FOR DELETE TO authenticated
  USING (wiki_er_admin());


-- ─────────────────────────────────────────────
-- wiki_page_versions — historik. Læsning kun admin.
-- ─────────────────────────────────────────────
ALTER TABLE wiki_page_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wiki_versions_admin_select" ON wiki_page_versions;
DROP POLICY IF EXISTS "wiki_versions_admin_insert" ON wiki_page_versions;

CREATE POLICY "wiki_versions_admin_select"
  ON wiki_page_versions FOR SELECT TO authenticated
  USING (wiki_er_admin());

CREATE POLICY "wiki_versions_admin_insert"
  ON wiki_page_versions FOR INSERT TO authenticated
  WITH CHECK (wiki_er_admin());

-- Ingen UPDATE/DELETE — historik er uforanderlig.


-- ─────────────────────────────────────────────
-- wiki_change_proposals — egne forslag; admin ser/behandler alt
-- ─────────────────────────────────────────────
ALTER TABLE wiki_change_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wiki_prop_select_egne_eller_admin" ON wiki_change_proposals;
DROP POLICY IF EXISTS "wiki_prop_insert_egne"             ON wiki_change_proposals;
DROP POLICY IF EXISTS "wiki_prop_admin_update"            ON wiki_change_proposals;

-- Se kun egne forslag (admin ser alle).
CREATE POLICY "wiki_prop_select_egne_eller_admin"
  ON wiki_change_proposals FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR wiki_er_admin());

-- Opret kun EGNE forslag, og kun som 'afventer' uden behandlingsfelter sat.
CREATE POLICY "wiki_prop_insert_egne"
  ON wiki_change_proposals FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'afventer'
    AND behandlet_at IS NULL
    AND behandlet_by IS NULL
  );

-- Kun admin kan behandle (godkende/afvise). Sker i praksis via RPC-funktion.
CREATE POLICY "wiki_prop_admin_update"
  ON wiki_change_proposals FOR UPDATE TO authenticated
  USING (wiki_er_admin()) WITH CHECK (wiki_er_admin());

-- Ingen DELETE-politik (forslag bevares som historik).


-- ─────────────────────────────────────────────
-- wiki_page_categories — læs alle; kun admin skriver
-- ─────────────────────────────────────────────
ALTER TABLE wiki_page_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wiki_pagekat_select_alle"  ON wiki_page_categories;
DROP POLICY IF EXISTS "wiki_pagekat_admin_insert" ON wiki_page_categories;
DROP POLICY IF EXISTS "wiki_pagekat_admin_delete" ON wiki_page_categories;

CREATE POLICY "wiki_pagekat_select_alle"
  ON wiki_page_categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "wiki_pagekat_admin_insert"
  ON wiki_page_categories FOR INSERT TO authenticated
  WITH CHECK (wiki_er_admin());

CREATE POLICY "wiki_pagekat_admin_delete"
  ON wiki_page_categories FOR DELETE TO authenticated
  USING (wiki_er_admin());
