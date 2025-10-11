// Common prompt formatting helpers

export function formatExistingAssets(
  headlines?: string[],
  descriptions?: string[]
): string {
  let result = "";
  
  if (headlines && headlines.length > 0) {
    result += "\n\nExisting headlines (for reference):\n";
    result += headlines.map((h) => `- ${h}`).join("\n");
  } else {
    result += "\n\nExisting headlines: None provided";
  }
  
  if (descriptions && descriptions.length > 0) {
    result += "\n\nExisting descriptions (for reference):\n";
    result += descriptions.map((d) => `- ${d}`).join("\n");
  } else {
    result += "\n\nExisting descriptions: None provided";
  }
  
  return result;
}

export function formatKeywords(keywords?: string[]): string {
  if (!keywords || keywords.length === 0) {
    return "None provided";
  }
  return keywords.join(", ");
}

export function buildContextSection(context?: string): string {
  return context && context.trim() ? context.trim() : "General business promotion";
}
