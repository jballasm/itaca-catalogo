// Categorías (render/02-categorias).
import { Link } from 'react-router-dom'
import { BarraPedido, EspacioBarra, EstadoCatalogo } from '../components/catalogo'
import { Icon } from '../components/Icon'
import { Logo } from '../components/ui'
import { fotoUrl, useCatalogo } from '../lib/catalogo'

const IMG = `${import.meta.env.BASE_URL}img/`

export function Categorias() {
  const { estado, categorias, config, edicion } = useCatalogo()
  if (estado !== 'listo') return <EstadoCatalogo />

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <Link to="/" className="flex items-center gap-2.5 min-h-11 text-tinta">
          <Logo className="w-10 h-5" />
          <h1 className="font-serif text-[22px] font-semibold tracking-[0.22em]">ÍTACA</h1>
        </Link>
        {config && (
          <a
            href={`https://instagram.com/${config.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-3 border border-linea rounded-full flex items-center gap-1.5 text-[12px] text-tinta"
          >
            <Icon name="instagram" size={16} strokeWidth={1.6} />@{config.instagram}
          </a>
        )}
      </header>

      <section className="mx-5 h-28 rounded overflow-hidden flex">
        <div className="flex-1 bg-arena px-[18px] py-4 flex flex-col justify-center gap-1.5">
          <p className="font-serif text-[24px] font-medium tracking-[0.06em] leading-[1.05]">
            DE MANO
            <br />
            EN MANO.
          </p>
          <p className="text-[12px] text-tinta-2 leading-snug">Tejidas a mano, una a una.</p>
        </div>
        <img src={`${IMG}manos.jpg`} alt="Manos tejiendo" className="w-[104px] h-full object-cover" />
      </section>

      <h2 className="text-[11px] tracking-[0.3em] text-tinta-2 px-5 pt-5 pb-2.5 uppercase">Colección · {edicion}</h2>

      <div className="px-5 grid grid-cols-2 gap-3">
        {/* "Próximamente" al final, como en el render (en la base Collares tiene orden 3 y Carteras 4). */}
        {[...categorias.filter((c) => !c.proximamente), ...categorias.filter((c) => c.proximamente)].map((c) =>
          c.proximamente ? (
            <div
              key={c.id}
              className="h-[172px] rounded-md border border-dashed border-[#B9AC97] flex flex-col items-center justify-center gap-1.5"
            >
              <span className="font-serif text-[22px] font-semibold tracking-[0.2em] text-tinta-2 uppercase">{c.nombre}</span>
              <span className="font-serif italic text-[16px] text-tinta-2">Próximamente</span>
            </div>
          ) : (
            <Link key={c.id} to={`/c/${c.slug}`} className="relative h-[172px] rounded-md overflow-hidden block bg-arena">
              {c.foto_portada && (
                <img src={fotoUrl(c.foto_portada)} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 pt-[30px] px-3 pb-3 bg-gradient-to-b from-transparent to-[rgba(43,36,28,.72)] text-white">
                <span className="font-serif text-[22px] font-semibold tracking-[0.2em] uppercase">{c.nombre}</span>
              </div>
            </Link>
          ),
        )}
      </div>

      <Link to="/personaliza" className="mx-5 mt-3 h-[84px] rounded-md bg-tinta text-papel flex items-center overflow-hidden">
        <img src={`${IMG}textura.jpg`} alt="" className="w-[92px] h-full object-cover" />
        <div className="flex-1 px-3.5 flex flex-col gap-1 min-w-0">
          <span className="font-serif text-[18px] font-semibold tracking-[0.14em]">PERSONALIZACIÓN</span>
          <span className="text-[12px] text-[#D9CBB4]">Creamos tu pieza a tu gusto</span>
        </div>
        <Icon name="siguiente" size={20} strokeWidth={1.6} className="mr-4 shrink-0" />
      </Link>

      <EspacioBarra />
      <BarraPedido />
    </div>
  )
}
