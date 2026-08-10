import { useUiStore } from '@/state/uiStore';
import type { Grid } from '@/engine';

const TARGET: Grid = [
  [1, 0],
  [0, 1],
];

beforeEach(() => {
  useUiStore.getState().init(TARGET);
});

describe('uiStore', () => {
  it('init creates a zero cellState of the target size and starts playing', () => {
    const s = useUiStore.getState();
    expect(s.cellState).toEqual([[0, 0], [0, 0]]);
    expect(s.tool).toBe('fill');
    expect(s.errors).toBe(0);
    expect(s.status).toBe('playing');
    expect(s.history).toHaveLength(0);
  });

  it('fill tap toggles a cell 0 -> 1 -> 0', () => {
    useUiStore.getState().tap(0, 0);
    expect(useUiStore.getState().cellState[0][0]).toBe(1);
    useUiStore.getState().tap(0, 0);
    expect(useUiStore.getState().cellState[0][0]).toBe(0);
  });

  it('mark tap toggles a cell 0 -> 2 -> 0', () => {
    useUiStore.getState().setTool('mark');
    useUiStore.getState().tap(0, 1);
    expect(useUiStore.getState().cellState[0][1]).toBe(2);
    useUiStore.getState().tap(0, 1);
    expect(useUiStore.getState().cellState[0][1]).toBe(0);
  });

  it('honors a per-tap tool override (long-press)', () => {
    // tool is 'fill'; override to 'mark' for this one tap
    useUiStore.getState().tap(0, 1, 'mark');
    expect(useUiStore.getState().cellState[0][1]).toBe(2);
  });

  it('undo reverts the last tap and shrinks history', () => {
    useUiStore.getState().tap(0, 0);
    useUiStore.getState().tap(1, 1);
    expect(useUiStore.getState().history).toHaveLength(2);
    useUiStore.getState().undo();
    expect(useUiStore.getState().cellState[1][1]).toBe(0);
    expect(useUiStore.getState().history).toHaveLength(1);
  });

  it('counts a wrong fill as a mistake and un-counts it on undo', () => {
    useUiStore.getState().tap(0, 1); // (0,1) target is 0 -> wrong fill
    expect(useUiStore.getState().errors).toBe(1);
    useUiStore.getState().undo();
    expect(useUiStore.getState().errors).toBe(0);
  });

  it('does not count a correct fill as a mistake', () => {
    useUiStore.getState().tap(0, 0); // target 1 -> correct
    expect(useUiStore.getState().errors).toBe(0);
  });

  it('detects a win when the filled cells exactly match the target', () => {
    useUiStore.getState().tap(0, 0);
    useUiStore.getState().tap(1, 1);
    const s = useUiStore.getState();
    expect(s.status).toBe('won');
    expect(s.isWon()).toBe(true);
    expect(typeof s.elapsedMs).toBe('number');
    expect(s.elapsedMs as number).toBeGreaterThanOrEqual(0);
  });

  it('ignores taps after a win', () => {
    useUiStore.getState().tap(0, 0);
    useUiStore.getState().tap(1, 1); // win
    useUiStore.getState().tap(0, 1); // should be ignored
    expect(useUiStore.getState().cellState[0][1]).toBe(0);
    expect(useUiStore.getState().status).toBe('won');
  });

  it('reset clears cellState, errors, and history and keeps playing', () => {
    useUiStore.getState().tap(0, 1);
    useUiStore.getState().reset();
    const s = useUiStore.getState();
    expect(s.cellState).toEqual([[0, 0], [0, 0]]);
    expect(s.errors).toBe(0);
    expect(s.history).toHaveLength(0);
    expect(s.status).toBe('playing');
  });

  it('marks never count as fills for winning', () => {
    // Mark the two solution cells instead of filling them -> not a win.
    useUiStore.getState().tap(0, 0, 'mark');
    useUiStore.getState().tap(1, 1, 'mark');
    expect(useUiStore.getState().status).toBe('playing');
  });
});
