import { pluralize } from '@/utils/pluralize';

describe('pluralize', () => {
  it('uses the singular for exactly one', () => {
    expect(pluralize(1, 'mistake')).toBe('1 mistake');
  });
  it('uses the plural for zero and many', () => {
    expect(pluralize(0, 'mistake')).toBe('0 mistakes');
    expect(pluralize(2, 'mistake')).toBe('2 mistakes');
  });
  it('accepts an explicit irregular plural', () => {
    expect(pluralize(3, 'sighting', 'sightings')).toBe('3 sightings');
    expect(pluralize(1, 'sighting', 'sightings')).toBe('1 sighting');
  });
});
