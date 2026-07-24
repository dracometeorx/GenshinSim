function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function parseNumericDraft(
  draft: string,
  min: number,
  max: number,
) {
  if (!draft.trim()) return null;
  const parsed = Number(draft);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : null;
}
