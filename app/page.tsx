import { Sparkles } from 'lucide-react'
import { DigitalTwinCanvas } from '@/components/DigitalTwinCanvas'
import { ProductCatalog } from '@/components/ProductCatalog'
import { RefinementPanel } from '@/components/RefinementPanel'

export default function Page() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Sparkles className="h-4 w-4" aria-hidden />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </span>
            <div className="leading-tight">
              <p className="font-serif text-lg">StyleMirror</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Adaptive Digital Wardrobe
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#twin">
              Twin
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#atelier"
            >
              Atelier
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#refine"
            >
              Refine
            </a>
          </nav>

          <a
            href="#twin"
            className="hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 sm:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            Studio session
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-6 pb-6 pt-10">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
              Studio · Session 01
            </p>
            <h1 className="font-serif text-4xl leading-[1.05] text-balance md:text-5xl">
              The fitting room, reimagined as a parametric studio.
            </h1>
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              Upload a single front-facing photo to spin up your Digital Twin.
              Drape any piece from the Atelier and refine it with sliders or
              plain language — the original fabric texture is always preserved.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <Stat label="Twin fidelity" value="High" />
            <Stat label="Texture preservation" value="Locked" />
            <Stat label="Latency" value="10–30s" />
          </div>
        </div>
      </section>

      <section
        id="twin"
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 pb-16 lg:grid-cols-[300px_minmax(0,1fr)_340px]"
      >
        <div id="atelier" className="order-2 lg:order-1">
          <ProductCatalog />
        </div>
        <div className="order-1 lg:order-2">
          <DigitalTwinCanvas />
        </div>
        <div id="refine" className="order-3">
          <RefinementPanel />
        </div>
      </section>

      <footer className="border-t border-border/70 bg-secondary/40">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            StyleMirror · Parametric draping powered by multi-modal diffusion.
          </p>
          <p className="font-mono">v0.1 · ontology rev 001</p>
        </div>
      </footer>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-base text-foreground">{value}</p>
    </div>
  )
}
