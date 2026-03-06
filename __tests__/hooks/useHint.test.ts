import { renderHook, act } from '@testing-library/react-native';

// Mock expo-secure-store
const mockStore: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockStore[key] || null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockStore[key] = value;
    return Promise.resolve();
  }),
}));

// Mock react-native-reanimated to avoid native module issues
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated/mock');
  return actual;
});

import { useHint, _resetHintCache } from '../../src/hooks/useHint';
import * as SecureStore from 'expo-secure-store';

beforeEach(() => {
  jest.useFakeTimers();
  _resetHintCache();
  // Clear mock store
  Object.keys(mockStore).forEach((key) => delete mockStore[key]);
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useHint', () => {
  it('starts with visible: false', () => {
    const { result } = renderHook(() => useHint('discover_swipe'));
    expect(result.current.visible).toBe(false);
  });

  it('becomes visible after delay', async () => {
    const { result } = renderHook(() => useHint('discover_swipe'));

    // Flush the initCache promise
    await act(async () => {
      await Promise.resolve();
    });

    // Advance past the delay (2500ms for discover_swipe)
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.visible).toBe(true);
  });

  it('dismiss sets visible to false and persists', async () => {
    const { result } = renderHook(() => useHint('discover_swipe'));

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.visible).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'companion_hints_dismissed',
      expect.stringContaining('discover_swipe'),
    );
  });

  it('does not show hint that was previously dismissed', async () => {
    // Pre-populate store with dismissed hint
    mockStore['companion_hints_dismissed'] = JSON.stringify(['discover_swipe']);

    const { result } = renderHook(() => useHint('discover_swipe'));

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.visible).toBe(false);
  });

  it('auto-dismisses after 6 seconds', async () => {
    const { result } = renderHook(() => useHint('garden_overview'));

    await act(async () => {
      await Promise.resolve();
    });

    // garden_overview delay is 2000ms
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    expect(result.current.visible).toBe(true);

    // Auto-dismiss after 6000ms
    await act(async () => {
      jest.advanceTimersByTime(6500);
    });

    expect(result.current.visible).toBe(false);
  });
});
