import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock useHint hook
const mockDismiss = jest.fn();
let mockVisible = false;
jest.mock('../../src/hooks/useHint', () => ({
  useHint: () => ({ visible: mockVisible, dismiss: mockDismiss }),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated/mock');
  return {
    ...actual,
    useSharedValue: (init: number) => ({ value: init }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (val: number) => val,
    withSpring: (val: number) => val,
  };
});

// Mock PlantCompanion to avoid SVG issues in tests
jest.mock('../../src/components/PlantCompanion', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      mockReact.createElement(View, { testID: 'plant-companion', ...props }),
  };
});

import HintBubble from '../../src/components/HintBubble';

beforeEach(() => {
  mockVisible = false;
  mockDismiss.mockClear();
});

describe('HintBubble', () => {
  it('returns null when not visible', () => {
    mockVisible = false;
    const { toJSON } = render(<HintBubble hintKey="discover_swipe" />);
    expect(toJSON()).toBeNull();
  });

  it('renders hint message when visible', () => {
    mockVisible = true;
    const { getByText } = render(<HintBubble hintKey="discover_swipe" />);
    expect(
      getByText(/Swipe right if you feel a spark/),
    ).toBeTruthy();
  });

  it('renders PlantCompanion when visible', () => {
    mockVisible = true;
    const { getByTestId } = render(<HintBubble hintKey="discover_swipe" />);
    expect(getByTestId('plant-companion')).toBeTruthy();
  });

  it('calls dismiss when bubble is pressed', () => {
    mockVisible = true;
    const { getByLabelText } = render(<HintBubble hintKey="discover_swipe" />);
    fireEvent.press(getByLabelText('Dismiss hint'));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders correct message for different hint keys', () => {
    mockVisible = true;
    const { getByText } = render(<HintBubble hintKey="garden_overview" />);
    expect(
      getByText(/Welcome to your Garden/),
    ).toBeTruthy();
  });
});
