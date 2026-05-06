import { z } from 'zod'

/**
 * StyleMirror Product Ontology
 *
 * Each product defines a deterministic schema for parametric refinement.
 * The AI pipeline reads these fields to constrain inpainting and color
 * shifting so the original fabric texture is preserved while geometry
 * and hue can be parametrically altered on the user's Digital Twin.
 */

export const ParametricOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  /** Normalised slider range, always 0..1 in the UI. */
  min: z.number().min(0).max(1),
  max: z.number().min(0).max(1),
  /** Default value, in the same normalised space. */
  default: z.number().min(0).max(1),
  /** Human readable mapping from value -> phrase, used to compose the AI prompt. */
  describe: z
    .function()
    .args(z.number())
    .returns(z.string())
    .optional(),
})

export type ParametricOption = z.infer<typeof ParametricOptionSchema> & {
  describe?: (v: number) => string
}

export const ColorOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Hex color used both for the swatch chip and the AI prompt. */
  hex: z.string().regex(/^#([0-9a-fA-F]{6})$/),
})

export type ColorOption = z.infer<typeof ColorOptionSchema>

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  designer: z.string(),
  category: z.enum([
    'top',
    'dress',
    'outerwear',
    'bottom',
    'knitwear',
    'shirt',
  ]),
  baseImage: z.string(),
  /** Stable token identifying the unique fabric texture for the AI pipeline. */
  fabricTextureHash: z.string(),
  fabricDescription: z.string(),
  basePriceUSD: z.number().int().nonnegative(),
  parametricOptions: z.array(ParametricOptionSchema),
  colorOptions: z.array(ColorOptionSchema),
})

export type Product = z.infer<typeof ProductSchema> & {
  parametricOptions: ParametricOption[]
}

/* ------------------------------------------------------------------ */
/* Reusable parametric primitives                                      */
/* ------------------------------------------------------------------ */

const sleeveLength: ParametricOption = {
  id: 'sleeve-length',
  label: 'Sleeve Length',
  description: 'From sleeveless to extended cuffs.',
  min: 0,
  max: 1,
  default: 0.65,
  describe: (v) => {
    if (v < 0.15) return 'sleeveless, clean shoulder seam'
    if (v < 0.35) return 'cap sleeves, just covering the shoulder'
    if (v < 0.55) return 'short sleeves, ending mid-bicep'
    if (v < 0.75) return 'three-quarter sleeves ending below the elbow'
    if (v < 0.92) return 'long sleeves ending at the wrist'
    return 'extra long sleeves with a slight cuff break over the hand'
  },
}

const hemLength: ParametricOption = {
  id: 'hem-length',
  label: 'Hem Length',
  description: 'From mini to floor sweeping.',
  min: 0,
  max: 1,
  default: 0.55,
  describe: (v) => {
    if (v < 0.15) return 'mini length, mid-thigh'
    if (v < 0.35) return 'short length, just above the knee'
    if (v < 0.55) return 'knee length'
    if (v < 0.75) return 'midi length, ending mid-calf'
    if (v < 0.92) return 'maxi length, ending at the ankle'
    return 'floor length with a soft pool'
  },
}

const tailoring: ParametricOption = {
  id: 'tailoring',
  label: 'Tailoring',
  description: 'From relaxed drape to slim tailored.',
  min: 0,
  max: 1,
  default: 0.5,
  describe: (v) => {
    if (v < 0.2) return 'relaxed oversized fit with generous ease'
    if (v < 0.45) return 'softly draped regular fit'
    if (v < 0.65) return 'clean tailored silhouette'
    if (v < 0.85) return 'slim tailored fit, close to the body'
    return 'sharply tailored, body-skimming silhouette'
  },
}

