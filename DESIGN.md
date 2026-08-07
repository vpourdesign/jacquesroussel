# Design System: Équipe Jacques-Roussel

> Site immobilier statique (build.mjs Node + ingestion Centris quotidienne)
> RE/MAX CRYSTAL · Rive-Nord ouest · Marilyn Jacques + Alexandre Roussel
> Tagline : « Vos courtiers d'expérience sur la Rive-Nord »

---

## 1. Visual Theme & Atmosphere

A warm, editorial-luxe interface that feels like a hand-finished print magazine — generous breathing room, asymmetric column rhythm, deliberate pauses between sections. Cream paper backgrounds catch warm light; slate blue punctuates with confident restraint; aged bronze appears rarely, the way embossed foil shows up on a premium card. The atmosphere is **trustworthy and quietly distinctive** — not analytical-cold, not aspirational-glossy. Movement is **fluid and weighty**, never twitchy: Lenis-smooth scroll, spring-physics on hover, character-staggered headlines that settle rather than snap.

**Taste calibration:**
- **Density:** 4/10 — Daily-App Balanced, leaning Gallery-Airy
- **Variance:** 7/10 — Offset Asymmetric. Centered hero is banned; split-views and editorial alternation dominate
- **Motion:** 7/10 — Fluid CSS with cinematic accents (Lenis + GSAP ScrollTrigger + Splitting char-stagger)
- **Creativity:** 8/10 — Inline image typography in hero headline (small contextual photos of property façades or local landmarks sit between words at type-height)

---

## 2. Color Palette & Roles

Single accent (Slate Blue). All neutrals share a warm undertone — no cool grey contamination. All values declared in `oklch()` for perceptual uniformity; hex fallbacks provided.

**Surfaces (warm neutrals):**
- **Cream Paper** (`oklch(96% 0.012 80)` / `#F7F2EA`) — Primary page background, dominant surface
- **Warm Vellum** (`oklch(98% 0.008 80)` / `#FBF8F2`) — Card fills, elevated panels, alternating section bands
- **Hairline Mist** (`oklch(90% 0.006 80)` / `#E8E2D7`) — 1px structural lines, table dividers, input underlines

**Ink hierarchy:**
- **Charcoal Ink** (`oklch(20% 0.005 250)` / `#1A1B1D`) — H1, H2, primary body. Never pure black
- **Stone** (`oklch(48% 0.008 250)` / `#6F6F73`) — Secondary text, metadata, "beds / baths / sqft" labels
- **Mist** (`oklch(68% 0.006 250)` / `#A6A6A8`) — Captions, breadcrumbs, tertiary timestamps

**The single accent:**
- **Slate Blue** (`oklch(37.3% 0.06 258)` / `#2c4160`) — Primary CTAs, active nav state, focus rings, footer fill, map pin. Saturation chroma 0.06 (deeply restrained, no neon)

**Supporting warm tones (used as ink, not as accent):**
- **Midnight Navy** (`oklch(22% 0.04 240)` / `#13202E`) — Tactile "rent villa" pill buttons (mockup-faithful), deep CTA variant. Used only on photo overlays where slate blue would lose contrast
- **Sand Tan** (`oklch(78% 0.04 75)` / `#CDB89A`) — Eyebrow uppercase labels, decorative section markers, subtle separators. Never a background fill at full strength
- **Aged Bronze** (`oklch(62% 0.08 70)` / `#B58A4F`) — Reserved exclusively for **price figures** and **"By the Numbers" stats**. Behaves like embossed foil — rare, prestigious, never decorative

**Imagery treatment:**
- All photographs receive a `mix-blend-mode: multiply` Sand Tan layer at 8% opacity, plus `filter: saturate(0.92) brightness(1.02)` for chromatic cohesion across listings shot in different lighting

**Strictly banned:**
- Pure `#000000` (use Charcoal Ink)
- Pure `#FFFFFF` (use Warm Vellum or Cream Paper)
- Any saturation > 0.10 chroma in any color
- Purple, magenta, neon blue, electric cyan — the "AI tell" palette
- Gradient text on headlines
- Outer-glow shadows

---

## 3. Typography Rules

Strict pairing: one editorial serif for display, one neutral sans for body. Loaded via Bunny Fonts (privacy-friendly Google Fonts mirror) — no Google CDN tracking.

- **Display:** **Fraunces** (variable, with `opsz` optical sizing) — distinctive modern serif with soft humanist warmth. `font-variation-settings: "opsz" 144, "SOFT" 50, "WONK" 0` on sizes ≥ 56px. Track tight via `letter-spacing: -0.03em`. Weight 400 — the size carries the weight; never use 700+ on display
- **Body:** **Geist** (variable sans) — neutral, premium, character without shouting. 16px base, line-height 1.7, max-width 65ch enforced
- **Mono:** **Geist Mono** — used only for MLS numbers, lat/lon coordinates, property reference codes. Never for prices (prices use Fraunces display for editorial weight)

