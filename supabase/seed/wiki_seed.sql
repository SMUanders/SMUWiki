-- =============================================================
-- SMU Wiki — Startindhold (seed)
-- Kør EFTER de tre wiki-migrations, i Supabase SQL Editor.
-- =============================================================
-- VIGTIGT: Alle sidetekster herunder er KORTE NEUTRALE DEMO-TEKSTER.
-- Den originale personalehåndbog fandtes ikke i projektet, så indholdet
-- SKAL erstattes med Signmeups godkendte tekst. Hver side har derfor en
-- tydelig "Demo-indhold"-boks øverst.
--
-- Seed'et er idempotent på slug (ON CONFLICT DO NOTHING) — kan køres igen.
-- =============================================================

BEGIN;

-- ─── Kategorier ───
INSERT INTO wiki_categories (slug, navn, beskrivelse, sort_order) VALUES
  ('personale-hverdag',     'Personale & hverdag',       'Onboarding, fravær, ferie og hverdagens praktik.', 1),
  ('arbejdsgange',          'Arbejdsgange',              'Sådan gør vi — processer og overleveringer.',      2),
  ('produktion',            'Produktion',                'Produktion, klargøring og oprydning.',             3),
  ('maskiner-udstyr',       'Maskiner & udstyr',         'Maskiner, værktøj og udstyr.',                     4),
  ('sikkerhed-arbejdsmiljo','Sikkerhed & arbejdsmiljø',  'Sikkerhed, værnemidler og farlige stoffer.',       5),
  ('politikker',            'Politikker',                'Regler, retningslinjer og politikker.',            6)
ON CONFLICT (slug) DO NOTHING;


-- ─── Sider ───
-- Fælles demo-boks der indledes øverst i hver side.
-- (skrevet direkte ind i indhold pr. side nedenfor)

INSERT INTO wiki_pages (slug, titel, beskrivelse, indhold, status, current_version, created_by_navn, updated_by_navn) VALUES

('velkommen-til-signmeup', 'Velkommen til Signmeup',
 'Kort introduktion til nye medarbejdere.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nVelkommen til Signmeup. Her finder du praktisk information om hverdagen hos os.\n\n## Kom godt i gang\n\n- Find rundt på arbejdspladsen og hils på kollegerne.\n- Spørg din nærmeste leder, hvis noget er uklart.\n- Brug denne wiki som opslagsværk, når du er i tvivl.',
 'publiceret', 1, 'Seed', 'Seed'),

('sygemelding', 'Sygemelding',
 'Sådan melder du dig syg.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nGiv besked hurtigst muligt, hvis du bliver syg.\n\n## Sådan gør du\n\n- Kontakt din nærmeste leder så tidligt som muligt.\n- Oplys, hvis du forventer længere fravær.\n- Registrér fraværet efter gældende retningslinjer.',
 'publiceret', 1, 'Seed', 'Seed'),

('raskmelding', 'Raskmelding',
 'Når du er klar til at komme tilbage.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nMeld dig rask, når du er klar til at møde på arbejde igen.\n\n## Sådan gør du\n\n- Giv din leder besked, gerne dagen før.\n- Aftal eventuelle hensyn ved tilbagevenden.',
 'publiceret', 1, 'Seed', 'Seed'),

('ferie-og-frihed', 'Ferie og frihed',
 'Ferie, afspadsering og fridage.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nPlanlæg ferie og fridage i god tid.\n\n## Sådan gør du\n\n- Aftal ferie med din leder inden du booker noget.\n- Tag hensyn til travle perioder i produktionen.',
 'publiceret', 1, 'Seed', 'Seed'),

('ordresedler-og-overlevering', 'Ordresedler og overlevering',
 'God overlevering mellem funktioner.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nEn god overlevering sikrer, at intet tabes mellem led.\n\n## Huskeliste\n\n- Udfyld ordresedlen komplet.\n- Marker tydeligt, hvad der mangler.\n- Overlever mundtligt ved tvivl.',
 'publiceret', 1, 'Seed', 'Seed'),

