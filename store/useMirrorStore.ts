'use client'

import { create } from 'zustand'
import { getProductById, PRODUCTS } from '@/lib/style-ontology'

export type RenderStatus = 'idle' | 'processing' | 'ready' | 'error'

export interface MirrorRender {
  /** Data URL for the generated try-on image. */
  image: string
  productId: string
  /** Snapshot of overrides used to generate this render. */
  parametricOverrides: Record<string, number>
  colorOverrideId: string | null
  styleCommand: string
  createdAt: number
}

interface MirrorState {
  /** Data URL of the user's uploaded twin photo. */
  twinImage: string | null
  selectedProductId: string | null
  parametricOverrides: Record<string, number>
  colorOverrideId: string | null
  styleCommand: string
  status: RenderStatus
  error: string | null
  currentRender: MirrorRender | null
  history: MirrorRender[]

  setTwinImage: (image: string | null) => void
  selectProduct: (productId: string | null) => void
  setParametric: (id: string, value: number) => void
  setColor: (colorId: string | null) => void
  setStyleCommand: (command: string) => void
  resetParametrics: () => void
  beginProcessing: () => void
  setRender: (render: MirrorRender) => void
  setError: (message: string | null) => void
  clearRender: () => void
}

function buildDefaultParametrics(productId: string | null) {
  const product = getProductById(productId)
  if (!product) return {}
  const next: Record<string, number> = {}
  for (const opt of product.parametricOptions) {
    next[opt.id] = opt.default
  }
  return next
}

export const useMirrorStore = create<MirrorState>((set, get) => ({
  twinImage: null,
  selectedProductId: null,
  parametricOverrides: {},
  colorOverrideId: null,
  styleCommand: '',
  status: 'idle',
  error: null,
  currentRender: null,
  history: [],

  setTwinImage: (image) =>
    set({
      twinImage: image,
      // Reset render context when swapping twin
      currentRender: null,
      status: 'idle',
      error: null,
    }),

  selectProduct: (productId) => {
    const product = getProductById(productId)
    set({
      selectedProductId: productId,
      parametricOverrides: buildDefaultParametrics(productId),
      colorOverrideId: product?.colorOptions[0]?.id ?? null,
      styleCommand: '',
      currentRender: null,
      status: 'idle',
      error: null,
    })
  },

  setParametric: (id, value) => {
    const clamped = Math.min(1, Math.max(0, value))
    set((state) => ({
      parametricOverrides: { ...state.parametricOverrides, [id]: clamped },
    }))
  },

  setColor: (colorId) => set({ colorOverrideId: colorId }),

  setStyleCommand: (command) => set({ styleCommand: command }),

  resetParametrics: () => {
    const { selectedProductId } = get()
    const product = getProductById(selectedProductId)
    set({
      parametricOverrides: buildDefaultParametrics(selectedProductId),
      colorOverrideId: product?.colorOptions[0]?.id ?? null,
      styleCommand: '',
    })
  },

  beginProcessing: () => set({ status: 'processing', error: null }),

  setRender: (render) =>
    set((state) => ({
      currentRender: render,
      status: 'ready',
      error: null,
      history: [render, ...state.history].slice(0, 12),
    })),

  setError: (message) =>
    set({ status: message ? 'error' : 'idle', error: message }),

  clearRender: () =>
    set({ currentRender: null, status: 'idle', error: null }),
}))

/** Convenience selector that returns the active product. */
export function useSelectedProduct() {
  return useMirrorStore((s) => getProductById(s.selectedProductId))
}

/** Cached list, exported for convenience to avoid prop drilling. */
export const ALL_PRODUCTS = PRODUCTS
