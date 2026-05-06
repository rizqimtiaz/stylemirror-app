'use client'

import { motion } from 'framer-motion'
import { Check, Search, Shirt } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { ALL_PRODUCTS, useMirrorStore } from '@/store/useMirrorStore'

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  outerwear: 'Outerwear',
  dress: 'Dresses',
  shirt: 'Shirts',
  knitwear: 'Knitwear',
  bottom: 'Bottoms',
  top: 'Tops',
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function ProductCatalog() {
  const selectedProductId = useMirrorStore((s) => s.selectedProductId)
  const selectProduct = useMirrorStore((s) => s.selectProduct)
  const twinImage = useMirrorStore((s) => s.twinImage)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')

  const categories = useMemo(() => {
    const set = new Set<string>(['all'])
    for (const p of ALL_PRODUCTS) set.add(p.category)
    return Array.from(set)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_PRODUCTS.filter((p) => {
      const matchesCategory = category === 'all' || p.category === category
      if (!matchesCategory) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.designer.toLowerCase().includes(q) ||
        p.fabricDescription.toLowerCase().includes(q)
      )
    })
  }, [query, category])

  return (
    <aside
      aria-label="Product catalog"
      className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(60,40,90,0.25)]"
    >
      <header className="flex flex-col gap-3 border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shirt className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-serif text-lg leading-tight">Atelier</h2>
            <p className="text-xs text-muted-foreground">
              Curated products mapped to the StyleMirror ontology.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by piece, designer, or fabric"
            aria-label="Search catalog"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = category === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={active}
              >
                {CATEGORY_LABELS[c] ?? c}
              </button>
            )
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="font-serif text-base">Nothing in this drawer.</p>
            <p className="text-xs text-muted-foreground">
              Try a different search or category.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((product) => {
              const isSelected = product.id === selectedProductId
              return (
                <li key={product.id}>
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    onClick={() => selectProduct(product.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/60'
                    }`}
                    aria-pressed={isSelected}
                    disabled={!twinImage}
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.baseImage || '/placeholder.svg'}
                        alt={`${product.name} by ${product.designer}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-sm leading-tight">
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.designer}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {formatPrice(product.basePriceUSD)}
                        </span>
                        <div className="flex -space-x-1">
                          {product.colorOptions.slice(0, 4).map((c) => (
                            <span
                              key={c.id}
                              className="h-3 w-3 rounded-full border border-border ring-1 ring-background"
                              style={{ backgroundColor: c.hex }}
                              aria-label={c.label}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <span
                        className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                        aria-label="Selected"
                      >
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                    ) : null}
                  </motion.button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {!twinImage ? (
        <div className="border-t border-border/70 bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
          Upload your twin photo first to enable try-on.
        </div>
      ) : null}
    </aside>
  )
}
