import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { hentSideMedKategorier } from '../lib/wikiApi'
import type { WikiSideMedKategorier } from '../types/wiki'
import ForslagForm from '../components/ForslagForm'

export default function AendringsForslag() {
  const { slug } = useParams<{ slug: string }>()
  const [side, setSide] = useState<WikiSideMedKategorier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hentSideMedKategorier(slug!).then(setSide).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <p className="smu-meta text-sm">Indlæser…</p>

  if (!side) {
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
    <ForslagForm
      type="aendring"
      pageId={side.id}
      overskrift={`Foreslå ændring: ${side.titel}`}
      initial={{
        titel: side.titel,
        beskrivelse: side.beskrivelse ?? '',
        indhold: side.indhold,
        kategori_ids: side.kategorier.map(k => k.id),
      }}
    />
  )
}
