import type { ThemeDTO } from "@/types";

/**
 * Turns a business's 3 brand colors into the full palette the UI is built on.
 * Token names come from the original design (cocoa = primary/ink, rose = accent,
 * blush = soft tints, cream/ivory = backgrounds) and are kept so every component
 * re-themes automatically.
 */

const HEX = /^#?([0-9a-f]{6})$/i;

function parse(hex: string, fallback: string): [number, number, number] {
  const m = HEX.exec(hex.trim()) ?? HEX.exec(fallback)!;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;

/** Linear mix: t = 0 → a, t = 1 → b. */
function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return toHex(a.map((c, i) => c + (b[i] - c) * t));
}

export const DEFAULT_THEME: ThemeDTO = { primary: "#2b2b33", accent: "#c2410c", background: "#faf8f5", font: "elegant" };

/** The platform's own look (landing page + console), independent of any business. */
export const PLATFORM_THEME: ThemeDTO = { primary: "#1f2333", accent: "#4f46e5", background: "#f6f6f8", font: "modern" };

export function isHexColor(v: string) {
  return HEX.test(v.trim());
}

export function palette(theme: Partial<ThemeDTO> | undefined) {
  const t = { ...DEFAULT_THEME, ...theme };
  const primary = parse(t.primary, DEFAULT_THEME.primary);
  const accent = parse(t.accent, DEFAULT_THEME.accent);
  const bg = parse(t.background, DEFAULT_THEME.background);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  return {
    cream: toHex(bg),
    ivory: mix(bg, white, 0.6),
    "blush-50": mix(accent, bg, 0.94),
    "blush-100": mix(accent, bg, 0.88),
    "blush-200": mix(accent, bg, 0.76),
    "blush-300": mix(accent, bg, 0.58),
    "blush-400": mix(accent, bg, 0.4),
    rose: toHex(accent),
    "rose-dark": mix(accent, black, 0.2),
    cocoa: toHex(primary),
    "cocoa-light": mix(primary, bg, 0.22),
    muted: mix(primary, bg, 0.42),
    line: mix(primary, bg, 0.86),
    "admin-bg": mix(bg, primary, 0.03),
  };
}

export type Palette = ReturnType<typeof palette>;

/** CSS that overrides the Tailwind theme variables for one business. */
export function themeCss(theme: Partial<ThemeDTO> | undefined) {
  const p = palette(theme);
  const vars = Object.entries(p).map(([k, v]) => `--color-${k}:${v};`);
  if (theme?.font === "modern") {
    vars.push("--font-display:var(--font-jost),system-ui,sans-serif;", "--font-script:var(--font-jost),system-ui,sans-serif;");
  }
  return `:root{${vars.join("")}}`;
}
