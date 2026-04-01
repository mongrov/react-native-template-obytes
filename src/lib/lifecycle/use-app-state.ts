import type { AppStateStatus } from 'react-native';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useAppState(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  return appState;
}
