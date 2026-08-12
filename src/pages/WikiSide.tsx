import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { erAdmin } from '../types/wiki'
import type { WikiSideMedKategorier, WikiSideVersion } from '../types/wiki'
import { hentSideMedKategorier, harAfventendeForslag, hentVersioner } from '../lib/wikiApi'
import { relativTid } from '../lib/format'
import MarkdownIndhold from '../components/MarkdownIndhold'
import ForslagBanner from '../components/ForslagBanner'
import VersionHistorik from '../components/VersionHistorik'

export default function WikiSide() {
  const { slug } = useParams<{ slug: string }>()
  const { profil } = useAuth()
  const admin = erAdmin(profil)

  const [side, setSide] = useState<WikiSideMedKategorier | null>(null)
  const [afventer, setAfventer] = useState(false)
  const [versioner, setVersioner] = useState<WikiSideVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [findes, setFindes] = useState(true)

  useEffect(() => {
    async function hent() {
      setLoading(true)
      const s = await hentSideMedKategorier(slug!)
      if (!s) { setFindes(false); setLoading(false); return }
      setSide(s)
      setLoading(false)
      harAfventendeForslag(s.id).then(setAfventer).catch(() => {})
      if (erAdmin(profil)) hentVersioner(s.id).then(setVersioner).catch(() => {})
    }
    hent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (loading) return <p className="smu-meta text-sm">Indlæser…</p>

  if (!findes || !side) {
    return (
      <div className="smu-card p-6 text-center">
        <p className="font-bold text-navy">Siden findes ikke.</p>
        <Link to="/" className="smu-link inline-flex items-center gap-1 mt-3 text-[13px]">
          <ArrowLeft size={14} /> Til forsiden
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/" className="smu-link inline-flex items-center gap-1.5 text-[13px]">
        <ArrowLeft size={15} /> Forside
      </Link>

      {/* Titel + handling */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="smu-page-title">{side.titel}</h1>
          {side.beskrivelse && <p className="smu-meta text-[15px] mt-1">{side.beskrivelse}</p>}
        </div>
        <Link to={`/side/${side.slug}/foreslag-aendring`} className="smu-btn-secondary inline-flex items-center gap-1.5 shrink-0">
          <Pencil size={14} /> Foreslå ændring
        </Link>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 flex-wrap">
        {side.kategorier.map(k => (
          <Link key={k.id} to={`/kategori/${k.slug}`} className="smu-badge smu-badge-violet no-underline">
            {k.navn}
          </Link>
        ))}
        <span className="inline-flex items-center gap-1 smu-meta">
          <Clock size={13} />
          Opdateret {relativTid(side.updated_at)}
          {side.updated_by_navn ? ` af ${side.updated_by_navn}` : ''}
          {' · '}v{side.current_version}
        </span>
      </div>

      {afventer && <ForslagBanner />}

      {/* Indhold */}
      <div className="smu-card p-5 sm:p-7">
        <MarkdownIndhold indhold={side.indhold} />
      </div>

      {/* Versionshistorik — kun admin */}
      {admin && (
        <div className="pt-2">
          <VersionHistorik versioner={versioner} />
        </div>
      )}
    </div>
  )
}
