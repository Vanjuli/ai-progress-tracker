export function pageTitle(subject: string): string {
  return `${subject} | AI Progress Tracker`;
}

export function fieldSeoDescription(name: string, description?: string | null): string {
  const base = description?.trim() || `Track AI progress in ${name}.`;
  return `${base} Explore benchmark results, research activity, and market-value trends for ${name}.`;
}

export function benchmarkSeoDescription(
  name: string,
  description?: string | null,
  higherIsBetter = true
): string {
  const direction = higherIsBetter ? "higher scores are better" : "lower scores are better";
  const base = description?.trim() || `Track ${name} benchmark progress over time.`;
  return `${base} View model scores over time on ${name}; ${direction}.`;
}
