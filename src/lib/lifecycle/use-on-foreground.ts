import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useOnForeground(callback: () => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        callbackRef.current();
      }
    });
    return () => subscription.remove();
  }, []);
}
