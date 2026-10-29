import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { BotonPrimario, Encabezado, Logo, Pantalla, Proximamente } from './components/ui'
import { supabase } from './lib/supabase'
import { Portada } from './pages/Portada'
import { Login } from './tere/Login'

function Cargando() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Logo className="w-20 h-10 opacity-60 animate-pulse" />
    </div>
  )
}

// Provisorio hasta la Fase 5.
function Categorias() {
  return (
    <div className="max-w-[480px] mx-auto">
      <Pantalla>
        <Encabezado titulo="Catálogo" />
        <Proximamente texto="Estamos preparando el catálogo de la Edición 01." />
      </Pantalla>
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

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route index element={<Portada />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="tere" element={<ModoTere />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
