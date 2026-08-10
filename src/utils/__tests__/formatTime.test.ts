import { formatTime } from '@/utils/formatTime';

describe('formatTime', () => {
  it('formats sub-minute times', () => {
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(59)).toBe('00:59');
  });
  it('formats minutes and seconds', () => {
    expect(formatTime(75)).toBe('01:15');
    expect(formatTime(600)).toBe('10:00');
  });
  it('floors fractional seconds and clamps negatives to zero', () => {
    expect(formatTime(42.9)).toBe('00:42');
    expect(formatTime(-5)).toBe('00:00');
  });
});
