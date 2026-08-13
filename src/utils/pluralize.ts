/** "1 mistake" / "0 mistakes" / "2 mistakes". Pass `plural` for irregular words. */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : plural ?? `${singular}s`;
  return `${count} ${word}`;
}
