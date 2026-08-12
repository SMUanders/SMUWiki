import { useState } from 'react'
import { History } from 'lucide-react'
import type { WikiSideVersion } from '../types/wiki'
import { dkDatoTid } from '../lib/format'
import MarkdownIndhold from './MarkdownIndhold'

/** Simpel versionshistorik (dato, bruger, versionsnummer). Kun admin. */
export default function VersionHistorik({ versioner }: { versioner: WikiSideVersion[] }) {
  const [aabenId, setAabenId] = useState<string | null>(null)

  if (versioner.length === 0) {
    return <p className="smu-meta text-[13px]">Ingen versioner endnu.</p>
  }

  return (
    <div className="smu-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-soft">
        <History size={15} className="text-text-muted" />
        <span className="smu-eyebrow">Versionshistorik</span>
      </div>
      <ul>
        {versioner.map(v => (
          <li key={v.id} className="border-b border-border-soft last:border-0">
            <button
              type="button"
              onClick={() => setAabenId(aabenId === v.id ? null : v.id)}
              className="smu-list-card w-full text-left px-4 py-2.5 flex items-center gap-3"
            >
              <span className="smu-badge smu-badge-grey">v{v.version_nr}</span>
              <span className="text-[13px] font-bold text-navy">{v.published_by_navn ?? 'Ukendt'}</span>
              <span className="smu-meta ml-auto">{dkDatoTid(v.published_at)}</span>
            </button>
            {aabenId === v.id && (
              <div className="px-4 pb-4 pt-1">
                <div className="smu-card p-4">
                  <p className="text-[15px] font-extrabold text-navy mb-2">{v.titel}</p>
                  <MarkdownIndhold indhold={v.indhold} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
