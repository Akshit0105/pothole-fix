---
name: Editorial Infrastructure Intelligence
colors:
  surface: '#f9faf8'
  surface-dim: '#d9dad8'
  surface-bright: '#f9faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f2'
  surface-container: '#edeeec'
  surface-container-high: '#e7e8e6'
  surface-container-highest: '#e1e3e1'
  on-surface: '#191c1b'
  on-surface-variant: '#3e494a'
  inverse-surface: '#2e3130'
  inverse-on-surface: '#f0f1ef'
  outline: '#6e797b'
  outline-variant: '#bdc9ca'
  surface-tint: '#006874'
  primary: '#00646f'
  on-primary: '#ffffff'
  primary-container: '#087f8c'
  on-primary-container: '#effdff'
  inverse-primary: '#79d4e2'
  secondary: '#556066'
  on-secondary: '#ffffff'
  secondary-container: '#d9e4eb'
  on-secondary-container: '#5b666c'
  tertiary: '#4c5c66'
  on-tertiary: '#ffffff'
  tertiary-container: '#64757f'
  on-tertiary-container: '#f5faff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#95f1ff'
  primary-fixed-dim: '#79d4e2'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f57'
  secondary-fixed: '#d9e4eb'
  secondary-fixed-dim: '#bdc8cf'
  on-secondary-fixed: '#131d22'
  on-secondary-fixed-variant: '#3e484e'
  tertiary-fixed: '#d3e5f1'
  tertiary-fixed-dim: '#b7c9d5'
  on-tertiary-fixed: '#0c1e26'
  on-tertiary-fixed-variant: '#384953'
  background: '#f9faf8'
  on-background: '#191c1b'
  surface-variant: '#e1e3e1'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 38px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.035em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.02em
  title-md:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  gutter-desktop: 1.75rem
  margin: 2rem
  margin-mobile: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system establishes an editorial, civic-grade interface for an artificial intelligence road maintenance platform. It rejects the hyperactive dashboards, neon accents, and dense data walls characteristic of industrial civic software. Instead, it draws from the clarity of Linear, the typographic rhythm of Stripe, and the restraint of Apple editorial layouts.

The design philosophy rests on three pillars:
- **Quiet Authority:** Surfaces are spacious, legible, and calm. The visual language conveys competence and civic responsibility without performative complexity or synthetic telemetry.
- **Material Realism:** Interfaces emulate premium print reports layered over physical cartography and street-level spatial data. UI elements feel lightweight yet substantial, utilizing paper-white planes resting over warm foundational ground.
- **Human Scale:** Machine-learning classifications (crack density, pothole depth, priority sequencing) are translated into clear human diagnoses and actionable triage flows, framed with photographic clarity rather than speculative metrics.

## Colors

The palette is anchored in an organic off-white foundation that eliminates cold digital starkness, allowing high-contrast typography and subtle triage signifiers to lead visual hierarchy.

### Canvas & Surfaces
- **Foundation Canvas (`#F8F9F7`):** Warm mineral off-white used for viewports, document backgrounds, and root layouts.
- **Surface Crisp (`#FFFFFF`):** Pure elevated white reserved for interactive cards, sheets, inspection panels, and floating controls.
- **Subtle Surface (`#F0F3F1`):** Muted container background for nested metadata sections, segment tabs, and table headers.

### Ink & Structure
- **Ink Primary (`#172126`):** Charcoal ink for titles, high-priority labels, and emphasized data points.
- **Deep Slate (`#4A5568`):** Editorial secondary tone for expository copy, field notes, and contextual captions.
- **Muted Hairline (`#E4E7E5`):** Delicate neutral boundary for cards, structural separators, and input perimeters.

