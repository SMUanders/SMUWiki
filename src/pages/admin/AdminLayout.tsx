import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { erAdmin } from '../../types/wiki'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block px-3 py-2 rounded-lg text-sm transition-colors',
    isActive ? 'bg-primary text-white font-bold' : 'text-text-muted font-semibold hover:bg-row-bg hover:text-navy',
  ].join(' ')

export default function AdminLayout() {
  const { profil, loading } = useAuth()

  if (loading) return <p className="smu-meta text-sm">Indlæser…</p>
  if (!erAdmin(profil)) return <Navigate to="/" replace />

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <aside className="sm:w-48 shrink-0">
        <h2 className="smu-eyebrow mb-3 px-3">Admin</h2>
        <nav className="flex sm:flex-col gap-1">
          <NavLink to="/admin" end className={linkClass}>Godkendelser</NavLink>
          <NavLink to="/admin/kategorier" className={linkClass}>Kategorier</NavLink>
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
