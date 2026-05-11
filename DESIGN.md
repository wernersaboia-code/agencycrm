---
version: alpha
name: AgencyCRM Operational Design System
description: Visual system for a CRM and B2B lead marketplace used by agencies, sales operators, and administrators.
colors:
  background: "#F5F7F8"
  surface: "#FFFFFF"
  surface-subtle: "#EEF3F2"
  foreground: "#17201D"
  muted-foreground: "#5F6B66"
  border: "#D8E0DD"
  primary: "#164A45"
  primary-hover: "#0F3D39"
  on-primary: "#F6FFFC"
  accent: "#2F9E8F"
  accent-soft: "#DDF4EF"
  warning: "#B45309"
  warning-soft: "#FFF4D6"
  success: "#17815E"
  success-soft: "#DDF8EC"
  danger: "#C2413A"
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

The current UI is functional but too close to a default shadcn surface: neutral gray cards, generic rounded panels, inconsistent accent colors, and marketing sections that rely on familiar SaaS composition. The stronger direction is "quiet operational": a crisp off-white workspace, dark teal navigation, compact 8px cards, tabular rhythm, and green/teal only where action or commercial signal matters.

## Colors

Use `primary` as the shell and primary action color. It is intentionally dark and grounded, closer to export operations and CRM control rooms than to generic startup blue. Use `accent` for active states, progress, and commercial momentum. Use `admin` only for administrative surfaces or role markers so admin affordances are recognizable without a separate purple theme taking over the product.

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

Do make the CRM feel fast, controlled, and specific to B2B prospecting. Do use dark teal navigation, restrained green accents, compact metrics, and clear data hierarchy. Do keep admin purple contained to admin identity and role signals.

Don't use generic blue/purple gradients, large marketing cards inside operational screens, random glow effects, over-rounded panels, or decorative icon circles everywhere. Don't let the marketplace, CRM, and admin areas drift into unrelated palettes.
