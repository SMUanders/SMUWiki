import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { hentKategorier, opretForslag } from '../lib/wikiApi'
import type { ForslagType, WikiKategori } from '../types/wiki'
import KategoriVaelger from './KategoriVaelger'
import MarkdownIndhold from './MarkdownIndhold'

interface Initial {
  titel: string
  beskrivelse: string
  indhold: string
  kategori_ids: string[]
}

const MARKDOWN_HJAELP = `## Overskrift

Almindelig tekst. Lav en **fremhævet** pointe eller en liste:

- Punkt et
- Punkt to

> [!info] Informationsboks
> Brug [!info], [!vigtigt], [!advarsel] eller [!note].`

export default function ForslagForm({ type, pageId, initial, overskrift }: {
  type: ForslagType
  pageId: string | null
  initial: Initial
  overskrift: string
}) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [kategorier, setKategorier] = useState<WikiKategori[]>([])
  const [titel, setTitel] = useState(initial.titel)
  const [beskrivelse, setBeskrivelse] = useState(initial.beskrivelse)
  const [indhold, setIndhold] = useState(initial.indhold)
  const [valgteKat, setValgteKat] = useState<string[]>(initial.kategori_ids)
  const [begrundelse, setBegrundelse] = useState('')
  const [visPreview, setVisPreview] = useState(false)
  const [gemmer, setGemmer] = useState(false)
  const [fejl, setFejl] = useState('')

  useEffect(() => { hentKategorier().then(setKategorier).catch(() => {}) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFejl('')
    if (!titel.trim()) { setFejl('Titel er påkrævet.'); return }
    if (!indhold.trim()) { setFejl('Indhold er påkrævet.'); return }
    if (!user) { setFejl('Du er ikke logget ind.'); return }

    setGemmer(true)
    try {
      await opretForslag({
        type,
        page_id: pageId,
        titel: titel.trim(),
        beskrivelse: beskrivelse.trim() || null,
        indhold,
        kategori_ids: valgteKat,
        begrundelse: begrundelse.trim() || null,
        created_by: user.id,
      })
      navigate('/mine-forslag', { state: { netopIndsendt: true } })
    } catch (err) {
      const besked = err instanceof Error ? err.message : 'Kunne ikke indsende forslaget.'
      setFejl(besked.includes('duplicate') || besked.includes('unik')
        ? 'Der ligger allerede et afventende ændringsforslag for denne side. Vent til det er behandlet.'
        : besked)
      setGemmer(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="smu-h2">{overskrift}</h1>

      <div className="smu-notice smu-notice-info">
        <span className="font-semibold">
          Dit forslag ændrer ikke den publicerede side. Det sendes til en admin, som godkender eller afviser det.
        </span>
      </div>

      <Felt label="Titel">
        <input className="smu-input" value={titel} onChange={e => setTitel(e.target.value)} placeholder="Sidens titel" />
      </Felt>

      <Felt label="Kort beskrivelse">
        <input className="smu-input" value={beskrivelse} onChange={e => setBeskrivelse(e.target.value)}
          placeholder="Én linje der opsummerer siden" />
      </Felt>

      <Felt label="Kategorier">
        <KategoriVaelger kategorier={kategorier} valgte={valgteKat} onChange={setValgteKat} />
      </Felt>

      {/* Indhold med preview-toggle */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="smu-label mb-0">Hovedindhold</span>
          <button type="button" onClick={() => setVisPreview(v => !v)}
            className="smu-btn-ghost inline-flex items-center gap-1">
            {visPreview ? <><Pencil size={13} /> Skriv</> : <><Eye size={13} /> Forhåndsvis</>}
          </button>
        </div>
        {visPreview ? (
          <div className="smu-card p-5">
            {indhold.trim()
              ? <MarkdownIndhold indhold={indhold} />
              : <p className="smu-meta text-[13px]">Intet indhold at vise endnu.</p>}
          </div>
        ) : (
          <textarea
            className="smu-input font-mono leading-relaxed resize-y min-h-[320px]"
            value={indhold}
            onChange={e => setIndhold(e.target.value)}
            placeholder={MARKDOWN_HJAELP}
          />
        )}
        <p className="text-[11.5px] font-semibold text-text-muted mt-1.5">
          Understøtter markdown: ## overskrift, **fed**, - lister, tabeller samt informationsbokse med {'>'} [!info].
        </p>
      </div>

      <Felt label="Begrundelse (valgfri)">
        <textarea className="smu-input resize-y min-h-[70px]"
          value={begrundelse} onChange={e => setBegrundelse(e.target.value)}
          placeholder="Hvorfor foreslår du dette? (ses kun af admin)" />
      </Felt>

      {fejl && <p className="smu-error">{fejl}</p>}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={gemmer} className="smu-btn-primary">
          {gemmer ? 'Indsender…' : 'Indsend forslag'}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="smu-btn-secondary">Annuller</button>
      </div>
    </form>
  )
}

function Felt({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="smu-label">{label}</span>
      {children}
    </div>
  )
}
