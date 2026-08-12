import { supabase } from './supabase'
import type {
  WikiKategori, WikiSide, WikiSideMedKategorier, WikiSideVersion, WikiForslag, ForslagType,
} from '../types/wiki'

// =============================================================
// Dataadgang for SMU Wiki. Alle kald går mod wiki_-tabellerne
// og er beskyttet af de stramme RLS-politikker.
// =============================================================

export async function hentKategorier(): Promise<WikiKategori[]> {
  const { data, error } = await supabase
    .from('wiki_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data as WikiKategori[]) ?? []
}

/** Alle publicerede sider (bruges til forside, søgning og kategori-visning). */
export async function hentPublicerede(): Promise<WikiSide[]> {
  const { data, error } = await supabase
    .from('wiki_pages')
    .select('*')
    .eq('status', 'publiceret')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as WikiSide[]) ?? []
}

/** Kategori-id'er pr. side (til at vise og filtrere kategorier i lister). */
export async function hentSideKategoriKobling(): Promise<{ page_id: string; kategori_id: string }[]> {
  const { data, error } = await supabase
    .from('wiki_page_categories')
    .select('page_id, kategori_id')
  if (error) throw error
  return data ?? []
}

export async function hentSideMedKategorier(slug: string): Promise<WikiSideMedKategorier | null> {
  const { data: side, error } = await supabase
    .from('wiki_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!side) return null

  const { data: koblinger } = await supabase
    .from('wiki_page_categories')
    .select('kategori_id')
    .eq('page_id', (side as WikiSide).id)

  const katIds = (koblinger ?? []).map(k => k.kategori_id)
  let kategorier: WikiKategori[] = []
  if (katIds.length) {
    const { data: kats } = await supabase
      .from('wiki_categories')
      .select('*')
      .in('id', katIds)
      .order('sort_order')
    kategorier = (kats as WikiKategori[]) ?? []
  }
  return { ...(side as WikiSide), kategorier }
}

/** Diskret banner-tjek: findes der et afventende forslag for siden? */
export async function harAfventendeForslag(pageId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('wiki_har_afventende_forslag', { p_page_id: pageId })
  if (error) throw error
  return Boolean(data)
}

export interface OpretForslagInput {
  type: ForslagType
  page_id: string | null
  titel: string
  beskrivelse: string | null
  indhold: string
  kategori_ids: string[]
  begrundelse: string | null
  created_by: string
}

export async function opretForslag(input: OpretForslagInput): Promise<void> {
  // created_by_navn sættes IKKE her — en DB-trigger udleder det server-side
  // fra profiler (#F), så visningsnavnet ikke kan spoofes af klienten.
  const { error } = await supabase.from('wiki_change_proposals').insert({
    type: input.type,
    page_id: input.page_id,
    titel: input.titel,
    beskrivelse: input.beskrivelse,
    indhold: input.indhold,
    kategori_ids: input.kategori_ids,
    begrundelse: input.begrundelse,
    status: 'afventer',
    created_by: input.created_by,
  })
  if (error) throw error
}

export async function hentMineForslag(userId: string): Promise<WikiForslag[]> {
  const { data, error } = await supabase
    .from('wiki_change_proposals')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as WikiForslag[]) ?? []
}

// ─── Admin ───

export async function hentAfventendeForslag(): Promise<WikiForslag[]> {
  const { data, error } = await supabase
    .from('wiki_change_proposals')
    .select('*')
    .eq('status', 'afventer')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as WikiForslag[]) ?? []
}

export async function godkendForslag(forslagId: string): Promise<void> {
  const { error } = await supabase.rpc('wiki_godkend_forslag', { p_forslag_id: forslagId })
  if (error) throw error
}

export async function afvisForslag(forslagId: string, note: string | null): Promise<void> {
  const { error } = await supabase.rpc('wiki_afvis_forslag', { p_forslag_id: forslagId, p_note: note })
  if (error) throw error
}

export async function hentVersioner(pageId: string): Promise<WikiSideVersion[]> {
  const { data, error } = await supabase
    .from('wiki_page_versions')
    .select('*')
    .eq('page_id', pageId)
    .order('version_nr', { ascending: false })
  if (error) throw error
  return (data as WikiSideVersion[]) ?? []
}

// ─── Admin: kategori-administration ───

export async function opretKategori(navn: string, slug: string, beskrivelse: string | null, sort_order: number): Promise<void> {
  const { error } = await supabase.from('wiki_categories').insert({ navn, slug, beskrivelse, sort_order })
  if (error) throw error
}

export async function opdaterKategori(id: string, felter: Partial<Pick<WikiKategori, 'navn' | 'slug' | 'beskrivelse' | 'sort_order'>>): Promise<void> {
  const { error } = await supabase.from('wiki_categories').update(felter).eq('id', id)
  if (error) throw error
}
