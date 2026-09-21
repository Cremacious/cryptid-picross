import { mulberry32, type RNG } from './silhouette';
import { RegionTheme } from './regions';
import type { ArtKind } from '../art/types';

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

/**
 * Body templates for inanimate evidence (icon/item art). Same voices, but the
 * copy reads as a recovered-object log, never a creature sighting — a Muddy
 * Boot must not "regard us without fear".
 */
const ITEM_TEMPLATES: Record<VoiceStyle, string[]> = {
  notebook: [
    'Recovered near {place}, {year}. Bagged, tagged, photographed. Nothing about where it lay makes sense. The file stays open.',
    'Found at {place}: one {name}, owner unknown. No tracks leading in. No tracks leading out. Logged and shelved.',
    'Catalogued {year}. The {name} was exactly where the witness said it would be. That is the part that bothers me.',
    'Field note: item recovered off the trail past {place}. Condition inconsistent with time exposed. Recommend cross-reference with prior cases.',
  ],
  firstPerson: [
    'I found it half-covered near {place}. Nobody camps out there. Nobody has for years. I brought it back and I still wish I had not.',
    'It was just sitting there, out past {place}, like it had been left for someone to find. Maybe it was. Maybe that someone was me.',
    'My uncle kept it in a drawer since {year}. Would not say where he got it. After he passed, I found the map it was wrapped in.',
    'We found the {name} on the second day. Whatever left it there had come back through {place} that same night. The prints went right past our tent.',
  ],
  victorian: [
    'Recovered upon the road past {place} in the year {year}: this curious article, of which no traveller would claim ownership. It is set down here among the evidence.',
    'Our party came upon the {name} near {place}, abandoned in circumstances I hesitate to record. We carried it out; none among us would carry it twice.',
    'Let this entry attest that the article was found at {place}, untouched by weather in a season of storms. Philosophy offers no account of it.',
    'The {name} was delivered to the society in {year} by a farmer who would accept no payment, wishing only to be rid of it.',
  ],
  deadpan: [
    'One {name}, recovered at {place}. No owner came forward. Per policy, unclaimed evidence is destroyed after ninety days. This item has been in storage since {year}.',
    'Item logged {year}. Chain of custody: incomplete. Explanation on file: none. Status: unresolved, like the rest of the drawer.',
    'The {name} was catalogued, photographed, and locked up. The lock has needed replacing twice. No further comment is on record.',
    'Found at {place}. Standard recovery, non-standard circumstances. The report uses the word "placed" where "dropped" was expected.',
  ],
};

/**
 * Body templates for landmarks — buildings, structures, rooted flora,
 * landscape. Not sighted like a creature, not recovered like an item: the
 * place itself is what's wrong.
 */
const LANDMARK_TEMPLATES: Record<VoiceStyle, string[]> = {
  notebook: [
    'Surveyed {place}, {year}. The {name} is on no map of the area, and the county keeps no record of it. It is there all the same.',
    'Field note: passed the {name} twice on the same trail, walking the same direction. The compass agreed with me. My legs did not.',
    'Locals will not camp within sight of the {name}. When asked why, they answer a different question. Noted, {year}; still unexplained.',
    'The {name} photographs poorly. Four exposures, four different distances. Recommend measurements be taken in person, and quickly.',
  ],
  firstPerson: [
    'Everyone around {place} knows the {name}. Nobody will give you directions to it. You find it, or it finds you.',
    'We used to dare each other to touch the {name} when we were kids. The dare was easy. It was the walk back nobody talked about.',
    'My father drove past the {name} every day for thirty years. In {year} he started taking the long way. He never said why.',
    'The {name} was closer to the road than I remembered. The next morning it was farther. I stopped checking after that.',
  ],
  victorian: [
    'Travellers upon the road past {place} report that the {name} may be seen only in certain weathers, and that it is best not seen at all.',
    'Of the {name} near {place} the older maps say nothing, though it has stood, by every local account, since before the maps were drawn.',
    'Let it be recorded that in {year} the {name} was observed to stand dark and silent, though every account agrees it had no cause to be either.',
    'The {name} is older than the parish record, older than the road, and — if the accounts from {place} are believed — older than it should be.',
  ],
  deadpan: [
    'The {name} appears in three surveys and is absent from four. All seven were conducted competently. No further survey is planned.',
    'Structure logged near {place}, {year}. Not on the registry. Not on the tax rolls. Not, per the county, anyone’s problem.',
    'Report of lights at the {name}, {year}. No occupant found, no power source found, no explanation offered. Case status: open, unvisited.',
    'The {name} was photographed for the record. The record now has a photograph of {place} with nothing in it. Both are filed.',
  ],
};

/** A deterministic, region-flavored field entry for one puzzle. */
export function makeEntry(theme: RegionTheme, name: string, kind: ArtKind, order: number, seed: number): FieldEntry {
  const rng = mulberry32(seed);
  const voice = VOICES[Math.floor(rng() * VOICES.length)];
  // "X of Coal Hollow ... near Coal Hollow" reads like a copy mistake, so
  // never pick a place the puzzle name already contains.
  let place = pick(rng, theme.places);
  if (name.includes(place)) place = theme.places.find((p) => !name.includes(p)) ?? place;
  const [y0, y1] = theme.years;
  const year = y0 + Math.floor(rng() * (y1 - y0 + 1));
  const pool = kind === 'creature' ? TEMPLATES : kind === 'landmark' ? LANDMARK_TEMPLATES : ITEM_TEMPLATES;
  const body = pick(rng, pool[voice])
    .replace(/\{name\}/g, name)
    .replace(/\{place\}/g, place)
    .replace(/\{year\}/g, String(year))
    // Names usually start with "The", and templates say "the {name}" — collapse
    // the doubled article ("the The Radio Tower" -> "the Radio Tower").
    .replace(/\b(the|The) The /g, '$1 ');
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
 * Generate a unique display name for a puzzle that names the depicted subject
 * (an art library entry's `label`), so the name always matches what's drawn.
 * Creature names may take cryptid descriptors ("The Red-Eyed Buck"); item and
 * icon names only take condition words ("The Rusted Lantern") and never place
 * epithets that imply the object is a being. Falls back to a numbered form so
 * it never blocks. Pass a catalog-wide `used` set to dedupe across regions.
 */
export function nameForEntry(theme: RegionTheme, label: string, kind: ArtKind, seed: number, used: Set<string>): { name: string; subtitle: string } {
  const rng = mulberry32(seed);
  const subtitle = pick(rng, theme.places);
  const descriptorPool =
    kind === 'creature' ? theme.descriptors : kind === 'landmark' ? theme.landmarkDescriptors : theme.itemDescriptors;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const form = Math.floor(rng() * 3);
    let name: string;
    if (form === 0) name = `The ${pick(rng, descriptorPool)} ${label}`;
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
