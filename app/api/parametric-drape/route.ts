import { generateText } from 'ai'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  DrapeRequestSchema,
  getProductById,
  type Product,
} from '@/lib/style-ontology'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/parametric-drape
 *
 * Combines the user's segmented Digital Twin with a product image and a
 * structured parametric override map to produce an inpainted try-on render
 * that preserves the original fabric texture while altering geometry / hue.
 *
 * The pipeline:
 *   1. Validate request with Zod.
 *   2. Read the product baseImage from /public into a base64 string.
 *   3. Construct a deterministic prompt from the product ontology and the
 *      parametric override map (so the diffusion model receives precise,
 *      structured language rather than free-form chatter).
 *   4. Send a multi-modal generateText() call to a Gemini image model with
 *      both the twin and product images attached.
 *   5. Return the first generated image as a data URL the client can render.
 */
export async function POST(req: Request) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON body.' },
      { status: 400 },
    )
  }

  const parsed = DrapeRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const {
    twinImage,
    productId,
    parametricOverrides,
    colorOverrideId,
    styleCommand,
  } = parsed.data

  const product = getProductById(productId)
  if (!product) {
    return Response.json(
      { error: `Unknown product: ${productId}` },
      { status: 404 },
    )
  }

  // Load the product reference image from /public so the model sees the
  // actual fabric texture rather than a generic guess.
  let productImage: { base64: string; mediaType: string }
  try {
    productImage = await loadPublicImage(product.baseImage)
  } catch (err) {
    console.error('[v0] Failed to load product image', product.baseImage, err)
    return Response.json(
      { error: 'Could not load product reference image.' },
      { status: 500 },
    )
  }

  const twin = parseDataUrl(twinImage)
  if (!twin) {
    return Response.json(
      { error: 'twinImage must be a valid base64 data URL.' },
      { status: 400 },
    )
  }

  const prompt = buildPrompt({
    product,
    parametricOverrides,
    colorOverrideId,
    styleCommand,
  })

  try {
    const result = await generateText({
      model: 'google/gemini-3.1-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              image: `data:${twin.mediaType};base64,${twin.base64}`,
            },
            {
              type: 'image',
              image: `data:${productImage.mediaType};base64,${productImage.base64}`,
            },
          ],
        },
      ],
    })

    const generated = (result.files ?? []).find((f) =>
      f.mediaType?.startsWith('image/'),
    )

    if (!generated) {
      console.warn('[v0] Drape model returned no image', {
        text: result.text,
        finishReason: result.finishReason,
      })
      return Response.json(
        {
          error:
            'The stylist could not generate this look. Try a different command or product.',
          modelText: result.text ?? null,
        },
        { status: 502 },
      )
    }

    const dataUrl = `data:${generated.mediaType};base64,${generated.base64}`

    return Response.json({
      image: dataUrl,
      prompt,
      productId: product.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[v0] Drape generation failed', message)
    return Response.json(
      {
        error:
          'The stylist is temporarily unavailable. Please try again in a moment.',
        detail: message,
      },
      { status: 500 },
    )
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

interface BuildPromptArgs {
  product: Product
  parametricOverrides: Record<string, number>
  colorOverrideId: string | null
  styleCommand: string
}

function buildPrompt({
  product,
  parametricOverrides,
  colorOverrideId,
  styleCommand,
}: BuildPromptArgs): string {
  const parametricPhrases: string[] = []
  for (const opt of product.parametricOptions) {
    const value = parametricOverrides[opt.id] ?? opt.default
    const phrase = opt.describe ? opt.describe(value) : `${opt.label}: ${value.toFixed(2)}`
    parametricPhrases.push(`- ${opt.label}: ${phrase}`)
  }

  const color = product.colorOptions.find((c) => c.id === colorOverrideId)
  const colorClause = color
    ? `Re-color the garment to a precise ${color.label} (${color.hex}) while preserving every detail of the original weave, sheen, and stitching.`
    : `Preserve the original color of the garment exactly as shown in the reference image.`

  const styleClause = styleCommand.trim()
    ? `Additional stylist note from the user: "${styleCommand.trim()}". Apply this only to silhouette and styling — never invent new fabric or change the product identity.`
    : ''

  return [
    `You are StyleMirror, a high-fidelity virtual try-on engine.`,
    `Place the garment from the SECOND image onto the person in the FIRST image as a photorealistic try-on render.`,
    ``,
    `Product: ${product.name} by ${product.designer}.`,
    `Fabric: ${product.fabricDescription}`,
    `Texture token: ${product.fabricTextureHash} — preserve this exact weave, sheen, and pattern from the reference.`,
    ``,
    `Parametric draping (apply precisely):`,
    ...parametricPhrases,
    ``,
    colorClause,
    styleClause,
    ``,
    `Critical constraints:`,
    `- Keep the person's identity, face, hair, body proportions, and pose IDENTICAL to the first image.`,
    `- Keep the original background and lighting of the first image.`,
    `- Do not add accessories, jewelry, or other garments that are not in the reference.`,
    `- Output a single full-body photorealistic try-on image. No text, no watermarks, no collage.`,
  ]
    .filter(Boolean)
    .join('\n')
}

interface ParsedDataUrl {
  mediaType: string
  base64: string
}

function parseDataUrl(value: string): ParsedDataUrl | null {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(value)
  if (!match) return null
  const [, mediaType, base64] = match
  if (!mediaType.startsWith('image/')) return null
  return { mediaType, base64 }
}

async function loadPublicImage(
  publicPath: string,
): Promise<{ base64: string; mediaType: string }> {
  const safe = publicPath.replace(/^\/+/, '')
  const abs = path.join(process.cwd(), 'public', safe)
  const buffer = await readFile(abs)
  const ext = path.extname(safe).toLowerCase()
  const mediaType =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg'
  return { base64: buffer.toString('base64'), mediaType }
}
