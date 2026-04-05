import { useCallback, useSyncExternalStore } from 'react';

import { storage } from '../storage';

const IS_FIRST_TIME = 'IS_FIRST_TIME';

// Simple external store for first-time state
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function getSnapshot(): boolean {
  const value = storage.getString(IS_FIRST_TIME);
  // If no value stored, it's the first time
  return value === undefined || value === 'true';
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function useIsFirstTime() {
  const isFirstTime = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setIsFirstTime = useCallback((value: boolean) => {
    storage.set(IS_FIRST_TIME, String(value));
    emitChange();
  }, []);

  return [isFirstTime, setIsFirstTime] as const;
}
