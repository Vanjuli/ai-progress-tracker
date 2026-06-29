export function metricLabel(unit: string, higherIsBetter: boolean): string {
  const normalized = unit.trim().toLowerCase();

  if (normalized.includes("wer")) return "Word error rate";
  if (normalized === "%" && higherIsBetter) return "Accuracy";
  if (normalized.startsWith("%") && higherIsBetter) return "Accuracy";
  return "Score";
}

export function metricExplanation(unit: string, higherIsBetter: boolean): string {
  const normalized = unit.trim();
  const direction = higherIsBetter ? "higher is better" : "lower is better";
  const label = metricLabel(normalized, higherIsBetter);

  if (label === "Accuracy" && normalized === "%") {
    return `${label} — % of problems solved correctly (${direction})`;
  }

  if (label === "Word error rate") {
    return `${label} — % (${direction})`;
  }

  return `${label} — ${normalized || "value"} (${direction})`;
}
