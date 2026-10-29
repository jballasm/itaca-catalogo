import { useEffect } from 'react'
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { CarritoProvider } from './lib/carrito'
import { CatalogoProvider } from './lib/catalogo'
import { Categoria } from './pages/Categoria'
import { Categorias } from './pages/Categorias'
import { Portada } from './pages/Portada'
import { Pedido } from './pages/Pedido'
import { Personalizacion } from './pages/Personalizacion'
import { Producto } from './pages/Producto'
import { ModoTere } from './tere/ModoTere'

/** Cada pantalla parte desde arriba. */
function ArribaAlNavegar() {
  const { pathname } = useLocation()
  // Con llaves: en navegadores nuevos scrollTo devuelve una promesa y React la tomaría como limpieza.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Con sesión (Tere viendo como clienta), una franja para volver a Modo Tere. */
function VolverAModoTere() {
  const { session } = useAuth()
  const { pathname } = useLocation()
  if (!session || pathname.startsWith('/tere') || pathname === '/') return null
  return (
    <div className="bg-tinta text-papel text-[13px]">
      <div className="max-w-[480px] mx-auto px-4 h-10 flex items-center justify-between">
        <span className="text-[#D9CBB4]">Estás viendo como clienta</span>
        <Link to="/tere" className="min-h-10 flex items-center underline underline-offset-4">
          Volver a Modo Tere
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CatalogoProvider>
        <CarritoProvider>
          <HashRouter>
            <ArribaAlNavegar />
            <VolverAModoTere />
            <Routes>
              <Route index element={<Portada />} />
              <Route path="categorias" element={<Categorias />} />
              <Route path="c/:slug" element={<Categoria />} />
              <Route path="p/:slug" element={<Producto />} />
              <Route path="pedido" element={<Pedido />} />
              <Route path="personaliza" element={<Personalizacion />} />
              <Route path="tere/*" element={<ModoTere />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </CarritoProvider>
      </CatalogoProvider>
    </AuthProvider>
  )
}
