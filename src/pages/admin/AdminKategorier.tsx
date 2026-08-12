import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { hentKategorier, opretKategori, opdaterKategori } from '../../lib/wikiApi'
import type { WikiKategori } from '../../types/wiki'
import { lavSlug } from '../../lib/format'

type Redigering = { id: string | null; navn: string; slug: string; beskrivelse: string; sort_order: number }

const TOM: Redigering = { id: null, navn: '', slug: '', beskrivelse: '', sort_order: 0 }

export default function AdminKategorier() {
  const [kategorier, setKategorier] = useState<WikiKategori[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Redigering | null>(null)
  const [gemmer, setGemmer] = useState(false)
  const [fejl, setFejl] = useState('')

  async function genindlaes() {
    setKategorier(await hentKategorier())
    setLoading(false)
  }
  useEffect(() => {
    hentKategorier().then(setKategorier).finally(() => setLoading(false))
  }, [])

  function nyKategori() {
    setFejl('')
    setForm({ ...TOM, sort_order: (kategorier.at(-1)?.sort_order ?? 0) + 1 })
  }
  function redigerKategori(k: WikiKategori) {
    setFejl('')
    setForm({ id: k.id, navn: k.navn, slug: k.slug, beskrivelse: k.beskrivelse ?? '', sort_order: k.sort_order })
  }

  async function gem() {
    if (!form) return
    setFejl('')
    if (!form.navn.trim()) { setFejl('Navn er påkrævet.'); return }
    const slug = (form.slug.trim() || lavSlug(form.navn))
    setGemmer(true)
    try {
      if (form.id) {
        await opdaterKategori(form.id, { navn: form.navn.trim(), slug, beskrivelse: form.beskrivelse.trim() || null, sort_order: form.sort_order })
      } else {
        await opretKategori(form.navn.trim(), slug, form.beskrivelse.trim() || null, form.sort_order)
      }
      setForm(null)
      await genindlaes()
    } catch (err) {
      const m = err instanceof Error ? err.message : 'Kunne ikke gemme.'
      setFejl(m.includes('duplicate') ? 'Navn eller slug findes allerede.' : m)
    } finally { setGemmer(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="smu-h2">Kategorier</h1>
          <p className="smu-meta text-[13px] mt-0.5">Opret og redigér kategorier.</p>
        </div>
        {!form && (
          <button type="button" onClick={nyKategori} className="smu-btn-primary inline-flex items-center gap-1.5">
            <Plus size={15} /> Ny kategori
          </button>
        )}
      </div>

      {form && (
        <div className="smu-card p-4 space-y-3">
          <p className="text-[14px] font-extrabold text-navy">{form.id ? 'Redigér kategori' : 'Ny kategori'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="smu-label">Navn</span>
              <input className="smu-input" value={form.navn}
                onChange={e => setForm({ ...form, navn: e.target.value, slug: form.id ? form.slug : lavSlug(e.target.value) })} />
            </div>
            <div>
              <span className="smu-label">Slug (URL)</span>
              <input className="smu-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
            </div>
          </div>
          <div>
            <span className="smu-label">Beskrivelse</span>
            <input className="smu-input" value={form.beskrivelse} onChange={e => setForm({ ...form, beskrivelse: e.target.value })} />
          </div>
          <div className="max-w-[140px]">
            <span className="smu-label">Sortering</span>
            <input type="number" className="smu-input" value={form.sort_order}
              onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </div>
          {fejl && <p className="smu-error">{fejl}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={gemmer} onClick={gem} className="smu-btn-primary">
              {gemmer ? 'Gemmer…' : 'Gem'}
            </button>
            <button type="button" onClick={() => { setForm(null); setFejl('') }} className="smu-btn-secondary">Annuller</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="smu-meta text-sm">Indlæser…</p>
      ) : kategorier.length === 0 ? (
        <div className="smu-card p-6 text-center">
          <p className="smu-meta text-[13px]">Ingen kategorier endnu. Opret den første ovenfor.</p>
        </div>
      ) : (
        <div className="smu-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-soft">
                <th className="smu-th px-4 py-2.5">Navn</th>
                <th className="smu-th px-4 py-2.5">Slug</th>
                <th className="smu-th px-4 py-2.5">Sortering</th>
                <th className="smu-th px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {kategorier.map(k => (
                <tr key={k.id} className="border-b border-border-soft last:border-0">
                  <td className="px-4 py-2.5">
                    <p className="text-[13px] font-extrabold text-navy">{k.navn}</p>
                    {k.beskrivelse && <p className="smu-meta text-[12px]">{k.beskrivelse}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-[12.5px] font-semibold text-text-muted font-mono">{k.slug}</td>
                  <td className="px-4 py-2.5 text-[13px] font-semibold text-text-muted">{k.sort_order}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button type="button" onClick={() => redigerKategori(k)} className="smu-btn-ghost inline-flex items-center gap-1">
                      <Pencil size={13} /> Redigér
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
