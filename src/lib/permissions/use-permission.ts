import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

type PermissionResponse = {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
};

type UsePermissionReturn = {
  status: PermissionResponse['status'];
  request: () => Promise<void>;
  openSettings: () => Promise<void>;
};

export function usePermission(
  requestFn: () => Promise<PermissionResponse>,
): UsePermissionReturn {
  const [status, setStatus]
    = useState<PermissionResponse['status']>('undetermined');

  const request = useCallback(async () => {
    try {
      const result = await requestFn();
      setStatus(result.status);
    }
    catch {
      setStatus('denied');
    }
  }, [requestFn]);

  const openSettings = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  return { status, request, openSettings };
}
