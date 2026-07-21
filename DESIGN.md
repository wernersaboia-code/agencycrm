---
version: alpha
name: AgencyCRM Operational Design System
description: Visual system for a CRM and B2B lead marketplace used by agencies, sales operators, and administrators.
colors:
  background: "#F8FAFE"
  surface: "#FFFFFF"
  surface-subtle: "#E3EDF5"
  foreground: "#151A26"
  muted-foreground: "#525F6B"
  border: "#DEE4EB"
  primary: "#003048"
  primary-hover: "#0C4160"
  on-primary: "#F8FBFF"
  accent: "#184890"
  accent-soft: "#73A9E1"
  warning: "#B45309"
  warning-soft: "#FFF4D6"
  success: "#189048"
  success-soft: "#DDF6E7"
  danger: "#C5372C"
  admin: "#3B3F82"
  admin-soft: "#E8EAFE"
typography:
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  heading-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: 0
rounded:
  xs: 3px
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: 36px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    borderColor: "{colors.border}"
  sidebar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    activeBackground: "{colors.accent}"
  input:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
---

## Overview

AgencyCRM should feel like an operational trading desk for international B2B prospecting: calm, dense, precise, and trustworthy. The interface is used repeatedly by people managing leads, campaigns, calls, purchases, and admin work, so the visual language must privilege scanning speed over decoration.

The current UI is functional but too close to a default shadcn surface: neutral gray cards, generic rounded panels, inconsistent accent colors, and marketing sections that rely on familiar SaaS composition. The stronger direction is "quiet operational": a crisp off-white workspace, deep navy navigation, compact 8px cards, tabular rhythm, and blue/green only where action or commercial signal matters.

The palette above is derived from the brand logo (`public/logo.png`): the navy of the arrow (`#003048`) is `primary`, the EU blue of the globe (`#184890`) is `accent`, and the Brazilian green (`#189048`) carries `success`. **`app/globals.css` is the single source of truth** — these hex values document what the oklch tokens there resolve to. Change the tokens, then update this file; never hardcode either into components.

## Colors

Use `primary` as the shell and primary action color. It is intentionally dark and grounded, closer to export operations and CRM control rooms than to generic startup blue. Because it is already near-black, its hover state *lightens* rather than darkens. Use `accent` for active states, progress, links, and commercial momentum — it clears 8.4:1 on the light canvas, so it is safe for text; the softer `accent-soft` is not, and is limited to icons, borders, and fills. Use `admin` only for administrative surfaces or role markers so admin affordances are recognizable without a separate purple theme taking over the product.

The logo's yellow (`#f0c018`) is deliberately absent from the token set: at 1.7:1 on white it cannot carry text, and as a fill it competes with `warning`. Keep it in the logo.

Backgrounds should not be pure white at the page level. Use `background` for app canvases, `surface` for actual cards/panels, and `surface-subtle` for headers, sidebars inside panels, empty states, and table headers. Warning, success, and danger colors should appear as soft fills plus readable text, not bright blocks.

## Typography

Use Inter throughout. Keep dashboard and tool headings compact; avoid hero-scale type inside CRM surfaces. Labels should be uppercase only for navigation section labels and metric overlines, never for long prose. Do not use negative letter spacing.

## Layout

CRM, admin, and marketplace tool pages should be dense but breathable: 24px desktop page padding, 16px card internals, 12px gaps for grouped controls, and predictable grid tracks. Avoid nested cards. A page section can be full-width or constrained, but repeated records, stat panels, and modal bodies may be cards.

The CRM shell should feel anchored: dark left navigation, a light sticky top bar, and a subtle off-white working canvas. Key actions should sit near the page title or section header, not buried in decorative callouts.

## Elevation & Depth

Prefer borders and subtle tonal separation over heavy shadows. Cards can use a very small shadow only when they are interactive or elevated above the app canvas. Strong shadows are reserved for overlays, popovers, and modals.

## Shapes

Use 8px as the largest common card radius and 6px for controls. Avoid pill-shaped badges unless they represent a status chip or avatar. Icon containers should be square or softly rounded, not circular by default.

## Components

Buttons should be compact and decisive. Primary buttons use dark teal; secondary and outline buttons stay quiet. Icon buttons need visible focus and fixed dimensions.

Cards should have 8px radius, a light border, compact headers, and no decorative nesting. Tables should use a tinted header row, consistent row height, and hover states that help scanning without feeling loud. Badges should be squarer than pills unless the component already represents presence/avatar-like status.

## Do's and Don'ts

Do make the CRM feel fast, controlled, and specific to B2B prospecting. Do use deep navy navigation, restrained blue accents, compact metrics, and clear data hierarchy. Do keep admin purple contained to admin identity and role signals.

Don't use generic blue/purple gradients, large marketing cards inside operational screens, random glow effects, over-rounded panels, or decorative icon circles everywhere. Don't let the marketplace, CRM, and admin areas drift into unrelated palettes.

Don't reach for raw Tailwind color classes (`bg-white`, `text-gray-950`, `text-indigo-700`). They pin a surface to one theme and silently break dark mode — the landing carried 59 of them before this system was wired up. Use the semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-brand`, `text-brand-accent-strong`) so every surface follows the theme.
