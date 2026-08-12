import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [fejl, setFejl] = useState('')
  const [gemmer, setGemmer] = useState(false)
  const [faerdig, setFaerdig] = useState(false)

  async function handleGem(e: React.FormEvent) {
    e.preventDefault()
    setFejl('')
    if (password.length < 8) { setFejl('Adgangskoden skal være mindst 8 tegn.'); return }
    if (password !== password2) { setFejl('De to adgangskoder er ikke ens.'); return }
    setGemmer(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setFejl(`Kunne ikke opdatere adgangskode: ${error.message}`)
      setGemmer(false)
    } else {
      setFaerdig(true)
      setTimeout(() => navigate('/'), 1500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em] text-navy">SMU Wiki</h1>
        </div>
        <div className="smu-card p-7">
          <h2 className="text-[17px] font-extrabold text-navy mb-5">Vælg ny adgangskode</h2>
          {faerdig ? (
            <div className="rounded-lg p-4 bg-teal-soft">
              <p className="text-[13px] font-bold text-teal-deep">Adgangskode opdateret. Sender dig videre…</p>
            </div>
          ) : (
            <form onSubmit={handleGem} className="space-y-4">
              <div>
                <span className="smu-label">Ny adgangskode</span>
                <input type="password" required autoFocus autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)} className="smu-input" placeholder="••••••••" />
              </div>
              <div>
                <span className="smu-label">Gentag adgangskode</span>
                <input type="password" required autoComplete="new-password"
                  value={password2} onChange={e => setPassword2(e.target.value)} className="smu-input" placeholder="••••••••" />
              </div>
              {fejl && <p className="smu-error">{fejl}</p>}
              <button type="submit" disabled={gemmer} className="smu-btn-primary w-full py-2.5">
                {gemmer ? 'Gemmer…' : 'Gem adgangskode'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
