jest.mock('../config', () => ({
  getCollabConfig: jest.fn(() => ({
    serverUrl: 'http://rc.test',
    wsUrl: 'ws://rc.test',
    enabled: true,
  })),
  COLLAB_ADMIN_TOKEN: 'admin_secret_token',
}));

jest.mock('../store', () => ({
  useCollabStore: {
    getState: jest.fn(() => ({
      authToken: 'token123',
      userId: 'user456',
    })),
  },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

global.fetch = jest.fn();

const mockUseCollabStore = jest.requireMock('../store').useCollabStore as any;

describe('Collab Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('zivaFetchUnauth', () => {
    it('makes POST request with body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true, data: 'response' }),
      });

      const { zivaFetchUnauth } = require('../client');
      const result = await zivaFetchUnauth('POST', '/login', {
        user: 'testuser',
        password: 'password123',
      });

      expect(result).toEqual({ success: true, data: 'response' });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://rc.test/api/v1/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            user: 'testuser',
            password: 'password123',
          }),
        })
      );
    });

    it('makes GET request without body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const { zivaFetchUnauth } = require('../client');
      await zivaFetchUnauth('GET', '/public');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://rc.test/api/v1/public',
        expect.objectContaining({
          method: 'GET',
          body: undefined,
        })
      );
    });

    it('includes default headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
      });

      const { zivaFetchUnauth } = require('../client');
      await zivaFetchUnauth('GET', '/public');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers;

      expect(headers['Accept']).toBe('application/json');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toBe('ios');
    });
  });

  describe('zivaFetch', () => {
    it('makes authenticated POST request with auth headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const { zivaFetch } = require('../client');
      await zivaFetch('POST', '/users.update', { name: 'New Name' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://rc.test/api/v1/users.update',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Auth-Token': 'token123',
            'X-User-Id': 'user456',
          }),
        })
      );
    });

    it('throws error when not authenticated', async () => {
      mockUseCollabStore.getState.mockReturnValueOnce({
        authToken: null,
        userId: null,
      });

      const { zivaFetch } = require('../client');
      await expect(zivaFetch('POST', '/users.update', {})).rejects.toThrow(
        'Not authenticated with collab'
      );
    });

    it('throws error when only userId is missing', async () => {
      mockUseCollabStore.getState.mockReturnValueOnce({
        authToken: 'token123',
        userId: null,
      });

      const { zivaFetch } = require('../client');
      await expect(zivaFetch('POST', '/users.update', {})).rejects.toThrow(
        'Not authenticated with collab'
      );
    });

    it('adds params to GET request as query string', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const { zivaFetch } = require('../client');
      await zivaFetch('GET', '/channels.list', undefined, {
        query: '{"test":"value"}',
      });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('?');
      expect(url).toContain('query=');
    });

    it('does not add params to POST request body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const { zivaFetch } = require('../client');
      await zivaFetch('POST', '/users.update', { name: 'New Name' }, {
        query: 'shouldBeIgnored',
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const url = call[0];
      const body = call[1].body;

      expect(url).not.toContain('query=');
      expect(body).toBe(JSON.stringify({ name: 'New Name' }));
    });
  });

  describe('zivaFetchAdmin', () => {
    it('exports zivaFetchAdmin function', () => {
      const { zivaFetchAdmin } = require('../client');
      expect(typeof zivaFetchAdmin).toBe('function');
    });
  });

  describe('Base URL construction', () => {
    it('constructs correct base URL from config', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
      });

      const { zivaFetchUnauth } = require('../client');
      await zivaFetchUnauth('GET', '/test');

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toBe('http://rc.test/api/v1/test');
    });
  });
});
