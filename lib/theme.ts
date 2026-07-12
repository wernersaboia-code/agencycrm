/**
 * Design Tokens — Easy Prospect
 * Single source of truth for colors, spacing, typography, elevation, and radii.
 */

// ============================================================
// COLORS
// ============================================================

export const colors = {
  brand: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b",
  },
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  status: {
    success: {
      DEFAULT: "#10b981",
      light: "#d1fae5",
      dark: "#065f46",
    },
    warning: {
      DEFAULT: "#f59e0b",
      light: "#fef3c7",
      dark: "#92400e",
    },
    error: {
      DEFAULT: "#f43f5e",
      light: "#ffe4e6",
      dark: "#9f1239",
    },
    info: {
      DEFAULT: "#6366f1",
      light: "#e0e7ff",
      dark: "#312e81",
    },
  },
  surface: {
    DEFAULT: "#ffffff",
    elevated: "#fafafa",
    sunken: "#f4f4f5",
    overlay: "rgba(255, 255, 255, 0.80)",
  },
  text: {
    primary: "#18181b",
    secondary: "#71717a",
    tertiary: "#a1a1aa",
    inverse: "#fafafa",
    disabled: "#d4d4d8",
  },
}

// ============================================================
// TYPOGRAPHY
// ============================================================

export const typography = {
  fontFamily: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  sizes: {
    xs: { size: "0.75rem", lineHeight: "1rem", letterSpacing: "0.01em" },
    sm: { size: "0.875rem", lineHeight: "1.25rem", letterSpacing: "0em" },
    base: { size: "1rem", lineHeight: "1.5rem", letterSpacing: "-0.01em" },
    lg: { size: "1.125rem", lineHeight: "1.75rem", letterSpacing: "-0.01em" },
    xl: { size: "1.25rem", lineHeight: "1.75rem", letterSpacing: "-0.02em" },
    "2xl": { size: "1.5rem", lineHeight: "2rem", letterSpacing: "-0.02em" },
    "3xl": { size: "1.875rem", lineHeight: "2.25rem", letterSpacing: "-0.03em" },
    "4xl": { size: "2.25rem", lineHeight: "2.5rem", letterSpacing: "-0.03em" },
    "5xl": { size: "3rem", lineHeight: "3rem", letterSpacing: "-0.04em" },
    "6xl": { size: "3.75rem", lineHeight: "3.75rem", letterSpacing: "-0.04em" },
    "7xl": { size: "4.5rem", lineHeight: "4.5rem", letterSpacing: "-0.05em" },
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}

// ============================================================
// SPACING
// ============================================================

export const spacing = {
  px: "1px",
  0: "0px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
}

// ============================================================
// ELEVATION (Shadows)
// ============================================================

export const elevation = {
  none: "0 0 #0000",
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
  DEFAULT:
    "0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
  md: "0 10px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
  lg: "0 20px 25px -5px rgb(0 0 0 / 0.04), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
  xl: "0 25px 50px -12px rgb(0 0 0 / 0.08)",
  "2xl": "0 32px 64px -12px rgb(0 0 0 / 0.12)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.03)",
  glow: {
    sm: "0 0 12px rgb(99 102 241 / 0.15)",
    DEFAULT: "0 0 24px rgb(99 102 241 / 0.20)",
    lg: "0 0 36px rgb(99 102 241 / 0.25)",
  },
}

// ============================================================
// BORDER RADIUS
// ============================================================

export const radii = {
  none: "0px",
  xs: "2px",
  sm: "4px",
  DEFAULT: "6px",
  md: "8px",
  lg: "10px",
  xl: "14px",
  "2xl": "18px",
  "3xl": "24px",
  full: "9999px",
}

// ============================================================
// BORDERS
// ============================================================

export const borders = {
  hairline: "0.5px solid",
  thin: "1px solid",
  regular: "1.5px solid",
  thick: "2px solid",
}

// ============================================================
// Z-INDEX
// ============================================================

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
}

// ============================================================
// TRANSITIONS
// ============================================================

export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  DEFAULT: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  slower: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
}

// ============================================================
// DENSITIES
// ============================================================

export const density = {
  compact: {
    paddingX: spacing[2],
    paddingY: spacing[1.5],
    gap: spacing[1.5],
    radius: radii.sm,
  },
  comfortable: {
    paddingX: spacing[3],
    paddingY: spacing[2],
    gap: spacing[2.5],
    radius: radii.DEFAULT,
  },
  spacious: {
    paddingX: spacing[4],
    paddingY: spacing[3],
    gap: spacing[4],
    radius: radii.md,
  },
} as const

// ============================================================
// DARK MODE OVERRIDES
// ============================================================

export const dark = {
  surface: {
    DEFAULT: "#09090b",
    elevated: "#18181b",
    sunken: "#0e0e10",
    overlay: "rgba(0, 0, 0, 0.80)",
  },
  text: {
    primary: "#fafafa",
    secondary: "#a1a1aa",
    tertiary: "#71717a",
    inverse: "#18181b",
    disabled: "#52525b",
  },
  border: {
    DEFAULT: "rgba(255, 255, 255, 0.08)",
    subtle: "rgba(255, 255, 255, 0.05)",
    strong: "rgba(255, 255, 255, 0.12)",
  },
}

// ============================================================
// HELPER: CSS VARIABLE INJECTOR (for globals.css)
// ============================================================

/**
 * Generates CSS custom properties from tokens for injection into :root
 */
export function generateCssVariables(): string {
  const lines: string[] = []

  lines.push(":root {")
  lines.push(`  --font-sans: ${typography.fontFamily.sans};`)
  lines.push(`  --font-mono: ${typography.fontFamily.mono};`)

  // Brand colors
  Object.entries(colors.brand).forEach(([key, value]) => {
    lines.push(`  --color-brand-${key}: ${value};`)
  })

  // Slate colors
  Object.entries(colors.slate).forEach(([key, value]) => {
    lines.push(`  --color-slate-${key}: ${value};`)
  })

  // Surface
  Object.entries(colors.surface).forEach(([key, value]) => {
    if (key === "DEFAULT") {
      lines.push(`  --color-surface: ${value};`)
    } else {
      lines.push(`  --color-surface-${key}: ${value};`)
    }
  })

  // Text
  Object.entries(colors.text).forEach(([key, value]) => {
    lines.push(`  --color-text-${key}: ${value};`)
  })

  // Elevation
  Object.entries(elevation).forEach(([key, value]) => {
    if (key === "DEFAULT") {
      lines.push(`  --shadow: ${value};`)
    } else if (key !== "glow") {
      lines.push(`  --shadow-${key}: ${value};`)
    }
  })
  Object.entries(elevation.glow).forEach(([key, value]) => {
    lines.push(`  --shadow-glow-${key}: ${value};`)
  })

  // Radii
  Object.entries(radii).forEach(([key, value]) => {
    if (key === "DEFAULT") {
      lines.push(`  --radius: ${value};`)
    } else {
      lines.push(`  --radius-${key}: ${value};`)
    }
  })

  // Transitions
  Object.entries(transitions).forEach(([key, value]) => {
    if (key === "DEFAULT") {
      lines.push(`  --transition: ${value};`)
    } else {
      lines.push(`  --transition-${key}: ${value};`)
    }
  })

  lines.push("}")
  return lines.join("\n")
}
