-- =============================================================
-- SMU Wiki — Fase 3: Godkendelses-funktioner
-- =============================================================
-- Godkendelse/afvisning sker via SECURITY DEFINER-funktioner, så
-- wiki_pages/wiki_page_versions kan holdes admin-only i RLS, mens
-- selve publiceringen sker atomisk (snapshot + opdatering i én transaktion).
-- Alle funktioner tjekker selv wiki_er_admin() indeni.
-- =============================================================


-- Dansk-venlig slug-generator (æøå → ae/oe/aa).
-- #E: eksplicit tom search_path — funktionen rører ingen tabeller og bruger
-- kun pg_catalog-indbyggede funktioner (altid implicit tilgængelige).
CREATE OR REPLACE FUNCTION wiki_slugify(p text)
RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT left(
    trim(both '-' from
      regexp_replace(
        replace(replace(replace(replace(replace(replace(lower(coalesce(p, '')),
          'æ','ae'),'ø','oe'),'å','aa'),'ä','ae'),'ö','oe'),'ü','ue'),
        '[^a-z0-9]+', '-', 'g')),
    80);
$$;


-- Godkend et forslag → bliver den nye publicerede version.
-- Returnerer id på den berørte side.
CREATE OR REPLACE FUNCTION wiki_godkend_forslag(p_forslag_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  f            wiki_change_proposals%ROWTYPE;
  v_admin      uuid := auth.uid();
  v_admin_navn text;
  v_page_id    uuid;
  v_base       text;
  v_slug       text;
  v_n          int := 2;
  v_version    int;
  k            uuid;
BEGIN
  IF NOT wiki_er_admin() THEN
    RAISE EXCEPTION 'Kun admin kan godkende forslag';
  END IF;

  SELECT * INTO f FROM wiki_change_proposals WHERE id = p_forslag_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Forslag findes ikke';
  END IF;
  IF f.status <> 'afventer' THEN
    RAISE EXCEPTION 'Forslag er allerede behandlet';
  END IF;

  SELECT fuldt_navn INTO v_admin_navn FROM profiler WHERE id = v_admin;

  IF f.type = 'ny_side' THEN
    v_base := wiki_slugify(f.titel);
    IF v_base = '' THEN v_base := 'side'; END IF;
    v_slug := v_base;
    WHILE EXISTS (SELECT 1 FROM wiki_pages WHERE slug = v_slug) LOOP
      v_slug := v_base || '-' || v_n;
      v_n := v_n + 1;
    END LOOP;

    INSERT INTO wiki_pages (slug, titel, beskrivelse, indhold, status, current_version,
                            created_by, created_by_navn, updated_by, updated_by_navn)
    VALUES (v_slug, f.titel, f.beskrivelse, f.indhold, 'publiceret', 1,
            f.created_by, f.created_by_navn, v_admin, v_admin_navn)
    RETURNING id INTO v_page_id;

    v_version := 1;
  ELSE
    v_page_id := f.page_id;
    UPDATE wiki_pages
       SET titel = f.titel,
           beskrivelse = f.beskrivelse,
           indhold = f.indhold,
           current_version = current_version + 1,
           updated_by = v_admin,
           updated_by_navn = v_admin_navn
     WHERE id = v_page_id
     RETURNING current_version INTO v_version;
    IF v_version IS NULL THEN
      RAISE EXCEPTION 'Siden findes ikke længere';
    END IF;

    DELETE FROM wiki_page_categories WHERE page_id = v_page_id;
  END IF;

  -- Sæt kategorier fra forslaget (ignorér slettede kategori-id'er).
  FOREACH k IN ARRAY f.kategori_ids LOOP
    IF EXISTS (SELECT 1 FROM wiki_categories WHERE id = k) THEN
      INSERT INTO wiki_page_categories (page_id, kategori_id)
      VALUES (v_page_id, k) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Snapshot til historikken.
  INSERT INTO wiki_page_versions (page_id, version_nr, titel, beskrivelse, indhold,
                                  published_by, published_by_navn)
  VALUES (v_page_id, v_version, f.titel, f.beskrivelse, f.indhold, v_admin, v_admin_navn);

  UPDATE wiki_change_proposals
     SET status = 'godkendt', behandlet_at = now(), behandlet_by = v_admin
   WHERE id = p_forslag_id;

  RETURN v_page_id;
END;
$$;


-- Afvis et forslag (den publicerede side er uændret).
CREATE OR REPLACE FUNCTION wiki_afvis_forslag(p_forslag_id uuid, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT wiki_er_admin() THEN
    RAISE EXCEPTION 'Kun admin kan afvise forslag';
  END IF;

  SELECT status INTO v_status FROM wiki_change_proposals WHERE id = p_forslag_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Forslag findes ikke';
  END IF;
  IF v_status <> 'afventer' THEN
    RAISE EXCEPTION 'Forslag er allerede behandlet';
  END IF;

  UPDATE wiki_change_proposals
     SET status = 'afvist', afvisning_note = p_note,
         behandlet_at = now(), behandlet_by = auth.uid()
   WHERE id = p_forslag_id;
END;
$$;


-- Findes der et afventende forslag for en given side?
-- Returnerer KUN en boolean (ingen forslagsindhold), så banneret
-- "afventer godkendelse" kan vises til alle uden at bryde forslags-privatliv.
CREATE OR REPLACE FUNCTION wiki_har_afventende_forslag(p_page_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM wiki_change_proposals
    WHERE page_id = p_page_id AND status = 'afventer'
  );
$$;


-- Rettigheder: authenticated må kalde funktionerne (intern admin-tjek gater dem).
GRANT EXECUTE ON FUNCTION wiki_er_admin()                      TO authenticated;
GRANT EXECUTE ON FUNCTION wiki_slugify(text)                   TO authenticated;
GRANT EXECUTE ON FUNCTION wiki_godkend_forslag(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION wiki_afvis_forslag(uuid, text)       TO authenticated;
GRANT EXECUTE ON FUNCTION wiki_har_afventende_forslag(uuid)    TO authenticated;
