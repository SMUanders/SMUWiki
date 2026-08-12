import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { WikiKategori, WikiSide } from '../types/wiki'
import { relativTid } from '../lib/format'

export default function KategoriSide() {
  const { slug } = useParams<{ slug: string }>()
  const [kategori, setKategori] = useState<WikiKategori | null>(null)
  const [sider, setSider] = useState<WikiSide[]>([])
  const [loading, setLoading] = useState(true)
  const [findes, setFindes] = useState(true)

  useEffect(() => {
    async function hent() {
      setLoading(true)
      const { data: kat } = await supabase.from('wiki_categories').select('*').eq('slug', slug).maybeSingle()
      if (!kat) { setFindes(false); setLoading(false); return }
      setKategori(kat as WikiKategori)

      const { data: kobling } = await supabase
        .from('wiki_page_categories').select('page_id').eq('kategori_id', (kat as WikiKategori).id)
      const ids = (kobling ?? []).map(k => k.page_id)
      if (ids.length) {
        const { data: p } = await supabase
          .from('wiki_pages').select('*').in('id', ids).eq('status', 'publiceret')
          .order('titel', { ascending: true })
        setSider((p as WikiSide[]) ?? [])
      }
      setLoading(false)
    }
    hent()
  }, [slug])

  if (!findes) {
    return (
      <div className="smu-card p-6 text-center">
        <p className="font-bold text-navy">Kategorien findes ikke.</p>
        <Link to="/" className="smu-link inline-flex items-center gap-1 mt-3 text-[13px]">
          <ArrowLeft size={14} /> Til forsiden
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="smu-link inline-flex items-center gap-1.5 text-[13px]">
        <ArrowLeft size={15} /> Forside
      </Link>
      <div>
        <h1 className="smu-h1">{kategori?.navn}</h1>
        {kategori?.beskrivelse && <p className="smu-meta text-[14px] mt-0.5">{kategori.beskrivelse}</p>}
      </div>

      {loading ? (
        <p className="smu-meta text-sm">Indlæser…</p>
      ) : sider.length === 0 ? (
        <div className="smu-card p-6 text-center">
          <p className="smu-meta text-[13px]">Ingen sider i denne kategori endnu.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sider.map(s => (
            <li key={s.id}>
              <Link to={`/side/${s.slug}`}
                className="smu-card smu-list-card px-4 py-3 flex items-center gap-3 no-underline">
                <FileText size={16} className="text-text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold text-navy truncate">{s.titel}</p>
                  {s.beskrivelse && <p className="smu-meta text-[12.5px] truncate">{s.beskrivelse}</p>}
                </div>
                <span className="text-[12px] font-bold text-text-muted shrink-0 hidden sm:block">
                  {relativTid(s.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
