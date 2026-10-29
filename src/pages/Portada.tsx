// Portada (render/01-portada): tocar o deslizar hacia arriba → Categorías.
import { useRef, type TouchEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/ui'

const HERO = `${import.meta.env.BASE_URL}img/hero-mar.jpg`
const DESLIZAR_MIN = 50

export function Portada() {
  const navigate = useNavigate()
  const inicioY = useRef<number | null>(null)

  function alSoltar(e: TouchEvent) {
    const y0 = inicioY.current
    inicioY.current = null
    if (y0 !== null && y0 - e.changedTouches[0].clientY > DESLIZAR_MIN) navigate('/categorias')
  }

  return (
    <Link
      to="/categorias"
      aria-label="Entrar al catálogo"
      onTouchStart={(e) => (inicioY.current = e.touches[0].clientY)}
      onTouchEnd={alSoltar}
      className="h-dvh max-w-[480px] mx-auto flex flex-col overflow-hidden bg-papel text-tinta no-underline"
    >
      <div className="flex flex-col items-center text-center gap-2.5 px-8 pt-16 pb-8">
        <Logo className="w-[92px] h-[45px]" />
        <h1 className="font-serif font-medium text-[62px] leading-none tracking-[0.16em] pl-[0.16em]">ÍTACA</h1>
        <div className="text-[11px] tracking-[0.38em] pl-[0.38em] text-tinta-2">JOYAS CON HISTORIA</div>
        <div className="w-9 h-px bg-tierra my-1.5" />
        <div className="text-[11px] tracking-[0.32em] pl-[0.32em] text-tinta-2">EDICIÓN 01</div>
      </div>

      <div className="relative flex-1 min-h-0">
        <img src={HERO} alt="Acantilados frente al mar" className="block w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(43,36,28,0)_55%,rgba(43,36,28,.6))]" />
        <div className="absolute inset-x-0 bottom-[30px] flex flex-col items-center gap-2.5 text-papel">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M6 14l6-6 6 6" />
            <path d="M6 19l6-6 6 6" opacity=".55" />
          </svg>
          <div className="text-[12px] tracking-[0.34em] pl-[0.34em]">DESLIZA PARA ENTRAR</div>
        </div>
      </div>
    </Link>
  )
}
