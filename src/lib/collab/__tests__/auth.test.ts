jest.mock('../client', () => ({
  zivaFetchUnauth: jest.fn(),
}));

jest.mock('../store', () => ({
  useCollabStore: {
    getState: jest.fn(() => ({
      setCredentials: jest.fn(),
    })),
  },
}));

const mockZivaFetchUnauth = jest.requireMock('../client').zivaFetchUnauth as jest.Mock;

describe('collab Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginViaRest', () => {
    it('exports loginViaRest function', () => {
      const { loginViaRest } = require('../auth');
      expect(typeof loginViaRest).toBe('function');
    });

    it('calls zivaFetchUnauth with POST method', async () => {
      mockZivaFetchUnauth.mockResolvedValue({
        status: 'error',
        message: 'Invalid credentials',
      });

      const { loginViaRest } = require('../auth');
      await loginViaRest('testuser', 'password123');

      expect(mockZivaFetchUnauth).toHaveBeenCalledWith(
        'POST',
        '/login',
        expect.any(Object),
      );
    });

    it('includes username and password in request body', async () => {
      mockZivaFetchUnauth.mockResolvedValue({
        status: 'error',
      });

      const { loginViaRest } = require('../auth');
      await loginViaRest('testuser', 'password123');

      const call = (mockZivaFetchUnauth as jest.Mock).mock.calls[0];
      const body = call[2];

      expect(body.user).toBe('testuser');
      expect(body.password).toBe('password123');
    });

    it('returns response from server', async () => {
      const expectedResponse = {
        status: 'error',
        message: 'Invalid credentials',
      };
      mockZivaFetchUnauth.mockResolvedValue(expectedResponse);

      const { loginViaRest } = require('../auth');
      const result = await loginViaRest('testuser', 'password123');

      expect(result).toEqual(expectedResponse);
    });

    it('throws on network error', async () => {
      mockZivaFetchUnauth.mockRejectedValue(new Error('Network down'));

      const { loginViaRest } = require('../auth');

      await expect(loginViaRest('testuser', 'password123')).rejects.toThrow('Network down');
    });
  });

  describe('socialLoginViaRest', () => {
    it('exports socialLoginViaRest function', () => {
      const { socialLoginViaRest } = require('../auth');
      expect(typeof socialLoginViaRest).toBe('function');
    });

    it('calls zivaFetchUnauth with POST method for Google', async () => {
      mockZivaFetchUnauth.mockResolvedValue({
        status: 'error',
      });

      const { socialLoginViaRest } = require('../auth');
      const googleData = {
        serviceName: 'google' as const,
        accessToken: 'google_token_123',
      };

      await socialLoginViaRest(googleData);

      expect(mockZivaFetchUnauth).toHaveBeenCalledWith('POST', '/login', googleData);
    });

    it('calls zivaFetchUnauth with POST method for Apple', async () => {
      mockZivaFetchUnauth.mockResolvedValue({
        status: 'error',
      });

      const { socialLoginViaRest } = require('../auth');
      const appleData = {
        serviceName: 'apple' as const,
        identityToken: 'apple_token_123',
      };

      await socialLoginViaRest(appleData);

      expect(mockZivaFetchUnauth).toHaveBeenCalledWith('POST', '/login', appleData);
    });

    it('returns response from server', async () => {
      const expectedResponse = { status: 'success', data: { authToken: 'token' } };
      mockZivaFetchUnauth.mockResolvedValue(expectedResponse);

      const { socialLoginViaRest } = require('../auth');
      const googleData = {
        serviceName: 'google' as const,
        accessToken: 'token123',
      };

      const result = await socialLoginViaRest(googleData);

      expect(result).toEqual(expectedResponse);
    });

    it('handles errors from server', async () => {
      const errorResponse = {
        status: 'error',
        error: 'Invalid token',
      };
      mockZivaFetchUnauth.mockResolvedValue(errorResponse);

      const { socialLoginViaRest } = require('../auth');
      const googleData = {
        serviceName: 'google' as const,
        accessToken: 'invalid',
      };

      const result = await socialLoginViaRest(googleData);

      expect(result.status).toBe('error');
      expect(result.error).toBe('Invalid token');
    });
  });
});
