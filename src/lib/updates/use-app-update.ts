import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';

type AppUpdateState = {
  isAvailable: boolean;
  isChecking: boolean;
  update: () => Promise<void>;
};

export function useAppUpdate(): AppUpdateState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (__DEV__)
      return;

    try {
      setIsChecking(true);
      const result = await Updates.checkForUpdateAsync();
      setIsAvailable(result.isAvailable);
    }
    catch {
      // Silently handle update check errors
    }
    finally {
      setIsChecking(false);
    }
  }, []);

  const update = useCallback(async () => {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
    catch {
      // Silently handle update errors
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return { isAvailable, isChecking, update };
}
