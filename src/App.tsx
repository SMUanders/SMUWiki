import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Forside from './pages/Forside'
import KategoriSide from './pages/KategoriSide'
import WikiSide from './pages/WikiSide'
import NytForslag from './pages/NytForslag'
import AendringsForslag from './pages/AendringsForslag'
import MineForslag from './pages/MineForslag'
import AdminLayout from './pages/admin/AdminLayout'
import AdminForslag from './pages/admin/AdminForslag'
import AdminKategorier from './pages/admin/AdminKategorier'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Forside />} />
            <Route path="/kategori/:slug" element={<KategoriSide />} />
            <Route path="/side/:slug" element={<WikiSide />} />
            <Route path="/side/:slug/foreslag-aendring" element={<AendringsForslag />} />
            <Route path="/forslag/ny" element={<NytForslag />} />
            <Route path="/mine-forslag" element={<MineForslag />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminForslag />} />
              <Route path="kategorier" element={<AdminKategorier />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