const lapelWidth: ParametricOption = {
  id: 'lapel-width',
  label: 'Lapel Width',
  description: 'From slim notch to wide peak.',
  min: 0,
  max: 1,
  default: 0.5,
  describe: (v) => {
    if (v < 0.3) return 'slim notch lapels'
    if (v < 0.6) return 'classic medium notch lapels'
    if (v < 0.85) return 'wider notch lapels'
    return 'wide peak lapels'
  },
}

const neckline: ParametricOption = {
  id: 'neckline',
  label: 'Neckline',
  description: 'From high to plunging.',
  min: 0,
  max: 1,
  default: 0.4,
  describe: (v) => {
    if (v < 0.2) return 'high mock neckline'
    if (v < 0.45) return 'classic crew neckline'
    if (v < 0.7) return 'soft V-neckline'
    if (v < 0.9) return 'deep V-neckline'
    return 'plunging neckline'
  },
}

const riseHeight: ParametricOption = {
  id: 'rise',
  label: 'Rise',
  description: 'From low to high waist.',
  min: 0,
  max: 1,
  default: 0.75,
  describe: (v) => {
    if (v < 0.3) return 'low rise sitting on the hips'
    if (v < 0.6) return 'mid rise sitting at the natural waist'
    if (v < 0.85) return 'high rise above the navel'
    return 'extra high rise cinched at the smallest part of the waist'
  },
}

