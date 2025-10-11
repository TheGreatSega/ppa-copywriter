// Text sanitization and normalization utilities

export function clampLength(s: string, max: number): string {
  if (!s || s.length <= max) return s;
  
  const slice = s.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  
  // If we have a space within the last 10 chars, break there
  return (lastSpace > max - 10 ? slice.slice(0, lastSpace) : slice).trim();
}

export function similarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(""));
  const setB = new Set(b.toLowerCase().split(""));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export function dedupeKeepOrder(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  
  for (const s of arr) {
    const k = s.trim();
    if (!k) continue;
    
    const lower = k.toLowerCase();
    if (seen.has(lower)) continue;
    
    // Check similarity with existing items
    let isDuplicate = false;
    for (const existing of out) {
      if (similarity(k, existing) > 0.92) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.add(lower);
      out.push(k);
    }
  }
  
  return out;
}

export function normalizeLocale(s: string, locale?: string): string {
  if (!locale || !s) return s;
  
  // British spelling conversions
  if (locale.toLowerCase().startsWith("en-gb")) {
    return s
      .replace(/\borganize/gi, "organise")
      .replace(/\boptimize/gi, "optimise")
      .replace(/\banalyze/gi, "analyse")
      .replace(/\bcolor/gi, "colour")
      .replace(/\bfavor/gi, "favour")
      .replace(/\bcenter/gi, "centre");
  }
  
  return s;
}

export function sanitizeList(
  items: string[] | undefined,
  options: { maxChars: number; maxItems: number; locale?: string }
): string[] {
  if (!items || !Array.isArray(items)) return [];
  
  const { maxChars, maxItems, locale } = options;
  
  // Trim, clamp, normalize
  const processed = items
    .map((x) => normalizeLocale(clampLength(x.trim(), maxChars), locale))
    .filter((x) => x.length > 0);
  
  // Dedupe
  const deduped = dedupeKeepOrder(processed);
  
  // Limit count
  return deduped.slice(0, maxItems);
}