**Hierarchy (fluid clamp throughout — no fixed px at breakpoints):**
- **H1:** `clamp(3rem, 6vw, 5.5rem)` · line-height 1.05 · weight 400 · tracking -0.03em
- **H2:** `clamp(2rem, 3.5vw, 3.25rem)` · line-height 1.1 · weight 400 · tracking -0.02em
- **H3:** `clamp(1.375rem, 2vw, 1.75rem)` · line-height 1.2 · weight 500
- **Body:** `clamp(1rem, 1.05vw, 1.0625rem)` · line-height 1.7 · weight 400
- **Eyebrow:** 12px (mobile) → 13px (desktop) · uppercase · `letter-spacing: 0.18em` · weight 500 · Sand Tan color
- **Metric numbers:** `clamp(2.5rem, 5vw, 4.5rem)` · Fraunces 400 · `font-variant-numeric: tabular-nums`

**Hierarchy is driven by SIZE + COLOR, never by uppercase or weight alone** (eyebrows are the only uppercase element on the entire site).

**Banned:**
- Inter (the universal AI-tell sans)
- Generic serifs: Times New Roman, Georgia, Garamond, Palatino, Playfair Display
- All-caps headlines beyond eyebrows
- Mixing the H scale with arbitrary in-between sizes — stick to the ladder
- `font-weight: 900` anywhere

---

## 4. Hero Section Direction

The hero is a **full-viewport (100dvh) video plate** — `REMAX_JR_SEP25_EDIT1.mp4`, autoplay muted loop playsinline, `object-fit: cover`. Over it: a bottom-left aligned typographic stack with the signature **inline image typography** treatment.

**Inline image technique (the signature move):**
The H1 reads « Vos courtiers d'expérience sur la Rive-Nord. » Two words are interrupted by tiny inline images sitting at type-height: a small rounded thumbnail of a Saint-Eustache façade replaces a connecting space mid-headline (between "expérience" and "sur"), and a thin landscape strip of the lac des Deux Montagnes sits between "Rive" and "Nord" (replacing the hyphen). These images are `aspect-ratio: 1/1` (façade) and `aspect-ratio: 4/1` (landscape), `border-radius: 6px`, `vertical-align: -0.15em`, `object-fit: cover`. They act as visual punctuation, not decoration. On mobile (< 768px), inline images stack below the headline as a small horizontal triptych.

**Stack composition (bottom-left, 8% inset):**
1. Eyebrow Sand Tan: « RE/MAX CRYSTAL · Rive-Nord »
2. H1 Fraunces Cream Paper with inline images, Splitting.js char-stagger entrance (delay 25ms/char, ease back.out 1.2)
3. Sub-line Cream Paper at 0.85 opacity: « Marilyn Jacques · Alexandre Roussel »
4. **Single primary CTA** pill Midnight Navy with Cream text: « Voir nos propriétés ». No secondary CTA. No "Évaluation gratuite" duo — that lives in the nav, not duplicated here

**Banned in hero:**
- Centered text layout (variance is 7 — center is banned)
- Bouncing chevron / scroll-arrow / "Scroll to explore" filler
- Overlapping text on top of other text
- Two side-by-side CTAs
- Captions or tag labels floating over the video
- Vignette overlays darker than `oklch(20% 0.005 250 / 0.35)` (must preserve video tonality)

---

## 5. Component Stylings

**Buttons — primary pill:**
- Shape: `border-radius: 999px` · padding `0.95rem 1.7rem`
- Fill: Midnight Navy (on photo backgrounds) or Slate Blue (on Cream Paper)
- Text: Cream Paper · Geist 500 · `letter-spacing: 0.01em`
- Hover: Motion One spring (stiffness 320, damping 22) — `transform: scale(1.02)` + shadow `0 6px 20px oklch(30% 0.045 200 / 0.18)`
- Active: tactile push `transform: scale(0.98) translateY(1px)`
- Focus-visible: `outline: 2px solid` Sand Tan, `outline-offset: 3px`
- **Banned:** outer glow, gradient fill, uppercase text, all-caps labels

**Buttons — secondary ghost:**
- Border 1px Charcoal Ink at 35% opacity · same pill radius
- Hover: fill transitions to Warm Vellum, border opacity → 65%
- Used for "Read more", "Voir l'historique", filter pills

**Cards — property card:**
- `border-radius: 14px` · background Warm Vellum
- Layered shadow (slate-blue-tinted, never neutral):
  ```css
  box-shadow:
    0 1px 2px oklch(30% 0.045 200 / 0.06),
    0 8px 24px oklch(30% 0.045 200 / 0.08),
    0 24px 60px oklch(30% 0.045 200 / 0.05);
  ```