('sig-til-med-det-samme', 'Sig til med det samme',
 'Sig til tidligt, hvis noget driller.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nDet er altid bedre at sige til tidligt end for sent.\n\n> [!info] Hvorfor\n> Små problemer bliver hurtigt store, hvis de ikke fanges i tide. Sig til, så vi kan hjælpe.',
 'publiceret', 1, 'Seed', 'Seed'),

('brug-af-it-udstyr', 'Brug af IT-udstyr',
 'Retningslinjer for computere og udstyr.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nIT-udstyr bruges primært til arbejdsrelaterede opgaver.\n\n## Retningslinjer\n\n- Pas godt på udstyret.\n- Lås din skærm, når du forlader pladsen.\n- Meld fejl til den ansvarlige.',
 'publiceret', 1, 'Seed', 'Seed'),

('maskiner-og-vaerktoej', 'Maskiner og værktøj',
 'Sikker og korrekt brug af maskiner.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nBrug kun maskiner og værktøj, du er oplært i.\n\n> [!advarsel] Sikkerhed\n> Betjen aldrig en maskine, du ikke er instrueret i. Spørg altid, hvis du er i tvivl.\n\n## God praksis\n\n- Tjek udstyret før brug.\n- Ryd op og læg værktøj på plads.',
 'publiceret', 1, 'Seed', 'Seed'),

('oprydning', 'Oprydning',
 'Vi holder orden på arbejdspladsen.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nEn ryddelig arbejdsplads er en sikker arbejdsplads.\n\n## Huskeliste\n\n- Ryd op efter dig selv.\n- Læg værktøj tilbage på fast plads.\n- Sortér affald korrekt.',
 'publiceret', 1, 'Seed', 'Seed'),

('koersel-i-firmabiler', 'Kørsel i firmabiler',
 'Regler for brug af firmabiler.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nFirmabiler bruges ansvarligt og efter gældende regler.\n\n## Retningslinjer\n\n- Kør efter færdselsloven.\n- Aflever bilen ryddelig og tanket efter aftale.\n- Meld skader med det samme.',
 'publiceret', 1, 'Seed', 'Seed'),

('kemikalier-og-farlige-stoffer', 'Kemikalier og farlige stoffer',
 'Sikker håndtering af kemikalier.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nKemikalier skal håndteres og opbevares forsvarligt.\n\n> [!advarsel] Vigtigt\n> Læg altid låg på, opbevar korrekt, og brug de anviste værnemidler. Kend produktets sikkerhedsdatablad.',
 'publiceret', 1, 'Seed', 'Seed'),

('noegler-og-adgang', 'Nøgler og adgang',
 'Ansvar for nøgler og adgangskort.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nNøgler og adgangskort er personlige og skal passes på.\n\n## Retningslinjer\n\n- Lån ikke din adgang ud.\n- Meld tab af nøgle eller kort med det samme.\n- Lås af, når du er sidst ud.',
 'publiceret', 1, 'Seed', 'Seed'),

('vaernemidler-og-sikkerhed', 'Værnemidler og sikkerhed',
 'Brug af personlige værnemidler.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nBrug de rette værnemidler til opgaven.\n\n> [!info] Personlige værnemidler\n> Handsker, briller, høreværn og lignende bruges, hvor det er påkrævet. Spørg, hvis du er i tvivl om, hvad opgaven kræver.',
 'publiceret', 1, 'Seed', 'Seed'),

('alkohol-rusmidler-og-medicin', 'Alkohol, rusmidler og medicin',
 'Politik for alkohol, rusmidler og medicin.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nSikkerhed på arbejdet forudsætter, at man er klar og upåvirket.\n\n> [!advarsel] Sikkerhed først\n> Påvirkning må aldrig gå ud over sikkerheden. Kontakt din leder, hvis medicin kan påvirke dit arbejde.',
 'publiceret', 1, 'Seed', 'Seed'),

('adfaerd-og-omgangstone', 'Adfærd og omgangstone',
 'Sådan taler vi til hinanden.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nVi behandler hinanden med respekt.\n\n## Grundprincipper\n\n- Tal ordentligt til og om hinanden.\n- Giv plads og lyt.\n- Løs uenigheder i en god tone.',
 'publiceret', 1, 'Seed', 'Seed'),

