import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { Mensaje } from './components/catalogo'
import { BotonPrimario, Encabezado, Logo, Pantalla, Proximamente } from './components/ui'
import { CarritoProvider } from './lib/carrito'
import { CatalogoProvider } from './lib/catalogo'
import { supabase } from './lib/supabase'
import { Categoria } from './pages/Categoria'
import { Categorias } from './pages/Categorias'
import { Portada } from './pages/Portada'
import { Producto } from './pages/Producto'
import { Login } from './tere/Login'

function Cargando() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Logo className="w-20 h-10 opacity-60 animate-pulse" />
    </div>
  )
}

// Provisorio hasta la Fase 8.
function ModoTere() {
  const { session, cargando, recuperando } = useAuth()
  if (cargando) return <Cargando />
  if (recuperando) return <Login vistaInicial="nueva" />
  if (!session) return <Login />
  return (
    <div className="max-w-[480px] mx-auto">
      <Pantalla>
        <Encabezado titulo="Modo Tere" volver={false} />
        <Proximamente texto="Aquí vas a editar productos, precios, fotos y ajustes del catálogo." />
        <BotonPrimario onClick={() => supabase.auth.signOut()}>Salir</BotonPrimario>
      </Pantalla>
    </div>
  )
}

/** Cada pantalla parte desde arriba. */
function ArribaAlNavegar() {
  const { pathname } = useLocation()
  // Con llaves: en navegadores nuevos scrollTo devuelve una promesa y React la tomaría como limpieza.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <CatalogoProvider>
        <CarritoProvider>
          <HashRouter>
            <ArribaAlNavegar />
            <Routes>
              <Route index element={<Portada />} />
              <Route path="categorias" element={<Categorias />} />
              <Route path="c/:slug" element={<Categoria />} />
              <Route path="p/:slug" element={<Producto />} />
              {/* Provisorios hasta las Fases 6 y 7 */}
              <Route path="pedido" element={<Mensaje titulo="Tu pedido" texto="Muy pronto vas a poder enviar tu pedido desde aquí." />} />
              <Route path="personaliza" element={<Mensaje titulo="Personalización" texto="Muy pronto vas a poder pedir tu pieza personalizada." />} />
              <Route path="tere" element={<ModoTere />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </CarritoProvider>
      </CatalogoProvider>
    </AuthProvider>
  )
}