- Internal image `aspect-ratio: 3/2` · `object-fit: cover` · warm matte filter applied
- Hover: card lifts 4px (`translateY(-4px)`) + shadow intensifies (bronze tint added at low opacity)
- Cards only used when elevation communicates hierarchy. In feature-rich sections (amenities, services), use **border-top hairline dividers** instead — never default to card-everything

**Cards — broker contact (fiche propriété):**
- Same radius and shadow recipe
- Photo: 64px circle, warm matte
- Star rating: Aged Bronze stars (filled) + Hairline Mist outline (empty)

**Inputs:**
- Label above (Eyebrow Sand Tan style)
- Field: borderless except `border-bottom: 1px solid` Hairline Mist
- Focus: bottom border transitions to Slate Blue, 2px
- Helper text below: Mist 13px
- Error text: replaces helper, color Slate Blue at 0.85 opacity (no red — preserves palette discipline)

**Toggle pill (Photos / Carte) — the signature property-page control:**
- Container: pill Warm Vellum, padding 4px, shadow subtle
- Active segment: Midnight Navy fill, Cream text
- Inactive: transparent, Stone text
- Slide transition: 240ms `cubic-bezier(0.16, 1, 0.3, 1)` on the active background pill

**Loading states:**
- Skeletal shimmer matching exact layout dimensions
- Shimmer: Warm Vellum → Cream Paper → Warm Vellum gradient sweep, 1600ms
- **Never** circular spinners or "Loading…" text

**Empty states (no listings in a city):**
- Composed illustration: a hairline-drawn map silhouette of the city + Eyebrow « Aucune inscription active actuellement » + CTA secondary « Recevoir une alerte »
- **Never** « No data » plain text

**Iconography:**
- Lucide icons, stroke-width 1.5, `currentColor: Charcoal Ink`
- Amenity icons (pool, garage, terrasse) sit at 20px in 3-col grid
- No filled icons. No emoji. Ever.

---

## 6. Layout Principles

**Grid-first architecture:**
- CSS Grid with named areas for editorial pages (about, ville, blog)
- `subgrid` for nested alignment (broker bio columns, floor plan pairs)
- Container queries (`@container`) on cards and amenities grids — components respond to their container, not just viewport
- No `calc(33% - margin)` flex hacks

**Asymmetric flow:**
- Homepage sections alternate Cream Paper ↔ Warm Vellum bands
- Image-text editorial sections: 7:5 column split (not 50/50)
- "By the Numbers" strip: 4 columns with intentionally unequal vertical alignment (last one offset down 24px for editorial tension)
- **Centered hero is BANNED** — variance 7 enforces split or left-aligned

**Property detail page — split-view sticky:**
- Desktop ≥ 1024px: CSS Grid 2 columns 1fr 1fr
- Left column: `position: sticky; top: 0; height: 100dvh; overflow: hidden`
- Right column: natural flow, scrolls past the sticky
- Mobile < 1024px: collapse to single column, media block first, then info block; sticky becomes a fixed bottom bar with the two key CTAs
- **`min-h-[100dvh]` everywhere** — never `100vh` (iOS Safari kills it)

**Spacing scale (clamp-based fluid tokens):**
- `--space-1`: `clamp(0.25rem, 0.5vw, 0.5rem)`
- `--space-2`: `clamp(0.5rem, 1vw, 0.75rem)`
- `--space-3`: `clamp(0.75rem, 1.5vw, 1rem)`
- `--space-4`: `clamp(1rem, 2vw, 1.5rem)`
- `--space-6`: `clamp(1.5rem, 3vw, 2.5rem)`
- `--space-8`: `clamp(2rem, 4vw, 3.5rem)`
- `--space-12`: `clamp(3rem, 6vw, 5rem)`
- `--space-16`: `clamp(4rem, 8vw, 7rem)` — major section breathing room

**Containment:**
- Max-width 1400px centered for nav, hero text, content sections
- Full-bleed allowed for hero video, testimonial backgrounds, map pages
- Logical properties throughout: `margin-inline`, `padding-block`, never directional

**Banned layouts:**
- Three equal cards horizontally (the "feature row" AI cliché) — replace with 2-col zig-zag or horizontal scroll on overflow
- Overlapping absolute-positioned elements
- Horizontal scroll at any viewport (except intentional carousels with snap)
- Sidebars on mobile

---

## 7. Responsive Rules

- **Single column collapse < 768px** — every multi-column layout flattens. No exceptions
- **Body text minimum:** `1rem` (16px) — never below
- **Touch targets:** all interactive ≥ 44 × 44px
- **Hero inline images:** on mobile, stack as a 3-item horizontal strip below the H1 (preserves the inline concept while respecting line breaks)
- **Navigation:** desktop horizontal nav → mobile drawer (slide from right, full-height, Warm Vellum fill, Lenis paused while open)
- **Vertical section gaps:** scale via `clamp(3rem, 8vw, 6rem)`
- **Property page split:** stacks vertically on mobile, sticky becomes fixed bottom action bar (« Carte » + « Contact » duo)
- **Tables (room dimensions):** transform to definition-list pairs on mobile, never horizontal-scroll a table

