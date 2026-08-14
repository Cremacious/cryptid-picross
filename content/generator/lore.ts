import { mulberry32, type RNG } from './silhouette';
import { RegionTheme } from './regions';

export type VoiceStyle = 'notebook' | 'firstPerson' | 'victorian' | 'deadpan';
export interface FieldEntry {
  title: string;
  body: string;
  voiceStyle: VoiceStyle;
  yearReported?: number;
  witnessCredibility?: 'low' | 'medium' | 'high';
}

const pick = <T>(rng: RNG, arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const VOICES: VoiceStyle[] = ['notebook', 'firstPerson', 'victorian', 'deadpan'];
const CRED: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

/** Body templates per voice. Slots: {name} {place} {year} — kept short (one paragraph). */
const TEMPLATES: Record<VoiceStyle, string[]> = {
  notebook: [
    'Sighted near {place}, {year}. Held still at the tree line, then was gone. Tracks pressed deep in wet ground. Recommend the file stay open.',
    'Report from {place}: a shape too large for any bear, moving without sound. No scat, no den. Witness sober. Logged as {name}.',
    'Second-hand account, {place}, {year}. Consistent with prior {name} reports — same height, same silence. Cross-reference earlier cases.',
    'Field note: heavy sign along {place}. Snapped branches at eight feet. Smell of wet copper. Did not linger to confirm.',
  ],
  firstPerson: [
    'I only saw it for a breath, out past {place}. It watched me the way a person watches, then stepped back into the dark and was just gone.',
    'We were near {place} when the dogs quit barking all at once. That is when I saw it. I have not been back after dark since.',
    'It was {year} and I swore I would never tell anyone. But I know what stood at the edge of {place}, and it was no animal I can name.',
    'My grandfather saw it first. Now I have too, plain as day, out by {place}. Whatever the {name} is, it remembers this valley.',
  ],
  victorian: [
    'Our party, encamped near {place} in the autumn of {year}, observed a figure of uncommon stature. It regarded us without fear, then withdrew as though it had never been.',
    'The guide would not speak its name above a whisper. Near {place} we beheld the {name}, and no man among us slept that night.',
    'I set down this account of {place} that it may not be lost: a creature of the old accounts, thought a fable, stood not forty paces distant.',
    'Let the record show that on the road past {place}, in the year {year}, a thing was seen which philosophy cannot yet explain.',
  ],
  deadpan: [
    'A dark shape off {place}. Three witnesses, one photograph, no clear resolution. The report was filed and, per policy, quietly closed.',
    'Observed {year} near {place}. Approximately human height, not human gait. No further comment was offered by the witness or requested of them.',
    'The {name} was logged as driftwood. Driftwood does not leave that kind of track. The file remains, uncorrected, in the drawer marked open.',
    'Duration of sighting: under a minute. Location: {place}. Conclusion: inconclusive, which is the only honest word for it.',
  ],
};

/** A deterministic, region-flavored field entry for one puzzle. */
export function makeEntry(theme: RegionTheme, name: string, order: number, seed: number): FieldEntry {
  const rng = mulberry32(seed);
  const voice = VOICES[Math.floor(rng() * VOICES.length)];
  const place = pick(rng, theme.places);
  const [y0, y1] = theme.years;
  const year = y0 + Math.floor(rng() * (y1 - y0 + 1));
  const body = pick(rng, TEMPLATES[voice])
    .replace(/\{name\}/g, name)
    .replace(/\{place\}/g, place)
    .replace(/\{year\}/g, String(year));
  const caseNo = String(order).padStart(3, '0');
  return {
    title: `${name.toUpperCase()} · CASE ${caseNo}`,
    body,
    voiceStyle: voice,
    yearReported: year,
    witnessCredibility: CRED[Math.floor(rng() * CRED.length)],
  };
}

/**
 * Generate a unique display name for a puzzle, avoiding names already used in the region.
 * Falls back to a creature+place form, then a numbered form, so it never blocks.
 */
export function makeName(theme: RegionTheme, seed: number, used: Set<string>): { name: string; subtitle: string } {
  const rng = mulberry32(seed);
  const subtitle = pick(rng, theme.places);
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const form = Math.floor(rng() * 3);
    let name: string;
    if (form === 0) name = `The ${pick(rng, theme.descriptors)} ${pick(rng, theme.creatures)}`;
    else if (form === 1) name = `${pick(rng, theme.creatures)} of ${pick(rng, theme.places)}`;
    else name = `The ${pick(rng, theme.creatures)}`;
    if (!used.has(name)) {
      used.add(name);
      return { name, subtitle };
    }
  }
  // Guaranteed-unique fallback.
  let n = 2;
  let base = `The ${pick(rng, theme.descriptors)} ${pick(rng, theme.creatures)}`;
  while (used.has(`${base} (${n})`)) n += 1;
  const name = `${base} (${n})`;
  used.add(name);
  return { name, subtitle };
}

/**
 * Generate a unique display name for a puzzle that names the depicted subject
 * (an art library entry's `label`), so the name always matches what's drawn.
 * Falls back to a numbered form so it never blocks.
 */
export function nameForEntry(theme: RegionTheme, label: string, seed: number, used: Set<string>): { name: string; subtitle: string } {
  const rng = mulberry32(seed);
  const subtitle = pick(rng, theme.places);
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const form = Math.floor(rng() * 3);
    let name: string;
    if (form === 0) name = `The ${pick(rng, theme.descriptors)} ${label}`;
    else if (form === 1) name = `${label} of ${pick(rng, theme.places)}`;
    else name = `The ${label}`;
    if (!used.has(name)) {
      used.add(name);
      return { name, subtitle };
    }
  }
  // Guaranteed-unique fallback.
  let n = 2;
  const base = `The ${label}`;
  while (used.has(`${base} (${n})`)) n += 1;
  const name = `${base} (${n})`;
  used.add(name);
  return { name, subtitle };
}
