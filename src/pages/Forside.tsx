import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, FileText, FolderOpen, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { erAdmin } from '../types/wiki'
import { hentKategorier, hentPublicerede, hentSideKategoriKobling } from '../lib/wikiApi'
import type { WikiKategori, WikiSide } from '../types/wiki'
import { relativTid } from '../lib/format'

export default function Forside() {
  const { profil } = useAuth()
  const admin = erAdmin(profil)
  const [kategorier, setKategorier] = useState<WikiKategori[]>([])
  const [sider, setSider] = useState<WikiSide[]>([])
  const [kobling, setKobling] = useState<{ page_id: string; kategori_id: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [søgning, setSøgning] = useState('')

  useEffect(() => {
    Promise.all([hentKategorier(), hentPublicerede(), hentSideKategoriKobling()])
      .then(([k, s, kb]) => { setKategorier(k); setSider(s); setKobling(kb) })
      .finally(() => setLoading(false))
  }, [])

  const antalPrKategori = useMemo(() => {
    const m: Record<string, number> = {}
    for (const k of kobling) m[k.kategori_id] = (m[k.kategori_id] ?? 0) + 1
    return m
  }, [kobling])

  const resultater = useMemo(() => {
    const q = søgning.trim().toLowerCase()
    if (!q) return []
    return sider.filter(s =>
      s.titel.toLowerCase().includes(q) ||
      (s.beskrivelse ?? '').toLowerCase().includes(q) ||
      s.indhold.toLowerCase().includes(q),
    )
  }, [søgning, sider])

  const søger = søgning.trim().length > 0
  const senesteSider = sider.slice(0, 8)
  const heltTom = !loading && sider.length === 0 && kategorier.length === 0

  return (
    <div className="space-y-6">
      {/* Titel + CTA */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="smu-page-title">SMU Wiki</h1>
          <p className="smu-meta text-[14px] mt-0.5">Find procedurer, politikker og how-to guides.</p>
        </div>
        <Link to="/forslag/ny" className="smu-btn-primary inline-flex items-center gap-1.5">
          <Plus size={15} /> Opret forslag
        </Link>
      </div>

      {/* Stor søgning */}
      <div className="smu-card flex items-center gap-3 px-4 py-3.5">
        <Search size={20} className="text-text-muted shrink-0" />
        <input
          autoFocus
          className="flex-1 bg-transparent focus:outline-none text-[16px] font-semibold text-navy"
          placeholder="Søg i hele wikien…"
          value={søgning}
          onChange={e => setSøgning(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="smu-meta text-sm">Indlæser…</p>
      ) : søger ? (
        /* ─── Søgeresultater ─── */
        <div>
          <p className="text-[13px] font-bold text-text-muted mb-2.5">
            {resultater.length === 0 ? 'Ingen sider matcher søgningen.' : `${resultater.length} resultat${resultater.length === 1 ? '' : 'er'}`}
          </p>
          <ul className="space-y-2">
            {resultater.map(s => <SideLinje key={s.id} side={s} />)}
          </ul>
        </div>
      ) : heltTom ? (
        /* ─── Tom wiki: velkomst ─── */
        <div className="smu-card p-8 text-center">
          <BookOpen size={30} className="text-primary mx-auto mb-3" />
          <h2 className="text-[18px] font-extrabold text-navy mb-1.5">Wikien er ved at blive bygget op</h2>
          <p className="smu-meta text-[14px] max-w-md mx-auto mb-5">
            Der er endnu ingen sider. {admin
              ? 'Opret kategorier under Admin, og godkend de forslag der kommer ind — så vokser wikien.'
              : 'Foreslå den første side, så en admin kan godkende og publicere den.'}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Link to="/forslag/ny" className="smu-btn-primary inline-flex items-center gap-1.5">
              <Plus size={15} /> Opret forslag
            </Link>
            {admin && <Link to="/admin/kategorier" className="smu-btn-secondary">Opret kategorier</Link>}
          </div>
        </div>
      ) : (
        <>
          {/* ─── Kategorier ─── */}
          {kategorier.length > 0 && (
            <section>
              <H2>Kategorier</H2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {kategorier.map(k => (
                  <Link key={k.id} to={`/kategori/${k.slug}`}
                    className="smu-card p-4 no-underline transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen size={16} className="text-primary" />
                      <span className="text-[15px] font-extrabold text-navy">{k.navn}</span>
                    </div>
                    {k.beskrivelse && <p className="smu-meta text-[13px]">{k.beskrivelse}</p>}
                    <p className="text-[12px] font-bold text-text-muted mt-2">
                      {antalPrKategori[k.id] ?? 0} side{(antalPrKategori[k.id] ?? 0) === 1 ? '' : 'r'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ─── Senest opdaterede ─── */}
          <section>
            <H2>Senest opdateret</H2>
            {senesteSider.length === 0 ? (
              <div className="smu-card p-6 text-center">
                <p className="smu-meta text-[13px]">Ingen publicerede sider endnu.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {senesteSider.map(s => <SideLinje key={s.id} side={s} />)}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="smu-eyebrow mb-3">{children}</h2>
}

function SideLinje({ side }: { side: WikiSide }) {
  return (
    <li>
      <Link to={`/side/${side.slug}`}
        className="smu-card smu-list-card px-4 py-3 flex items-center gap-3 no-underline">
        <FileText size={16} className="text-text-muted shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-navy truncate">{side.titel}</p>
          {side.beskrivelse && <p className="smu-meta text-[12.5px] truncate">{side.beskrivelse}</p>}
        </div>
        <span className="text-[12px] font-bold text-text-muted shrink-0 hidden sm:block">
          {relativTid(side.updated_at)}
        </span>
      </Link>
    </li>
  )
}
