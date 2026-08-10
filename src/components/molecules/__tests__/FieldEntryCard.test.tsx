import { render, screen } from '@testing-library/react-native';
import { FieldEntryCard } from '@/components/molecules';
import type { FieldEntry } from '@/engine';

const base: FieldEntry = { title: 'MOTHMAN · CASE 014', body: 'Winged figure at dusk.', voiceStyle: 'notebook' };

describe('FieldEntryCard', () => {
  it('renders the title and body', () => {
    render(<FieldEntryCard entry={base} testID="entry" />);
    expect(screen.getByText('MOTHMAN · CASE 014')).toBeTruthy();
    expect(screen.getByText('Winged figure at dusk.')).toBeTruthy();
  });

  it('shows the victorian glyph for the victorian voice', () => {
    render(<FieldEntryCard entry={{ ...base, voiceStyle: 'victorian' }} testID="entry" />);
    expect(screen.getByTestId('entry-victorian')).toBeTruthy();
  });

  it('does not show the victorian glyph for the notebook voice', () => {
    render(<FieldEntryCard entry={base} testID="entry" />);
    expect(screen.queryByTestId('entry-victorian')).toBeNull();
  });

  it('renders a thumbnail when provided', () => {
    render(<FieldEntryCard entry={base} thumbnail={[[1, 0], [0, 1]]} testID="entry" />);
    expect(screen.getByTestId('entry-thumb')).toBeTruthy();
  });
});
