import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { hentMineForslag } from '../lib/wikiApi'
import { forslagStatusBadge, FORSLAG_STATUS_LABEL } from '../types/wiki'
import type { WikiForslag } from '../types/wiki'
import { dkDatoTid } from '../lib/format'

export default function MineForslag() {
  const { user } = useAuth()
  const location = useLocation()
  const netopIndsendt = (location.state as { netopIndsendt?: boolean } | null)?.netopIndsendt
  const [forslag, setForslag] = useState<WikiForslag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    hentMineForslag(user.id).then(setForslag).finally(() => setLoading(false))
  }, [user])

  return (
    <div className="space-y-5">
      <h1 className="smu-h1">Mine forslag</h1>

      {netopIndsendt && (
        <div className="smu-notice smu-notice-ok">
          <CheckCircle size={16} className="shrink-0" />
          <span>Dit forslag er indsendt og afventer godkendelse.</span>
        </div>
      )}

      {loading ? (
        <p className="smu-meta text-sm">Indlæser…</p>
      ) : forslag.length === 0 ? (
        <div className="smu-card p-6 text-center">
          <p className="font-bold text-navy mb-1">Du har ingen forslag endnu.</p>
          <p className="smu-meta text-[13px] mb-3">Foreslå en ny side eller en ændring, så dukker den op her.</p>
          <Link to="/forslag/ny" className="smu-btn-primary inline-block">+ Opret forslag</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {forslag.map(f => (
            <li key={f.id} className="smu-card px-4 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="smu-badge smu-badge-grey">{f.type === 'ny_side' ? 'Ny side' : 'Ændring'}</span>
                <span className="text-[14px] font-extrabold text-navy min-w-0 truncate flex-1">{f.titel}</span>
                <span className={forslagStatusBadge(f.status)}>{FORSLAG_STATUS_LABEL[f.status]}</span>
              </div>
              <p className="smu-meta mt-1.5">
                Indsendt {dkDatoTid(f.created_at)}
                {f.behandlet_at ? ` · behandlet ${dkDatoTid(f.behandlet_at)}` : ''}
              </p>
              {f.status === 'afvist' && f.afvisning_note && (
                <p className="smu-error mt-1 font-semibold">Afvist: {f.afvisning_note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
