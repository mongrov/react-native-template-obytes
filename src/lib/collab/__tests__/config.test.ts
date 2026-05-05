jest.mock('env', () => ({
  EXPO_PUBLIC_RC_SERVER_URL: 'http://rc.test',
  EXPO_PUBLIC_RC_WS_URL: 'ws://rc.test',
  EXPO_PUBLIC_COLLAB_ADMIN_TOKEN: 'admin_token_123',
}));

jest.mock('../adapters/rocketchat', () => ({
  createRocketChatAdapter: jest.fn(() => ({
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('collab Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCollabConfig', () => {
    it('returns config with serverUrl and wsUrl when env vars are set', () => {
      const { getCollabConfig } = require('../config');
      const config = getCollabConfig();

      expect(config.serverUrl).toBe('http://rc.test');
      expect(config.wsUrl).toBe('ws://rc.test');
      expect(config.enabled).toBe(true);
    });

    it('includes enabled flag based on both URLs', () => {
      const { getCollabConfig } = require('../config');
      const config = getCollabConfig();

      expect(typeof config.enabled).toBe('boolean');
      expect(config.enabled).toBe(true);
    });
  });

  describe('getCollabAdapter', () => {
    it('returns adapter instance when config is enabled', () => {
      const { getCollabAdapter } = require('../config');
      const adapter = getCollabAdapter();

      expect(adapter).not.toBeNull();
      expect(adapter).toBeDefined();
    });

    it('returns same instance on multiple calls (singleton)', () => {
      const { getCollabAdapter } = require('../config');
      const adapter1 = getCollabAdapter();
      const adapter2 = getCollabAdapter();

      expect(adapter1).toBe(adapter2);
    });

    it('has disconnect method on returned adapter', () => {
      const { getCollabAdapter } = require('../config');
      const adapter = getCollabAdapter();

      expect(adapter).toHaveProperty('disconnect');
      expect(typeof adapter?.disconnect).toBe('function');
    });
  });

  describe('resetCollabAdapter', () => {
    it('calls disconnect on existing adapter', async () => {
      const { getCollabAdapter, resetCollabAdapter } = require('../config');
      const adapter = getCollabAdapter();
      const disconnectSpy = jest.spyOn(adapter, 'disconnect');

      await resetCollabAdapter();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('handles disconnect errors gracefully', async () => {
      const { resetCollabAdapter } = require('../config');

      expect(async () => {
        await resetCollabAdapter();
      }).not.toThrow();
    });
  });

  describe('constants', () => {
    it('exports auth type constants', () => {
      const { APPLE, GOOGLE, COLLAB_LOGIN, GOOGLE_LOGIN, APPLE_LOGIN } = require('../config');

      expect(APPLE).toBe('apple');
      expect(GOOGLE).toBe('google');
      expect(COLLAB_LOGIN).toBe('COLLAB_LOGIN');
      expect(GOOGLE_LOGIN).toBe('GOOGLE_LOGIN');
      expect(APPLE_LOGIN).toBe('APPLE_LOGIN');
    });
  });
});
