/**
 * Accessibility Contrast Ratio Diagnostic Tool
 * Inspects all visible text elements in the DOM to identify any contrast ratio violations
 * against WCAG AA standards (4.5:1 for normal text, 3:1 for large text >= 18pt or 14pt bold).
 */

interface ContrastResult {
  selector: string;
  textSnippet: string;
  fontSize: string;
  fontWeight: string;
  fgColor: string;
  bgColor: string;
  contrastRatio: number;
  requiredRatio: number;
  status: "PASS" | "FAIL";
  element: HTMLElement;
}

// Convert rgb/rgba string or hex to [r, g, b, a] in 0..1
function parseColor(colorStr: string): [number, number, number, number] | null {
  if (!colorStr || colorStr === "transparent" || colorStr === "inherit") {
    return null;
  }

  // Handle rgb / rgba
  const rgbaMatch = colorStr.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  );
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10) / 255;
    const g = parseInt(rgbaMatch[2], 10) / 255;
    const b = parseInt(rgbaMatch[3], 10) / 255;
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    return [r, g, b, a];
  }

  // Handle hex
  if (colorStr.startsWith("#")) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(hex, 16);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    return [r, g, b, 1];
  }

  return null;
}

// Calculate relative luminance based on WCAG formula
function getRelativeLuminance(r: number, g: number, b: number): number {
  const adjust = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const R = adjust(r);
  const G = adjust(g);
  const B = adjust(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Calculate contrast ratio between two colors
function getContrastRatio(
  fg: [number, number, number, number],
  bg: [number, number, number, number],
): number {
  // If foreground has transparency, blend over background
  const r = fg[0] * fg[3] + bg[0] * (1 - fg[3]);
  const g = fg[1] * fg[3] + bg[1] * (1 - fg[3]);
  const b = fg[2] * fg[3] + bg[2] * (1 - fg[3]);

  const l1 = getRelativeLuminance(r, g, b);
  const l2 = getRelativeLuminance(bg[0], bg[1], bg[2]);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Climb up the DOM tree to find the effective background color
function getEffectiveBackgroundColor(
  el: HTMLElement,
): [number, number, number, number] {
  let current: HTMLElement | null = el;
  const colors: [number, number, number, number][] = [];

  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const parsed = parseColor(style.backgroundColor);
    if (parsed && parsed[3] > 0) {
      colors.push(parsed);
      if (parsed[3] >= 0.99) break; // Fully opaque background found
    }
    current = current.parentElement;
  }

  // Fallback to theme-dependent background if none found
  const isDark = document.documentElement.classList.contains("dark");
  colors.push(isDark ? [9 / 255, 9 / 255, 11 / 255, 1] : [1, 1, 1, 1]); // zinc-950 or white

  // Blend colors bottom-to-top
  let blended = colors[colors.length - 1];
  for (let i = colors.length - 2; i >= 0; i--) {
    const top = colors[i];
    const r = top[0] * top[3] + blended[0] * (1 - top[3]);
    const g = top[1] * top[3] + blended[1] * (1 - top[3]);
    const b = top[2] * top[3] + blended[2] * (1 - top[3]);
    blended = [r, g, b, 1];
  }

  return blended;
}

export function runAccessibilityContrastAudit(): ContrastResult[] {
  if (typeof window === "undefined" || typeof document === "undefined")
    return [];

  const isDark = document.documentElement.classList.contains("dark");
  const results: ContrastResult[] = [];

  // Gather elements with direct text content or inputs/buttons
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(
      "p, span, h1, h2, h3, h4, h5, h6, a, button, label, input, select, textarea, th, td, kbd, code",
    ),
  );

  for (const el of elements) {
    // Skip hidden or invisible elements
    if (el.offsetParent === null && el.tagName !== "BODY") continue;
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    )
      continue;

    // Direct text verification
    const text =
      el.innerText?.trim() ||
      (el as HTMLInputElement).placeholder ||
      (el as HTMLInputElement).value ||
      "";
    if (!text) continue;

    const fg = parseColor(style.color);
    if (!fg) continue;

    const bg = getEffectiveBackgroundColor(el);
    const contrastRatio = getContrastRatio(fg, bg);

    // Determine required ratio: normal text = 4.5:1, large text (>= 24px or >= 18.66px bold) = 3.0:1
    const fontSizePx = parseFloat(style.fontSize) || 14;
    const isBold =
      parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === "bold";
    const isLargeText = fontSizePx >= 24 || (fontSizePx >= 18.66 && isBold);
    const requiredRatio = isLargeText ? 3.0 : 4.5;

    const status = contrastRatio >= requiredRatio ? "PASS" : "FAIL";

    // Unique selector path for logging
    const selector = el.id
      ? `#${el.id}`
      : `${el.tagName.toLowerCase()}${el.className ? "." + el.className.split(" ").slice(0, 2).join(".") : ""}`;

    results.push({
      selector,
      textSnippet: text.length > 25 ? text.substring(0, 25) + "..." : text,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fgColor: style.color,
      bgColor: `rgb(${Math.round(bg[0] * 255)}, ${Math.round(bg[1] * 255)}, ${Math.round(bg[2] * 255)})`,
      contrastRatio: parseFloat(contrastRatio.toFixed(2)),
      requiredRatio,
      status,
      element: el,
    });
  }

  const failures = results.filter((r) => r.status === "FAIL");
  const passes = results.filter((r) => r.status === "PASS");

  // Pretty print to developer console
  console.groupCollapsed(
    `%c[DreBoXs A11y Audit] Mode: ${isDark ? "DARK" : "LIGHT"} | Evaluated: ${results.length} | Passing: ${passes.length} | Violations: ${failures.length}`,
    failures.length > 0
      ? "color: #f59e0b; font-weight: bold;"
      : "color: #10b981; font-weight: bold;",
  );

  if (failures.length > 0) {
    console.warn(
      `Ditemukan ${failures.length} elemen teks yang belum memenuhi rasio kontras standar WCAG AA:`,
    );
    console.table(
      failures.map((f) => ({
        Elemen: f.selector,
        Teks: f.textSnippet,
        FG: f.fgColor,
        BG: f.bgColor,
        "Rasio Kontras": `${f.contrastRatio}:1`,
        "Syarat Min": `${f.requiredRatio}:1`,
      })),
    );
  } else {
    console.log(
      "%cSeluruh elemen teks memenuhi standar aksesibilitas WCAG AA kontras rasio!",
      "color: #10b981;",
    );
  }
  console.groupEnd();

  return results;
}

// Expose on window object for interactive debugging in devtools
if (typeof window !== "undefined") {
  (
    window as unknown as {
      __runDreboxsContrastAudit: typeof runAccessibilityContrastAudit;
    }
  ).__runDreboxsContrastAudit = runAccessibilityContrastAudit;

  // Run initial diagnostic in browser console after DOM stabilization
  const scheduleAudit = () => {
    setTimeout(() => {
      runAccessibilityContrastAudit();
    }, 1500);
  };

  if (document.readyState === "complete") {
    scheduleAudit();
  } else {
    window.addEventListener("load", scheduleAudit, { once: true });
  }

  // Also listen for theme change class mutations on documentElement
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "class") {
        setTimeout(() => runAccessibilityContrastAudit(), 300);
        break;
      }
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
}
