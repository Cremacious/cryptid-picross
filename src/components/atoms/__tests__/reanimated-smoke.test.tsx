import { render, screen } from '@testing-library/react-native';
import Animated from 'react-native-reanimated';

describe('reanimated foundation', () => {
  it('renders an Animated.View without crashing', () => {
    render(<Animated.View testID="anim" />);
    expect(screen.getByTestId('anim')).toBeTruthy();
  });
});
