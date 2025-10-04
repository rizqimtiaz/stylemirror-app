# StyleMirror: The Adaptive Digital Wardrobe

The "fitting room" is still broken. Consumers buy multiple sizes and return most of them, creating a logistics nightmare for brands and an environmental disaster. Existing AI solutions often hallucinate (making a dress look like an unrecognizable blob) or lose the specific pattern details and textures of the actual product.

**StyleMirror** bridges this market gap as a high-fidelity, parametrically adaptive AI stylist that truly knows your body.

## The Solution

StyleMirror is an application that creates a high-fidelity **Digital Twin** of the user and uses text-guided diffusion inpainting to parametrically drape clothing. It goes beyond simple 2D overlays by understanding fabric geometry, preserving original textures, and allowing real-time refinement through natural language.

## Key Features

- **Product Ontology Mapping**: Instead of generating a generic "dress," StyleMirror maintains a strict ontology (database) of real products, ensuring the exact garment you see is what you are trying on.
- **Parametric Draping (The Core Complexity)**: The defining feature of StyleMirror. Users can interact with the AI using plain language:
  - *"Make this blazer slightly tailored."*
  - *"Show me this dress, but as a mini-length."*
  - *"Tuck in the shirt."*
  
<!-- metadata: y7y71mciwh -->
<!-- metadata: ljdxtt2zh1 -->
<!-- metadata: 7ectbq9qxm -->
<!-- metadata: jmj8resexe -->
<!-- metadata: xd75owrrys -->
  The AI dynamically alters the garment's geometry on the segmented twin while strictly preserving the fabric texture and original pattern of the actual product.

## Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling & UI**: Tailwind CSS v4, Radix UI Primitives, Framer Motion
- **State Management**: Zustand
- **AI Integration**: Vercel AI SDK (`ai`, `@ai-sdk/react`) for streaming natural language refinements

## Architecture Overview

The application interface is built around three core pillars:
1. **The Twin (`DigitalTwinCanvas`)**: The interactive viewport visualizing your digital twin.
2. **The Atelier (`ProductCatalog`)**: The digital storefront to select garments mapped to our product ontology.
3. **The Refinement (`RefinementPanel`)**: The AI interface where users control parametric draping via sliders or natural text prompts.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- `npm`, `yarn`, or `pnpm`

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd stylemirror
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