---

## 8. Motion & Interaction

**Engine stack (CDN-loaded):**
- **Lenis** — global smooth scroll with default inertia
- **GSAP + ScrollTrigger** — section reveals, pinning, scrub animations
- **Splitting.js** — char/word splitting on H1 entrances
- **Motion One** — hover micro-interactions on CTAs, cards

**Easing curves (only these — no `ease-in-out` defaults):**
- Primary reveal: `cubic-bezier(0.16, 1, 0.3, 1)` (the spring overshoot curve)
- GSAP equivalent: `power3.out`
- Settle (hero H1 chars): `back.out(1.2)` for micro-overshoot
- Spring physics on hover: stiffness 320, damping 22

**Reveal recipe (every major section):**
```js
gsap.from(target, {
  y: 40,
  opacity: 0,
  duration: 1.1,
  ease: 'power3.out',
  stagger: 0.08,
  scrollTrigger: { trigger: section, start: 'top 80%' }
});
```

**Perpetual micro-loops (subtle, never distracting):**
- Hero scroll indicator (single hairline vertical, 24px height): infinite Motion One float ±3px, 2.4s
- "Live" badge on active listings: gentle opacity pulse 0.7 → 1, 1.8s
- Map pin shadow on property card: subtle breathing scale 1 → 1.04, 3s

**Performance non-negotiables:**
- Animate ONLY `transform` and `opacity`
- `will-change: transform` only on elements actively animating (removed after)
- SVG `feTurbulence` noise sits on a fixed pseudo-element with `pointer-events: none`
- Lenis disabled inside the lightbox and inside the drawer nav
- Stagger lists — never animate siblings in unison

**Banned motion:**
- Linear easing
- `transition: all`
- Animating `width`, `height`, `top`, `left`, `margin`
- Bouncing arrows / scroll cues
- Page-loader spinners
- Anything that crosses 600ms duration for a hover state

---

## 9. Anti-Patterns (Banned)

These appear in build-time linting comments inside `build.mjs` to keep future edits aligned:

- ❌ Emojis anywhere in copy, UI, or icons (this DESIGN.md is the only exception)
- ❌ Inter font — Geist replaces it
- ❌ Generic serifs (Times, Georgia, Garamond, Playfair) — Fraunces only
- ❌ Pure `#000000` and pure `#FFFFFF`
- ❌ Neon glows, outer-glow shadows, AI-purple accents
- ❌ Saturation > 0.10 chroma on any element
- ❌ Gradient text on headlines
- ❌ Centered hero layout
- ❌ Three equal cards in a row (the feature-row cliché)
- ❌ Overlapping text/image elements outside the controlled inline-image hero technique
- ❌ Fake metrics, invented stats, or `SYSTEM // 2026`-style typography
- ❌ Generic placeholder names (John Doe, Acme, Nexus, Jane Smith). When real names aren't available, use `[Nom du client]` or pull from real testimonials
- ❌ AI copy clichés: « Elevate », « Seamless », « Unleash », « Next-Gen », « Game-changing », « Revolutionize »
- ❌ Filler UI text: « Scroll to explore », « Swipe down », bouncing chevrons
- ❌ Broken Unsplash links — use `picsum.photos/seed/{mls}/800/600` as deterministic fallback before Centris photos load, OR inline SVG placeholders
- ❌ Custom mouse cursors
- ❌ `h-screen` — always `min-h-[100dvh]`
- ❌ Centered alignment on body paragraphs > 2 lines
- ❌ More than one primary CTA per viewport-worth of scroll
- ❌ « 99.9% satisfaction », « Sold in 14 days on average » or any fabricated performance figure. Real Centris stats only, or `[stat]` placeholders

---

## 10. Implementation Notes (specific to this project)

- **Build stack:** static HTML generated by `build.mjs` (Node, no React). Tailwind via CDN for utility classes; everything else hand-written CSS with custom properties. CDN-loaded JS: GSAP, ScrollTrigger, Lenis, Splitting, Motion One, Leaflet
- **Map tiles:** Stadia Maps · Alidade Smooth style · API key in env var, injected at build time
- **Bilingue:** French primary, English language switcher prepared but not built in v1
- **Centris ingestion:** daily GitHub Action regenerates `site/data/*.json` and rebuilds HTML
- **Photo handling:** Centris photos resized via `loading="lazy"` + `fetchpriority="high"` on the first hero photo only
- **Brand assets:** `brand_assets/` checked first for logo, brand kit. Currently empty — placeholders SVG generated inline until real assets land
