---
name: LearnioX Professional
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#626262'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1c1c'
  on-tertiary-container: '#838484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  xxl: 64px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built on a foundation of extreme functionalism and clarity. Designed for high-stakes enterprise environments, it utilizes a **Minimalist** and **High-Contrast** aesthetic to reduce cognitive load and focus entirely on data integrity and workflow efficiency. 

The brand personality is authoritative, transparent, and precise. It rejects decorative trends in favor of a structural, "architectural" UI that mirrors the reliability of professional documentation. The visual language conveys a sense of permanence and intellectual rigor through a strictly monochromatic palette and sharp, geometric forms.

## Colors

The palette is restricted to a binary foundation of absolute black and white, supported by a functional grayscale. 

- **Primary (#000000):** Used for primary actions, high-emphasis text, and structural borders.
- **Secondary (#666666):** Reserved for secondary information, metadata, and supporting icons.
- **Surface Tiers:** White (#FFFFFF) serves as the primary workspace background. A subtle gray (#F5F5F5) is used for layout-level sectioning and background fills for disabled states or read-only inputs.
- **Dividers:** A tiered border system uses #E5E5E5 for subtle separation and #000000 for defining primary component boundaries.

There is no use of color to denote status (success, error, warning). These states must be communicated through iconography and explicit labeling.

## Typography

The design system utilizes **Inter** for all typographic applications. The typeface's tall x-height and geometric clarity ensure legibility at small sizes within dense enterprise tables and dashboards.

Information hierarchy is established through drastic weight shifts (SemiBold/Bold for headlines vs. Regular for body) and the use of uppercase labels for technical metadata. Paragraphs favor a slightly generous line-height to maintain readability amidst the high-contrast color scheme. Large display headings use tighter letter spacing to maintain a structured, compact appearance.

## Layout & Spacing

The layout is governed by a **fixed-width structured grid** for desktop, maxing out at 1440px to prevent excessive line lengths. It follows a strict 4px baseline grid.

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column fluid grid with 16px margins.

Spacing is used to create "logical groupings." Components are separated by `xl` or `xxl` units to ensure the high-contrast elements do not feel cluttered. White space in this design system is not "empty"—it is a functional separator that replaces the need for drop shadows or color fills.

## Elevation & Depth

This design system contains **zero elevation**. There are no shadows, blurs, or gradients. Depth is conveyed exclusively through **Tonal Layering** and **Line Weight**.

- **Level 0 (Background):** Pure White (#FFFFFF).
- **Level 1 (Containers/Cards):** Defined by a 1px solid black border.
- **Level 2 (Active/Hover):** Indicated by a 2px solid black border or a solid black fill.
- **Overlays/Modals:** Modals use a 1px black border and a white background. To separate them from the content below, a solid #000000 overlay with 40% opacity is used for the backdrop, rather than a blur.

## Shapes

The shape language is strictly **Sharp (0px radius)**. Every UI element—including buttons, input fields, cards, and modals—must utilize 90-degree corners. This reinforces the "grid-first" architectural philosophy and ensures that elements align perfectly with the pixel grid. There are no exceptions for "pill-shaped" tags or rounded iconography.

## Components

### Buttons
- **Primary:** Solid black fill with white text. No border-radius.
- **Secondary:** White background with a 1px solid black border. Black text.
- **Tertiary/Ghost:** No border or fill. Black text with an underline on hover.
- **Interaction:** On hover, the Primary button shifts to #666666. Secondary buttons increase border-weight to 2px.

### Input Fields
- **Default:** 1px solid #CCCCCC border, white background.
- **Focus:** 1px solid #000000 border. No outer glow.
- **Labels:** Always placed above the field in `label-md` style.

### Cards & Containers
- Containers use a 1px #E5E5E5 border for structural grouping and 1px #000000 for interactive cards.
- Internal padding is strictly 24px (`lg`).

### Lists & Data Tables
- Row separation is handled by 1px solid #E5E5E5 horizontal lines. 
- Headers use #F5F5F5 background with `label-md` typography.
- No vertical grid lines are used unless the table is excessively dense.

### Selection Controls
- **Checkboxes/Radios:** Sharp 1px black borders. Selection is indicated by a solid black inner square (for checkboxes) or a smaller black square (for radios). No circles are used.