### Accents & Signal States
- **Teal Accent (`#087F8C`):** Primary interaction anchor, affirmative actions, verified status indicators, and key path callouts.
- **Sky Tint (`#E0F2FE`):** Calm background fill for interactive chips, secondary telemetry tags, and active map highlights.
- **Subtle Sage (`#E2EBE5`):** Low-contrast tag surface for minor maintenance items, resolved statuses, and balanced readouts.
- **Amber Warning (`#F59E0B`):** Moderate road hazard indicators, scheduled resurfacing notices, and review-pending badges.
- **Muted Coral (`#EF4444`):** Severe degradation warnings, structural hazard alerts, and emergency dispatch triggers.

## Typography

Typography establishes an editorial atmosphere through a structured contrast between the structural, geometric presence of Space Grotesk and the neutral, systematic legibility of Inter.

- **Headlines & Display:** Space Grotesk is employed with tight negative tracking (`-0.02em` to `-0.04em`) to invoke the deliberate, journalistic feel of modern architectural and technical periodicals.
- **Body & Data Prose:** Inter is set with comfortable, open line heights (`1.55` to `1.625`) to preserve eye comfort when scanning road inspection notes, algorithmic diagnosis summaries, and field repair logs.
- **Monospaced Identifiers & Metadata:** Key metrics, coordinates, street IDs, and severity codes use Space Grotesk in smaller sizes (`code-sm`, `label-sm`) with uppercase styling and slight tracking expansion for instant scanning without visual clutter.

## Layout & Spacing

The layout model favors open space, deliberate alignment, and modular editorial panels over cramped data grids.

### Grid & Composition
- **Desktop (≥ 1024px):** 12-column dynamic grid with a maximum content container of 1360px. Gutters expand to `1.75rem` (`gutter-desktop`) with comfortable outer page margins of `3rem` (`margin-desktop`). Split-screen views (interactive geospatial viewport on one side, triage queue on the other) divide cleanly along 7:5 or 6:6 column splits.
- **Tablet (768px - 1023px):** 8-column layout. Side panels collapse into stacked sliding cards or bottom-docked sheets.
- **Mobile (< 768px):** 4-column flow with tight `0.75rem` gutters (`gutter-mobile`) and `1rem` outer canvas padding (`margin-mobile`). Inspection feeds and cards span the full column breadth.

### Spatial Rhythm
Component spacing follows strict vertical increments derived from `0.25rem` (4px base unit). Card internal padding uses `space-lg` (24px) for desktop inspection summaries and scales to `space-md` (16px) on mobile viewports to preserve density without crowding borders.

## Elevation & Depth

Visual hierarchy is communicated through structural layering and diffused illumination rather than dramatic drops, emulating clean white card stock resting on an architectural planning board.

### Surface Outlines
All elevated white components (`#FFFFFF`) are bound by a 1px solid border in `#E4E7E5`. This hair-thin definition separates content from the warm off-white canvas (`#F8F9F7`) even in conditions of low display contrast.

### Ambient Shadow Hierarchy
- **Level 0 (Flat Ground):** `#F8F9F7` with no shadow. Used for page roots and recessed filter gutters.
- **Level 1 (Card & Row Surface):** `0 1px 3px rgba(23, 33, 38, 0.03), 0 4px 12px rgba(23, 33, 38, 0.02)`. Applied to standard list items, metric cards, and photo panels.
- **Level 2 (Hover & Active Selection):** `0 2px 8px rgba(23, 33, 38, 0.05), 0 12px 28px rgba(8, 127, 140, 0.06)`. Subtle teal-tinted diffusion indicates focus and mouse proximity.
- **Level 3 (Modals, Overlays, and Tooltips):** `0 12px 32px rgba(23, 33, 38, 0.08), 0 2px 6px rgba(23, 33, 38, 0.04)`. Applied to floating map controls, image zoom dialogs, and triage confirmation drawers.
- **Glass Transparency:** Navigation bars and contextual status bars utilize `background: rgba(248, 249, 247, 0.85)` accompanied by a `12px` backdrop blur (`backdrop-filter: blur(12px)`) and a bottom hairline stroke (`#E4E7E5`).

## Shapes

