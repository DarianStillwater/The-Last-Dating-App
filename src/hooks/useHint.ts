import { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { COMPANION_HINTS } from '../theme/plantMetaphors';
import { HintKey } from '../types';

const STORE_KEY = 'companion_hints_dismissed';
const AUTO_DISMISS_MS = 6000;

// Module-level cache to avoid repeated SecureStore reads
let dismissedHints = new Set<string>();
let cacheInitialized = false;
let cachePromise: Promise<void> | null = null;

async function initCache(): Promise<void> {
  if (cacheInitialized) return;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        dismissedHints = new Set(parsed);
      }
    } catch {
      // If read fails, start fresh
    }
    cacheInitialized = true;
    cachePromise = null;
  })();

  return cachePromise;
}

async function persistDismissed(): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify([...dismissedHints]));
  } catch {
    // Best-effort persistence
  }
}

export function useHint(hintKey: HintKey) {
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);
  const hint = COMPANION_HINTS[hintKey];

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    let autoTimer: ReturnType<typeof setTimeout>;
    let mounted = true;

    (async () => {
      await initCache();
      if (!mounted || dismissedHints.has(hintKey)) return;

      showTimer = setTimeout(() => {
        if (mounted && !dismissedRef.current) {
          setVisible(true);
          autoTimer = setTimeout(() => {
            if (mounted && !dismissedRef.current) {
              dismiss();
            }
          }, AUTO_DISMISS_MS);
        }
      }, hint.delay);
    })();

    return () => {
      mounted = false;
      clearTimeout(showTimer);
      clearTimeout(autoTimer);
    };
  }, [hintKey]);

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    dismissedHints.add(hintKey);
    persistDismissed();
  };

  return { visible, dismiss };
}

// For testing: reset the module-level cache
export function _resetHintCache(): void {
  dismissedHints = new Set();
  cacheInitialized = false;
  cachePromise = null;
}
