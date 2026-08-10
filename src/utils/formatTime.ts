/** Seconds -> "MM:SS". Floors fractional seconds; clamps negatives to zero. */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(mm)}:${pad(ss)}`;
}
