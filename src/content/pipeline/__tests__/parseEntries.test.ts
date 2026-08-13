import { parseEntries } from '@/content/pipeline/parseEntries';

const MD = `## pnw-001 · The Roadside Encounter

**Voice:** notebook
**Year:** 1987
**Credibility:** medium

Trucker reported a flying saucer hovering above the treeline.
Radio silence during the sighting.

---

## pnw-002 · The Colony

**Voice:** firstPerson

They came at dusk and did not leave a trail.
`;

describe('parseEntries', () => {
  it('parses id, title, voice, year, credibility, and body', () => {
    const entries = parseEntries(MD);
    expect(Object.keys(entries).sort()).toEqual(['pnw-001', 'pnw-002']);
    const e = entries['pnw-001'];
    expect(e.title).toBe('The Roadside Encounter');
    expect(e.voiceStyle).toBe('notebook');
    expect(e.yearReported).toBe(1987);
    expect(e.witnessCredibility).toBe('medium');
    expect(e.body).toMatch(/Trucker reported/);
    expect(e.body).toMatch(/Radio silence/);
  });

  it('defaults voice to notebook and omits optional fields when absent', () => {
    const e = parseEntries(MD)['pnw-002'];
    expect(e.voiceStyle).toBe('firstPerson');
    expect(e.yearReported).toBeUndefined();
    expect(e.witnessCredibility).toBeUndefined();
    expect(e.body).toMatch(/came at dusk/);
  });

  it('returns an empty map for empty input', () => {
    expect(parseEntries('')).toEqual({});
  });
});
