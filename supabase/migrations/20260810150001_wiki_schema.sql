-- =============================================================
-- SMU Wiki — Fase 1: Skema
-- Kør i Supabase SQL Editor (samme projekt som SMU OS).
-- Alle tabeller har wiki_-prefix og er helt adskilt fra OS-tabellerne.
-- Ingen eksisterende OS-tabeller eller -funktioner ændres.
-- =============================================================

-- ─── Hjælpere (wiki-lokale, så Wiki ikke kobler sig på OS-interne funktioner) ───

-- Touch updated_at ved ændring.
CREATE OR REPLACE FUNCTION wiki_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Er den aktuelle bruger admin? Læser den DELTE profiler-tabel.
-- SECURITY DEFINER + fast search_path → ingen RLS-rekursion, ingen search_path-angreb.
-- #D: kræver BÅDE rolle='admin' OG aktiv=true — en deaktiveret admin har ikke adgang.
CREATE OR REPLACE FUNCTION wiki_er_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiler
    WHERE id = auth.uid() AND rolle = 'admin' AND aktiv = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- =============================================================
-- wiki_categories — kategorier (admin-styret, ikke hardcodet)
-- =============================================================
CREATE TABLE IF NOT EXISTS wiki_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  navn        text NOT NULL UNIQUE,
  beskrivelse text,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid DEFAULT auth.uid() REFERENCES auth.users(id)
);


-- =============================================================
-- wiki_pages — KUN publicerede sider (den gældende version)
-- Nye/ikke-godkendte sider lever i wiki_change_proposals indtil godkendelse.
-- =============================================================
CREATE TABLE IF NOT EXISTS wiki_pages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  titel           text NOT NULL,
  beskrivelse     text,
  indhold         text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'publiceret'
                    CONSTRAINT wiki_pages_status_check CHECK (status IN ('publiceret', 'arkiveret')),
  current_version int  NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  created_by_navn text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid REFERENCES auth.users(id),
  updated_by_navn text
);

CREATE INDEX IF NOT EXISTS wiki_pages_status_idx ON wiki_pages (status);

CREATE OR REPLACE TRIGGER wiki_pages_updated_at
  BEFORE UPDATE ON wiki_pages
  FOR EACH ROW EXECUTE FUNCTION wiki_touch_updated_at();


-- =============================================================
-- wiki_page_versions — historik: ét snapshot pr. publicering
-- =============================================================
CREATE TABLE IF NOT EXISTS wiki_page_versions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id           uuid NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  version_nr        int  NOT NULL,
  titel             text NOT NULL,
  beskrivelse       text,
  indhold           text NOT NULL,
  published_at      timestamptz NOT NULL DEFAULT now(),
  published_by      uuid REFERENCES auth.users(id),
  published_by_navn text,
  UNIQUE (page_id, version_nr)
);

CREATE INDEX IF NOT EXISTS wiki_page_versions_page_idx
  ON wiki_page_versions (page_id, version_nr DESC);


-- =============================================================
-- wiki_change_proposals — afventende NYE sider + ÆNDRINGSFORSLAG
-- page_id NULL  = forslag til ny side
-- page_id sat   = ændringsforslag til eksisterende side
-- =============================================================
CREATE TABLE IF NOT EXISTS wiki_change_proposals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text NOT NULL
                    CONSTRAINT wiki_proposals_type_check CHECK (type IN ('ny_side', 'aendring')),
  page_id         uuid REFERENCES wiki_pages(id) ON DELETE CASCADE,
  titel           text NOT NULL,
  beskrivelse     text,
  indhold         text NOT NULL DEFAULT '',
  kategori_ids    uuid[] NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'afventer'
                    CONSTRAINT wiki_proposals_status_check CHECK (status IN ('afventer', 'godkendt', 'afvist')),
  begrundelse     text,
  afvisning_note  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_by_navn text,
  behandlet_at    timestamptz,
  behandlet_by    uuid REFERENCES auth.users(id),
  -- ny_side må ikke pege på en side; aendring SKAL pege på en side
  CONSTRAINT wiki_proposals_page_ref_check CHECK (
    (type = 'ny_side'  AND page_id IS NULL) OR
    (type = 'aendring' AND page_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS wiki_proposals_status_idx  ON wiki_change_proposals (status);
CREATE INDEX IF NOT EXISTS wiki_proposals_creator_idx ON wiki_change_proposals (created_by);
CREATE INDEX IF NOT EXISTS wiki_proposals_page_idx    ON wiki_change_proposals (page_id);

-- Højst ét AFVENTENDE ændringsforslag pr. side (undgår modstridende forslag i kø).
CREATE UNIQUE INDEX IF NOT EXISTS wiki_proposals_en_afventende_pr_side
  ON wiki_change_proposals (page_id)
  WHERE status = 'afventer' AND page_id IS NOT NULL;

-- #F: visningsnavn på forslag udledes SERVER-SIDE fra profiler.
-- Klientens evt. medsendte created_by_navn overskrives, så den ikke kan spoofes.
-- created_by håndhæves = auth.uid() af RLS (WITH CHECK) — vi slår navnet op derfra.
CREATE OR REPLACE FUNCTION wiki_set_forslag_navn()
RETURNS TRIGGER AS $$
BEGIN
  SELECT fuldt_navn INTO NEW.created_by_navn
  FROM public.profiler
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER wiki_proposals_set_navn
  BEFORE INSERT ON wiki_change_proposals
  FOR EACH ROW EXECUTE FUNCTION wiki_set_forslag_navn();


-- =============================================================
-- wiki_page_categories — kobling side ↔ kategori (mange-til-mange)
-- Gælder kun PUBLICEREDE sider. Forslag bruger kategori_ids[].
-- =============================================================
CREATE TABLE IF NOT EXISTS wiki_page_categories (
  page_id     uuid NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  kategori_id uuid NOT NULL REFERENCES wiki_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, kategori_id)
);

CREATE INDEX IF NOT EXISTS wiki_page_categories_kat_idx
  ON wiki_page_categories (kategori_id);