The design uses balanced, modern curves (`roundedness: 2`) that soften the precision of technical road imagery while remaining architecturally structured.

- **Micro Controls & Chips:** Small interactive elements, tag badges, and status pills employ `0.5rem` (8px) corner radii for clean containment.
- **Cards & Data Modules:** Standard information surfaces, camera upload drops, and table wrappers utilize `1rem` (16px) corner radii.
- **Modals & Hero Overlays:** Prominent inspection dialogs and primary action containers scale to `1.5rem` (24px) for an approachable, tactile presentation.
- **Action Buttons:** Standard buttons maintain an intentional `0.5rem` radius; icon-only actions adopt identical rounding to preserve optical geometry alongside input frames.

## Components

### Buttons
- **Primary:** Background in `#087F8C`, foreground in `#FFFFFF`, font weight `500` in Inter. Hover state transitions to `#076B76` with a micro-lift shadow. Active state compresses down 1px.
- **Secondary / Neutral:** Pure white background (`#FFFFFF`), border `1px solid #E4E7E5`, text in `#172126`. Hover introduces `#F0F3F1` surface fill and `#172126` border definition.
- **Ghost:** Transparent background with `#4A5568` text. Hover adds `#E2EBE5` at 50% opacity.
- **Padding:** Compact actions use `0.5rem 0.875rem`; standard actions use `0.625rem 1.25rem`.

### Chips & Severity Badges
- Badges feature an uppercase `label-sm` label paired with a 6px circular status dot.
- **Critical (High Depth / Rapid Deterioration):** Border `#FCA5A5`, surface `#FEF2F2`, dot and text `#EF4444`.
- **Moderate (Surface Spalling / Developing Pothole):** Border `#FDE68A`, surface `#FFFBEB`, dot and text `#D97706`.
- **Low / Monitoring (Minor Fissure):** Border `#E2EBE5`, surface `#F0F3F1`, dot and text `#4A5568`.
- **Verified by AI:** Border `#BAE6FD`, surface `#E0F2FE`, dot and text `#087F8C`.

### Cards & Surface Modules
- Pure `#FFFFFF` surface bounded by a `1px` border in `#E4E7E5` with Level 1 ambient elevation.
- Internal headers feature clear division: category/street breadcrumbs in deep slate (`#4A5568`), primary title in Space Grotesk (`#172126`), followed by a fluid content region.
- On hover, cards transition their border color to `#087F8C` with a 200ms ease curve.

### Form Inputs & Upload Dropzones
- **Text Inputs:** Height 44px, background `#FFFFFF`, border `1px solid #E4E7E5`, corner radius `0.5rem`. Placeholder copy in deep slate at 50% opacity. Focused inputs highlight with `#087F8C` border and a `0 0 0 3px rgba(8, 127, 140, 0.12)` halo ring.
- **Inspection Image Uploader:** Dashed border in `#CBD5E1`, background `#FAFBFA`, featuring an upload icon, Space Grotesk subhead, and accepted format instructions in `body-sm`. Drag-over activates a `#E0F2FE` tint with a `#087F8C` dashed frame.

### Checkboxes & Radios
- Square checkbox elements with `4px` rounding, 18px footprint, bounded by `#CBD5E1`. Checked state fills `#087F8C` with a crisp `#FFFFFF` check icon. Focus state emits the signature teal glow ring.

### Lists & Inspection Feeds
- List items feature alternating subtle zebra fills or 1px bottom separators in `#E4E7E5`.
- Each row aligns a road snapshot thumbnail (48x48px, rounded 8px), structured address metadata, detection timestamp, AI confidence score, and severity chip with clear horizontal spacing (`space-md`).

### Pothole Detection Preview Card (Product-Specific)
- A purpose-built card combining an uncropped real-world road photo with an overlay bounding box (colored in `#EF4444` or `#087F8C` with 2px stroke).
- A bottom bar within the card displays the estimated pothole depth, surface area, and GPS coordinates set in `code-sm`, establishing practical, honest reporting without artificial metrics.