const legWidth: ParametricOption = {
  id: 'leg-width',
  label: 'Leg Width',
  description: 'From skinny to wide flowing.',
  min: 0,
  max: 1,
  default: 0.7,
  describe: (v) => {
    if (v < 0.2) return 'skinny tapered leg'
    if (v < 0.45) return 'straight leg'
    if (v < 0.7) return 'relaxed straight leg'
    if (v < 0.9) return 'wide leg with fluid drape'
    return 'extra wide palazzo leg'
  },
}

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export const PRODUCTS: Product[] = [
  {
    id: 'charcoal-blazer',
    name: 'Atelier Tailored Blazer',
    designer: 'Maison Verre',
    category: 'outerwear',
    baseImage: '/products/charcoal-blazer.jpg',
    fabricTextureHash: 'tex_wool_herringbone_charcoal_001',
    fabricDescription:
      'Italian wool with a fine herringbone weave and a soft matte finish.',
    basePriceUSD: 1280,
    parametricOptions: [tailoring, sleeveLength, lapelWidth],
    colorOptions: [
      { id: 'charcoal', label: 'Charcoal', hex: '#2C2C30' },
      { id: 'midnight', label: 'Midnight Navy', hex: '#1B2238' },
      { id: 'sand', label: 'Warm Sand', hex: '#C9B79C' },
      { id: 'amethyst', label: 'Amethyst', hex: '#A855F7' },
    ],
  },
  {
    id: 'amethyst-silk-dress',
    name: 'Bias Slip Dress',
    designer: 'Studio Lune',
    category: 'dress',
    baseImage: '/products/amethyst-silk-dress.jpg',
    fabricTextureHash: 'tex_silk_satin_amethyst_001',
    fabricDescription:
      'Lustrous silk satin with a fluid bias-cut drape and subtle sheen.',
    basePriceUSD: 940,
    parametricOptions: [hemLength, neckline, tailoring],
    colorOptions: [
      { id: 'amethyst', label: 'Amethyst', hex: '#A855F7' },
      { id: 'champagne', label: 'Champagne', hex: '#E8D8B8' },
      { id: 'noir', label: 'Noir', hex: '#0F0F12' },
      { id: 'rose', label: 'Dusty Rose', hex: '#C68A8A' },
    ],
  },
  {
    id: 'ivory-silk-shirt',
    name: 'Heirloom Silk Shirt',
    designer: 'Atelier Nord',
    category: 'shirt',
    baseImage: '/products/ivory-silk-shirt.jpg',
    fabricTextureHash: 'tex_silk_charmeuse_ivory_001',
    fabricDescription:
      'Heavyweight silk charmeuse with mother-of-pearl buttons and a soft hand.',
    basePriceUSD: 520,
    parametricOptions: [sleeveLength, tailoring, neckline],
    colorOptions: [
      { id: 'ivory', label: 'Ivory', hex: '#F4ECDC' },
      { id: 'noir', label: 'Noir', hex: '#0F0F12' },
      { id: 'sky', label: 'Pale Sky', hex: '#BCD0DC' },
      { id: 'amethyst', label: 'Amethyst', hex: '#A855F7' },
    ],
  },
  {
    id: 'black-wool-trousers',
    name: 'Wide-Leg Wool Trouser',
    designer: 'Maison Verre',
    category: 'bottom',
    baseImage: '/products/black-wool-trousers.jpg',
    fabricTextureHash: 'tex_wool_crepe_noir_001',
    fabricDescription:
      'Fluid wool crepe with a sharp pressed crease and a softly weighted drape.',
    basePriceUSD: 680,
    parametricOptions: [legWidth, riseHeight, hemLength],
    colorOptions: [
      { id: 'noir', label: 'Noir', hex: '#0F0F12' },
      { id: 'taupe', label: 'Taupe', hex: '#8B7E72' },
      { id: 'cream', label: 'Cream', hex: '#EFE4CD' },
      { id: 'amethyst', label: 'Amethyst', hex: '#A855F7' },
    ],
  },
  {
    id: 'camel-trench-coat',
    name: 'Promenade Trench',
    designer: 'House of Atrium',
    category: 'outerwear',
    baseImage: '/products/camel-trench-coat.jpg',
    fabricTextureHash: 'tex_gabardine_camel_001',
    fabricDescription:
      'Cotton gabardine with a tight twill weave, rain-shed finish, and tonal stitching.',
    basePriceUSD: 1640,
    parametricOptions: [hemLength, sleeveLength, tailoring],
    colorOptions: [
      { id: 'camel', label: 'Camel', hex: '#B68D5C' },
      { id: 'stone', label: 'Stone', hex: '#C4B79C' },
      { id: 'noir', label: 'Noir', hex: '#0F0F12' },
      { id: 'olive', label: 'Olive', hex: '#6B6A3C' },
    ],
  },
  {
    id: 'oat-cashmere-sweater',
    name: 'Cocoon Cashmere Crew',
    designer: 'Studio Lune',
    category: 'knitwear',
    baseImage: '/products/oat-cashmere-sweater.jpg',
    fabricTextureHash: 'tex_cashmere_knit_oat_001',
    fabricDescription:
      'Mongolian cashmere with a fine 12-gauge knit and ribbed cuffs.',
    basePriceUSD: 760,
    parametricOptions: [sleeveLength, tailoring, neckline],
    colorOptions: [
      { id: 'oat', label: 'Oat', hex: '#D9C8AB' },
      { id: 'noir', label: 'Noir', hex: '#0F0F12' },
      { id: 'moss', label: 'Moss', hex: '#5C6B4A' },
      { id: 'amethyst', label: 'Amethyst', hex: '#A855F7' },
    ],
  },
]

export function getProductById(id: string | null): Product | null {
  if (!id) return null
  return PRODUCTS.find((p) => p.id === id) ?? null
}

/* ------------------------------------------------------------------ */
/* API request schema                                                  */
/* ------------------------------------------------------------------ */

export const DrapeRequestSchema = z.object({
  twinImage: z
    .string()
    .min(32)
    .refine((s) => s.startsWith('data:image/'), {
      message: 'twinImage must be a data URL',
    }),
  productId: z.string().min(1),
  parametricOverrides: z.record(z.string(), z.number().min(0).max(1)),
  colorOverrideId: z.string().nullable(),
  styleCommand: z.string().max(500).default(''),
})

export type DrapeRequest = z.infer<typeof DrapeRequestSchema>

export const DrapeResponseSchema = z.object({
  image: z.string(),
  prompt: z.string(),
  productId: z.string(),
})

export type DrapeResponse = z.infer<typeof DrapeResponseSchema>