('tavshedspligt', 'Tavshedspligt',
 'Fortrolighed om virksomhed og kunder.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nOplysninger om virksomhed og kunder er fortrolige.\n\n> [!info] Fortrolighed\n> Del ikke interne eller kundefortrolige oplysninger udenfor virksomheden.',
 'publiceret', 1, 'Seed', 'Seed'),

('sociale-medier', 'Sociale medier',
 'Retningslinjer for sociale medier.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nTænk dig om, når du omtaler arbejdet på sociale medier.\n\n## Retningslinjer\n\n- Del ikke fortrolige oplysninger.\n- Respektér kunder og kolleger.',
 'publiceret', 1, 'Seed', 'Seed'),

('disciplinaere-regler', 'Disciplinære regler',
 'Konsekvenser ved brud på reglerne.',
 E'> [!vigtigt] Demo-indhold\n> Denne tekst er en midlertidig demo og skal erstattes med det godkendte indhold fra Signmeups personalehåndbog.\n\nBrud på regler og aftaler kan få konsekvenser.\n\n> [!note] Bemærk\n> De konkrete regler og sanktioner beskrives i den godkendte personalehåndbog.',
 'publiceret', 1, 'Seed', 'Seed')

ON CONFLICT (slug) DO NOTHING;


-- ─── Kobling side ↔ kategori ───
INSERT INTO wiki_page_categories (page_id, kategori_id)
SELECT p.id, c.id
FROM (VALUES
  ('velkommen-til-signmeup',          'personale-hverdag'),
  ('sygemelding',                     'personale-hverdag'),
  ('raskmelding',                     'personale-hverdag'),
  ('ferie-og-frihed',                 'personale-hverdag'),
  ('ferie-og-frihed',                 'politikker'),
  ('ordresedler-og-overlevering',     'arbejdsgange'),
  ('ordresedler-og-overlevering',     'produktion'),
  ('sig-til-med-det-samme',           'arbejdsgange'),
  ('brug-af-it-udstyr',               'politikker'),
  ('maskiner-og-vaerktoej',           'maskiner-udstyr'),
  ('maskiner-og-vaerktoej',           'produktion'),
  ('oprydning',                       'produktion'),
  ('oprydning',                       'arbejdsgange'),
  ('koersel-i-firmabiler',            'politikker'),
  ('koersel-i-firmabiler',            'sikkerhed-arbejdsmiljo'),
  ('kemikalier-og-farlige-stoffer',   'sikkerhed-arbejdsmiljo'),
  ('noegler-og-adgang',               'sikkerhed-arbejdsmiljo'),
  ('noegler-og-adgang',               'politikker'),
  ('vaernemidler-og-sikkerhed',       'sikkerhed-arbejdsmiljo'),
  ('alkohol-rusmidler-og-medicin',    'politikker'),
  ('alkohol-rusmidler-og-medicin',    'sikkerhed-arbejdsmiljo'),
  ('adfaerd-og-omgangstone',          'personale-hverdag'),
  ('adfaerd-og-omgangstone',          'politikker'),
  ('tavshedspligt',                   'politikker'),
  ('sociale-medier',                  'politikker'),
  ('disciplinaere-regler',            'politikker')
) AS m(side_slug, kat_slug)
JOIN wiki_pages p       ON p.slug = m.side_slug
JOIN wiki_categories c  ON c.slug = m.kat_slug
ON CONFLICT DO NOTHING;


-- ─── Version 1-snapshot for hver seed-side ───
INSERT INTO wiki_page_versions (page_id, version_nr, titel, beskrivelse, indhold, published_by_navn)
SELECT p.id, 1, p.titel, p.beskrivelse, p.indhold, 'Seed'
FROM wiki_pages p
WHERE NOT EXISTS (
  SELECT 1 FROM wiki_page_versions v WHERE v.page_id = p.id AND v.version_nr = 1
);

COMMIT;
