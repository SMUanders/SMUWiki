// =============================================================
// SMU Wiki — Database typer
// Afspejler wiki_-tabellerne i det delte Supabase-projekt.
// =============================================================

// ─── Delt bruger/profil-model (genbrugt fra SMU OS' profiler-tabel) ───
// V1 skelner kun mellem admin og "almindelig medarbejder".
export type BrugerRolle =
  | 'admin'
  | 'daglig_leder'
  | 'tegnestue'
  | 'skærestue'
  | 'produktion'
  | 'montering'

export interface Profil {
  id: string
  fuldt_navn: string | null
  rolle: BrugerRolle
  aktiv: boolean
}

/** Admin er den eneste rolle med særrettigheder i Wiki V1. */
export function erAdmin(profil: Profil | null): boolean {
  return profil?.rolle === 'admin'
}

// ─── Kategorier ───
export interface WikiKategori {
  id: string
  slug: string
  navn: string
  beskrivelse: string | null
  sort_order: number
  created_at: string
}

// ─── Sider (kun publicerede) ───
export type SideStatus = 'publiceret' | 'arkiveret'

export const SIDE_STATUS_LABEL: Record<SideStatus, string> = {
  publiceret: 'Publiceret',
  arkiveret:  'Arkiveret',
}

export interface WikiSide {
  id: string
  slug: string
  titel: string
  beskrivelse: string | null
  indhold: string
  status: SideStatus
  current_version: number
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  // Navn på seneste redaktør — hentet via view/join, sat i frontend
  updated_by_navn?: string | null
}

export interface WikiSideMedKategorier extends WikiSide {
  kategorier: WikiKategori[]
}

// ─── Versionshistorik ───
export interface WikiSideVersion {
  id: string
  page_id: string
  version_nr: number
  titel: string
  beskrivelse: string | null
  indhold: string
  published_at: string
  published_by: string | null
  published_by_navn?: string | null
}

// ─── Ændringsforslag (nye sider + ændringer) ───
export type ForslagType = 'ny_side' | 'aendring'
export type ForslagStatus = 'afventer' | 'godkendt' | 'afvist'

export const FORSLAG_STATUS_LABEL: Record<ForslagStatus, string> = {
  afventer: 'Afventer',
  godkendt: 'Godkendt',
  afvist:   'Afvist',
}

export function forslagStatusBadge(s: ForslagStatus): string {
  switch (s) {
    case 'afventer': return 'smu-badge smu-badge-orange'
    case 'godkendt': return 'smu-badge smu-badge-green'
    case 'afvist':   return 'smu-badge smu-badge-red'
    default:         return 'smu-badge smu-badge-grey'
  }
}

export interface WikiForslag {
  id: string
  type: ForslagType
  page_id: string | null       // NULL = forslag til helt ny side
  titel: string
  beskrivelse: string | null
  indhold: string
  kategori_ids: string[]
  status: ForslagStatus
  begrundelse: string | null   // indsenderens note
  afvisning_note: string | null
  created_at: string
  created_by: string | null
  created_by_navn: string | null
  behandlet_at: string | null
  behandlet_by: string | null
}
