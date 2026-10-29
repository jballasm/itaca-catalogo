// Modo Tere (#/tere): login con la misma cuenta de Ítaca Finanzas y rutas de edición.
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { BotonPrimario, Logo } from '../components/ui'
import { supabase } from '../lib/supabase'
import { Ajustes } from './Ajustes'
import { DatosTereProvider, useDatosTere } from './datos'
import { EditorProducto } from './EditorProducto'
import { Inicio } from './Inicio'
import { Login } from './Login'
import { Solicitudes } from './Solicitudes'

function Cargando() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Logo className="w-20 h-10 opacity-60 animate-pulse" />
    </div>
  )
}

function Rutas() {
  const { estado, config, recargar } = useDatosTere()
  if (estado === 'cargando') return <Cargando />
  if (estado === 'error') {
    return (
      <div className="min-h-dvh max-w-[480px] mx-auto px-8 flex flex-col items-center justify-center gap-5 text-center">
        <Logo className="w-20 h-10" />
        <p className="text-[15px] text-tinta-2">No pudimos cargar tus datos. Revisa tu conexión.</p>
        <BotonPrimario onClick={() => void recargar()}>Reintentar</BotonPrimario>
      </div>
    )
  }
  // Solo la dueña del catálogo (la cuenta con fila en config) puede editarlo.
  if (!config) {
    return (
      <div className="min-h-dvh max-w-[480px] mx-auto px-8 flex flex-col items-center justify-center gap-5 text-center">
        <Logo className="w-20 h-10" />
        <p className="text-[15px] text-tinta-2">Esta cuenta no administra el catálogo de Ítaca.</p>
        <BotonPrimario onClick={() => void supabase.auth.signOut()}>Salir</BotonPrimario>
      </div>
    )
  }
  return (
    <Routes>
      <Route index element={<Inicio />} />
      <Route path="nuevo" element={<EditorProducto />} />
      <Route path="p/:id" element={<EditorProducto />} />
      <Route path="solicitudes" element={<Solicitudes />} />
      <Route path="ajustes" element={<Ajustes />} />
      <Route path="*" element={<Navigate to="/tere" replace />} />
    </Routes>
  )
}

export function ModoTere() {
  const { session, cargando, recuperando } = useAuth()
  if (cargando) return <Cargando />
  if (recuperando) return <Login vistaInicial="nueva" />
  if (!session) return <Login />
  return (
    <DatosTereProvider>
      <Rutas />
    </DatosTereProvider>
  )
}
