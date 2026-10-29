// Dentro de una categoría (render/03-categoria): fotos de modelo, sin precios.
import { Link, Navigate, useParams } from 'react-router-dom'
import { BarraPedido, BotonFlotante, EspacioBarra, EstadoCatalogo, useAviso } from '../components/catalogo'
import { Icon } from '../components/Icon'
import { useCarrito } from '../lib/carrito'
import { colorPorDefecto, fotoUrl, useCatalogo, type ProductoCatalogo } from '../lib/catalogo'

const chip = 'h-[38px] shrink-0 px-3.5 rounded-full text-[13px] flex items-center'

export function Categoria() {
  const { slug } = useParams()
  const { estado, categorias, productos, edicion } = useCatalogo()
  const { agregar } = useCarrito()
  const [aviso, mostrarAviso] = useAviso()

  if (estado !== 'listo') return <EstadoCatalogo />
  const cat = categorias.find((c) => c.slug === slug)
  if (!cat || cat.proximamente) return <Navigate to="/categorias" replace />

  const lista = productos.filter((p) => p.categoria_producto_id === cat.id)
  const abiertas = categorias.filter((c) => !c.proximamente)

  function agregarRapido(p: ProductoCatalogo) {
    const color = colorPorDefecto(p)
    agregar(p.id, color?.id ?? null)
    mostrarAviso(`Agregado · ${p.nombre}${color ? ` (${color.nombre})` : ''}`)
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <div className="relative h-[250px] shrink-0 bg-arena">
        {cat.foto_portada && <img src={fotoUrl(cat.foto_portada)} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(43,36,28,0)_35%,rgba(43,36,28,.72))]" />
        <div className="absolute left-5 bottom-[38px] text-white flex flex-col gap-0.5">
          <span className="text-[11px] tracking-[0.28em] uppercase">
            {edicion} · {lista.length} {lista.length === 1 ? 'modelo' : 'modelos'}
          </span>
          <h1 className="font-serif text-[40px] font-semibold tracking-[0.2em] leading-none uppercase">{cat.nombre}</h1>
        </div>
        <BotonFlotante to="/categorias" label="Volver a categorías" className="left-4">
          <Icon name="volver" size={20} />
        </BotonFlotante>
      </div>

      <div className="relative -mt-[22px] bg-papel rounded-t-[22px] pt-3 flex flex-col gap-3.5 flex-1">
        <div className="self-center w-10 h-1 rounded-full bg-linea" aria-hidden="true" />

        <nav aria-label="Categorías" className="flex gap-2 px-5 overflow-x-auto [scrollbar-width:none]">
          {abiertas.map((c) => (
            <Link
              key={c.id}
              to={`/c/${c.slug}`}
              replace
              aria-current={c.id === cat.id ? 'page' : undefined}
              className={`${chip} ${c.id === cat.id ? 'bg-tinta text-papel font-medium' : 'border border-linea text-tinta'}`}
            >
              {c.nombre}
            </Link>
          ))}
          <Link to="/personaliza" className={`${chip} border border-tierra text-tinta`}>
            Personaliza
          </Link>
        </nav>

        <ul className="px-5 grid grid-cols-2 gap-x-3 gap-y-4">
          {lista.map((p) => (
            <li key={p.id} className="flex flex-col gap-2">
              <div className="relative">
                <Link to={`/p/${p.slug}`} className="block">
                  <img
                    src={fotoUrl(p.foto_principal)}
                    alt={`${cat.nombre} ${p.nombre}`}
                    loading="lazy"
                    className="w-full h-[184px] object-cover object-[50%_30%] rounded-md bg-arena"
                  />
                </Link>
                {p.disponible ? (
                  <button
                    type="button"
                    aria-label={`Agregar ${p.nombre}`}
                    onClick={() => agregarRapido(p)}
                    className="absolute right-1 bottom-1 w-11 h-11 flex items-center justify-center"
                  >
                    <span className="w-9 h-9 rounded-full bg-papel text-tinta flex items-center justify-center">
                      <Icon name="mas" size={16} strokeWidth={2} />
                    </span>
                  </button>
                ) : (
                  <span className="absolute left-2 bottom-2 rounded-full bg-papel/92 px-2.5 py-1 text-[11px] tracking-[0.12em] uppercase text-tinta-2">
                    Agotado
                  </span>
                )}
              </div>
              <Link to={`/p/${p.slug}`} className="font-serif text-[19px] font-semibold tracking-[0.14em] uppercase leading-tight">
                {p.nombre}
              </Link>
            </li>
          ))}
        </ul>

        <EspacioBarra />
      </div>

      {aviso}
      <BarraPedido oscura />
    </div>
  )
}
