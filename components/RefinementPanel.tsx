'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Loader2,
  RefreshCcw,
  Sliders,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  type DrapeResponse,
  getProductById,
} from '@/lib/style-ontology'
import { useMirrorStore, useSelectedProduct } from '@/store/useMirrorStore'

const QUICK_COMMANDS: string[] = [
  'Make the shoulders softer and more relaxed',
  'Cinch slightly at the waist',
  'Show me a slightly cropped version',
  'Make the fabric look more matte',
]

export function RefinementPanel() {
  const product = useSelectedProduct()
  const twinImage = useMirrorStore((s) => s.twinImage)
  const status = useMirrorStore((s) => s.status)
  const parametricOverrides = useMirrorStore((s) => s.parametricOverrides)
  const colorOverrideId = useMirrorStore((s) => s.colorOverrideId)
  const styleCommand = useMirrorStore((s) => s.styleCommand)

  const setParametric = useMirrorStore((s) => s.setParametric)
  const setColor = useMirrorStore((s) => s.setColor)
  const setStyleCommand = useMirrorStore((s) => s.setStyleCommand)
  const resetParametrics = useMirrorStore((s) => s.resetParametrics)
  const beginProcessing = useMirrorStore((s) => s.beginProcessing)
  const setRender = useMirrorStore((s) => s.setRender)
  const setError = useMirrorStore((s) => s.setError)

  const [composer, setComposer] = useState('')

  const isProcessing = status === 'processing'
  const canRender = !!twinImage && !!product && !isProcessing

  const triggerRender = useCallback(async () => {
    const activeProduct = getProductById(
      useMirrorStore.getState().selectedProductId,
    )
    const twin = useMirrorStore.getState().twinImage
    if (!twin || !activeProduct) return

    const overrides = useMirrorStore.getState().parametricOverrides
    const colorId = useMirrorStore.getState().colorOverrideId
    const command = useMirrorStore.getState().styleCommand

    beginProcessing()

    try {
      const res = await fetch('/api/parametric-drape', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          twinImage: twin,
          productId: activeProduct.id,
          parametricOverrides: overrides,
          colorOverrideId: colorId,
          styleCommand: command,
        }),
      })

      const json = (await res.json()) as
        | DrapeResponse
        | { error: string; detail?: string }

      if (!res.ok || !('image' in json)) {
        const message =
          'error' in json
            ? json.error
            : `Render failed (${res.status}).`
        setError(message)
        return
      }

      setRender({
        image: json.image,
        productId: json.productId,
        parametricOverrides: { ...overrides },
        colorOverrideId: colorId,
        styleCommand: command,
        createdAt: Date.now(),
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Network error while contacting the stylist.',
      )
    }
  }, [beginProcessing, setRender, setError])

  const onSubmitCommand = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const trimmed = composer.trim()
      if (trimmed) setStyleCommand(trimmed)
      await triggerRender()
      setComposer('')
    },
    [composer, setStyleCommand, triggerRender],
  )

  return (
    <section
      aria-label="Refinement panel"
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(60,40,90,0.25)]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sliders className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-serif text-lg leading-tight">Refine</h2>
            <p className="text-xs text-muted-foreground">
              {product
                ? 'Parametric controls update only this garment.'
                : 'Pick a piece from the catalog to begin.'}
            </p>
          </div>
        </div>
        {product ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetParametrics}
            disabled={isProcessing}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
            Reset
          </Button>
        ) : null}
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <AnimatePresence mode="wait">
          {!product ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Wand2 className="h-5 w-5" aria-hidden />
              </span>
              <p className="font-serif text-base">No piece selected</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Choose any garment from the Atelier — sliders for sleeve length,
                hem, tailoring and more will appear here.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Product summary */}
              <div className="rounded-2xl border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.baseImage || '/placeholder.svg'}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-sm">
                      {product.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {product.fabricDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* Color options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Colorway
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {product.colorOptions.find((c) => c.id === colorOverrideId)
                      ?.label ?? 'Default'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colorOptions.map((c) => {
                    const active = c.id === colorOverrideId
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        className={`group relative h-9 w-9 rounded-full border transition-transform ${
                          active
                            ? 'border-primary scale-110 ring-2 ring-primary/30 ring-offset-2 ring-offset-card'
                            : 'border-border hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        aria-label={c.label}
                        aria-pressed={active}
                        title={c.label}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Parametric sliders */}
              <div className="space-y-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Parametric draping
                </h3>
                {product.parametricOptions.map((opt) => {
                  const value = parametricOverrides[opt.id] ?? opt.default
                  const phrase = opt.describe
                    ? opt.describe(value)
                    : `${Math.round(value * 100)}%`
                  return (
                    <div key={opt.id} className="space-y-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <label
                          htmlFor={`slider-${opt.id}`}
                          className="text-sm font-medium"
                        >
                          {opt.label}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(value * 100)}%
                        </span>
                      </div>
                      <Slider
                        id={`slider-${opt.id}`}
                        value={[value]}
                        min={opt.min}
                        max={opt.max}
                        step={0.01}
                        onValueChange={(v) => setParametric(opt.id, v[0] ?? opt.default)}
                        disabled={isProcessing}
                        aria-label={opt.label}
                      />
                      <p className="text-xs text-muted-foreground">{phrase}</p>
                    </div>
                  )
                })}
              </div>

              {/* Active style command badge */}
              {styleCommand ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
                    Active stylist note
                  </p>
                  <p className="mt-1 text-foreground">{styleCommand}</p>
                  <button
                    type="button"
                    onClick={() => setStyleCommand('')}
                    className="mt-1.5 text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Clear note
                  </button>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <form
        onSubmit={onSubmitCommand}
        className="space-y-3 border-t border-border/70 bg-secondary/30 px-5 py-4"
      >
        <div className="flex flex-wrap gap-1.5">
          {QUICK_COMMANDS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setComposer(c)}
              disabled={!canRender}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {c}
            </button>
          ))}
        </div>

        <Textarea
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder={
            product
              ? 'Tell the stylist… "Make the sleeves shorter and the silhouette more relaxed"'
              : 'Select a piece to enable styling commands.'
          }
          rows={2}
          disabled={!product || isProcessing}
          className="resize-none bg-card"
          aria-label="Style command"
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            {twinImage
              ? product
                ? 'Sliders + command will be sent together.'
                : 'Pick a piece from the Atelier.'
              : 'Upload your twin photo to enable rendering.'}
          </p>
          <Button
            type="submit"
            disabled={!canRender}
            className="gap-2"
            size="sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Draping
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                Render look
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  )
}
