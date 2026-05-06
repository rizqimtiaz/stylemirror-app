'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Camera,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { useMirrorStore, useSelectedProduct } from '@/store/useMirrorStore'

const MAX_TWIN_BYTES = 8 * 1024 * 1024 // 8MB

export function DigitalTwinCanvas() {
  const twinImage = useMirrorStore((s) => s.twinImage)
  const setTwinImage = useMirrorStore((s) => s.setTwinImage)
  const status = useMirrorStore((s) => s.status)
  const error = useMirrorStore((s) => s.error)
  const currentRender = useMirrorStore((s) => s.currentRender)
  const product = useSelectedProduct()
  const setError = useMirrorStore((s) => s.setError)

  const onDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        setError(
          rejected[0]?.errors[0]?.message ??
            'That file could not be used. Try a JPG or PNG up to 8MB.',
        )
        return
      }
      const file = accepted[0]
      if (!file) return
      try {
        const dataUrl = await readFileAsDataURL(file)
        setTwinImage(dataUrl)
      } catch {
        setError('Could not read that image. Please try another file.')
      }
    },
    [setTwinImage, setError],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: MAX_TWIN_BYTES,
    multiple: false,
    noClick: !!twinImage,
    noKeyboard: !!twinImage,
  })

  const displayImage = useMemo(() => {
    if (currentRender?.image) return currentRender.image
    return twinImage
  }, [currentRender, twinImage])

  const isProcessing = status === 'processing'

  return (
    <section
      aria-label="Digital Twin canvas"
      className="relative flex h-full min-h-[520px] w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(60,40,90,0.35)]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/70 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-serif text-lg leading-tight">Digital Twin</h2>
            <p className="text-xs text-muted-foreground">
              {product
                ? `Draping ${product.name}`
                : twinImage
                  ? 'Select a piece from the catalog to begin draping.'
                  : 'Upload a front-facing photo to create your twin.'}
            </p>
          </div>
        </div>

        {twinImage ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={open}
              className="gap-1.5"
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTwinImage(null)}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Remove twin photo"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear
            </Button>
          </div>
        ) : null}
      </header>

      <div
        {...getRootProps({
          className: `relative flex-1 grain ${
            !twinImage
              ? 'cursor-pointer'
              : 'cursor-default'
          } bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklch,var(--primary)_8%,transparent),transparent_60%)]`,
        })}
        aria-busy={isProcessing}
      >
        <input {...getInputProps()} aria-label="Upload twin photo" />

        {/* Drop hint while no twin */}
        <AnimatePresence>
          {!twinImage ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
            >
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full border border-dashed transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary text-muted-foreground'
                }`}
              >
                {isDragActive ? (
                  <Upload className="h-7 w-7" aria-hidden />
                ) : (
                  <Camera className="h-7 w-7" aria-hidden />
                )}
              </div>
              <div className="max-w-sm space-y-2">
                <h3 className="font-serif text-2xl text-balance">
                  Create your Digital Twin
                </h3>
                <p className="text-sm text-muted-foreground text-pretty">
                  Drag in a clear front-facing photo where you&apos;re wearing
                  form-fitting clothes. We segment the background and use it as
                  the canvas for every garment.
                </p>
              </div>
              <Button type="button" onClick={open} className="gap-2">
                <Upload className="h-4 w-4" aria-hidden />
                Upload photo
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WEBP · up to 8MB
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Twin / render display */}
        <AnimatePresence mode="wait">
          {displayImage ? (
            <motion.div
              key={displayImage}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center p-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage || '/placeholder.svg'}
                alt={
                  currentRender
                    ? `Try-on render of ${product?.name ?? 'selected garment'}`
                    : 'Your digital twin photo'
                }
                className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_20px_60px_-30px_rgba(60,40,90,0.5)]"
                draggable={false}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Processing overlay */}
        <AnimatePresence>
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/55 backdrop-blur-sm"
              role="status"
              aria-live="polite"
            >
              <div className="shimmer-overlay relative flex items-center gap-3 overflow-hidden rounded-full border border-border bg-card/90 px-5 py-2.5 shadow-lg">
                <Loader2
                  className="h-4 w-4 animate-spin text-primary"
                  aria-hidden
                />
                <span className="text-sm font-medium">
                  Processing texture &amp; geometry
                </span>
              </div>
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                Mapping the {product?.fabricDescription.toLowerCase() ?? 'fabric'}
                {' '}onto your twin. This usually takes 10–30 seconds.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Error toast */}
        <AnimatePresence>
          {error && status === 'error' ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="absolute inset-x-6 bottom-6 rounded-xl border border-destructive/30 bg-card/95 px-4 py-3 text-sm shadow-lg"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Render didn&apos;t complete
                  </p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dismiss"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer meta */}
      {currentRender && product ? (
        <footer className="flex items-center justify-between gap-3 border-t border-border/70 bg-secondary/40 px-6 py-3 text-xs text-muted-foreground">
          <span className="truncate">
            <span className="font-medium text-foreground">{product.name}</span>
            {' · '}
            <span className="font-mono">{product.fabricTextureHash}</span>
          </span>
          <span className="shrink-0">
            Rendered{' '}
            {new Date(currentRender.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </footer>
      ) : null}
    </section>
  )
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('FileReader returned non-string'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Read error'))
    reader.readAsDataURL(file)
  })
}
