export function summarizeMarkdown(markdown, maxChars = 420) {
  const withoutFrontMatter = String(markdown || "").replace(/^---[\s\S]*?---\s*/, "");
  const lines = withoutFrontMatter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const paragraph = lines.find((line) => !line.startsWith("#") && !line.startsWith("```")) || lines[0] || "";
  return compactText(paragraph.replace(/^#+\s*/, ""), maxChars);
}

function compactText(value, maxChars) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}
