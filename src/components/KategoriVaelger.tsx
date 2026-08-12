import type { WikiKategori } from '../types/wiki'

/** Multi-select af kategorier (checkbokse). En side kan tilhøre flere. */
export default function KategoriVaelger({ kategorier, valgte, onChange }: {
  kategorier: WikiKategori[]
  valgte: string[]
  onChange: (ids: string[]) => void
}) {
  function toggle(id: string) {
    onChange(valgte.includes(id) ? valgte.filter(v => v !== id) : [...valgte, id])
  }

  if (kategorier.length === 0) {
    return <p className="smu-meta text-[13px]">Ingen kategorier oprettet endnu.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {kategorier.map(k => {
        const aktiv = valgte.includes(k.id)
        return (
          <button
            key={k.id}
            type="button"
            onClick={() => toggle(k.id)}
            className={[
              'text-[12px] font-bold px-3 py-1.5 rounded-full border transition-colors',
              aktiv
                ? 'bg-primary border-primary text-white'
                : 'bg-card border-border text-navy hover:border-primary',
            ].join(' ')}
          >
            {k.navn}
          </button>
        )
      })}
    </div>
  )
}
