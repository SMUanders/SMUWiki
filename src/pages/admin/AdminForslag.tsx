import { useEffect, useState } from 'react'
import { Check, X, ChevronDown, ChevronRight, Inbox } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { hentAfventendeForslag, godkendForslag, afvisForslag } from '../../lib/wikiApi'
import type { WikiForslag } from '../../types/wiki'
import { dkDatoTid } from '../../lib/format'
import DiffVisning from '../../components/DiffVisning'

interface SideData { titel: string; beskrivelse: string | null; indhold: string }

export default function AdminForslag() {
  const [forslag, setForslag] = useState<WikiForslag[]>([])
  const [loading, setLoading] = useState(true)
  const [aabenId, setAabenId] = useState<string | null>(null)
  const [eksisterende, setEksisterende] = useState<Record<string, SideData | null>>({})
  const [arbejder, setArbejder] = useState<string | null>(null)
  const [afvisId, setAfvisId] = useState<string | null>(null)
  const [afvisNote, setAfvisNote] = useState('')
  const [fejl, setFejl] = useState('')

  async function genindlaes() {
    const data = await hentAfventendeForslag()
    setForslag(data)
    setLoading(false)
  }

  useEffect(() => {
    hentAfventendeForslag().then(setForslag).finally(() => setLoading(false))
  }, [])

  async function aabn(f: WikiForslag) {
    const nyId = aabenId === f.id ? null : f.id
    setAabenId(nyId)
    if (nyId && f.type === 'aendring' && f.page_id && !(f.id in eksisterende)) {
      const { data } = await supabase.from('wiki_pages')
        .select('titel, beskrivelse, indhold').eq('id', f.page_id).maybeSingle()
      setEksisterende(prev => ({ ...prev, [f.id]: (data as SideData) ?? null }))
    }
  }

  async function handleGodkend(f: WikiForslag) {
    setFejl(''); setArbejder(f.id)
    try {
      await godkendForslag(f.id)
      await genindlaes()
      setAabenId(null)
    } catch (err) {
      setFejl(err instanceof Error ? err.message : 'Kunne ikke godkende.')
    } finally { setArbejder(null) }
  }

  async function handleAfvis(f: WikiForslag) {
    setFejl(''); setArbejder(f.id)
    try {
      await afvisForslag(f.id, afvisNote.trim() || null)
      setAfvisId(null); setAfvisNote('')
      await genindlaes()
      setAabenId(null)
    } catch (err) {
      setFejl(err instanceof Error ? err.message : 'Kunne ikke afvise.')
    } finally { setArbejder(null) }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="smu-h2">Godkendelser</h1>
        <p className="smu-meta text-[13px] mt-0.5">Afventende nye sider og ændringsforslag.</p>
      </div>

      {fejl && <p className="smu-error">{fejl}</p>}

      {loading ? (
        <p className="smu-meta text-sm">Indlæser…</p>
      ) : forslag.length === 0 ? (
        <div className="smu-card p-8 text-center">
          <Inbox size={28} className="text-text-muted mx-auto mb-2" />
          <p className="font-bold text-navy">Ingen forslag afventer</p>
          <p className="smu-meta text-[13px] mt-0.5">Alt er behandlet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {forslag.map(f => {
            const aaben = aabenId === f.id
            return (
              <li key={f.id} className="smu-card overflow-hidden">
                <button type="button" onClick={() => aabn(f)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3">
                  {aaben ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
                  <span className={`smu-badge ${f.type === 'ny_side' ? 'smu-badge-blue' : 'smu-badge-orange'}`}>
                    {f.type === 'ny_side' ? 'Ny side' : 'Ændring'}
                  </span>
                  <span className="text-[14px] font-extrabold text-navy min-w-0 truncate flex-1">{f.titel}</span>
                  <span className="smu-meta hidden sm:block shrink-0">
                    {f.created_by_navn ?? 'Ukendt'} · {dkDatoTid(f.created_at)}
                  </span>
                </button>

                {aaben && (
                  <div className="px-4 pb-4 border-t border-border-soft">
                    {f.begrundelse && (
                      <div className="mt-3 mb-3 rounded-lg px-3 py-2 bg-row-bg border border-border">
                        <span className="smu-eyebrow">Begrundelse</span>
                        <p className="text-[13px] font-semibold text-navy mt-0.5">{f.begrundelse}</p>
                      </div>
                    )}

                    <div className="mt-3">
                      <DiffVisning
                        eksisterende={f.type === 'aendring' ? (eksisterende[f.id] ?? null) : null}
                        foreslaaet={{ titel: f.titel, beskrivelse: f.beskrivelse, indhold: f.indhold }}
                      />
                    </div>

                    {/* Handlinger */}
                    {afvisId === f.id ? (
                      <div className="mt-4 space-y-2">
                        <textarea className="smu-input resize-y min-h-[60px]"
                          value={afvisNote} onChange={e => setAfvisNote(e.target.value)}
                          placeholder="Begrundelse for afvisning (valgfri, vises for indsenderen)" />
                        <div className="flex gap-2">
                          <button type="button" disabled={arbejder === f.id} onClick={() => handleAfvis(f)}
                            className="smu-btn-secondary">
                            {arbejder === f.id ? 'Afviser…' : 'Bekræft afvisning'}
                          </button>
                          <button type="button" onClick={() => { setAfvisId(null); setAfvisNote('') }} className="smu-btn-ghost">
                            Fortryd
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex gap-2">
                        <button type="button" disabled={arbejder === f.id} onClick={() => handleGodkend(f)}
                          className="smu-btn-success inline-flex items-center gap-1.5">
                          <Check size={15} /> {arbejder === f.id ? 'Godkender…' : 'Godkend & publicér'}
                        </button>
                        <button type="button" onClick={() => { setAfvisId(f.id); setAfvisNote('') }}
                          className="smu-btn-secondary inline-flex items-center gap-1.5">
                          <X size={15} /> Afvis
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
