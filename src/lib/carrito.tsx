// Carrito guardado en el navegador (plan §7: que no se pierda al recargar).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCatalogo } from './catalogo'
import { resumenPedido, type ItemCarrito, type ResumenPedido } from './pedido'

const CLAVE = 'itaca-carrito-v1'

function leer(): ItemCarrito[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(v)
      ? v.filter((i) => typeof i?.producto_id === 'string' && Number.isInteger(i?.cantidad) && i.cantidad > 0)
      : []
  } catch {
    return []
  }
}

function guardar(items: ItemCarrito[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items))
  } catch {
    // Modo privado o almacenamiento bloqueado: el carrito vive solo en memoria.
  }
}

const mismo = (a: ItemCarrito, producto_id: string, color_id: string | null) =>
  a.producto_id === producto_id && a.color_id === color_id

interface CarritoCtx {
  /** Solo ítems de productos que siguen en el catálogo. */
  items: ItemCarrito[]
  resumen: ResumenPedido
  agregar: (producto_id: string, color_id: string | null, cantidad?: number) => void
  cambiar: (producto_id: string, color_id: string | null, cantidad: number) => void
  vaciar: () => void
}

const Ctx = createContext<CarritoCtx | null>(null)

export function CarritoProvider({ children }: { children: ReactNode }) {
  const { productos, estado } = useCatalogo()
  const [todos, setTodos] = useState<ItemCarrito[]>(leer)

  useEffect(() => {
    guardar(todos)
  }, [todos])

  const agregar = useCallback((producto_id: string, color_id: string | null, cantidad = 1) => {
    setTodos((prev) =>
      prev.some((i) => mismo(i, producto_id, color_id))
        ? prev.map((i) => (mismo(i, producto_id, color_id) ? { ...i, cantidad: i.cantidad + cantidad } : i))
        : [...prev, { producto_id, color_id, cantidad }],
    )
  }, [])

  const cambiar = useCallback((producto_id: string, color_id: string | null, cantidad: number) => {
    setTodos((prev) =>
      cantidad <= 0
        ? prev.filter((i) => !mismo(i, producto_id, color_id))
        : prev.map((i) => (mismo(i, producto_id, color_id) ? { ...i, cantidad } : i)),
    )
  }, [])

  const valor = useMemo(() => {
    // Mientras carga el catálogo no se sabe qué existe: se muestra vacío sin borrar nada.
    const ids = new Set(productos.map((p) => p.id))
    const items = estado === 'listo' ? todos.filter((i) => ids.has(i.producto_id)) : []
    return { items, resumen: resumenPedido(items, productos), agregar, cambiar, vaciar: () => setTodos([]) }
  }, [todos, productos, estado, agregar, cambiar])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useCarrito(): CarritoCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCarrito fuera de CarritoProvider')
  return c
}
