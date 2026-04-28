jest.mock('../client', () => ({
  zivaFetch: jest.fn(),
  zivaFetchAdmin: jest.fn(),
}));

jest.mock('../store', () => ({
  useCollabStore: {
    getState: jest.fn(() => ({
      authToken: 'token123',
      userId: 'user123',
    })),
  },
}));

jest.mock('../config', () => ({
  getCollabConfig: jest.fn(() => ({
    serverUrl: 'http://rc.test',
    wsUrl: 'ws://rc.test',
  })),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

global.fetch = jest.fn();

const mockZivaFetch = jest.requireMock('../client').zivaFetch as jest.Mock;
const mockZivaFetchAdmin = jest.requireMock('../client').zivaFetchAdmin as jest.Mock;
const mockUseCollabStore = jest.requireMock('../store').useCollabStore as any;

describe('Collab Users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('updateUsersInfo', () => {
    it('updates user profile with data', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { updateUsersInfo } = require('../users');
      const updateData = {
        name: 'New Name',
        email: 'newemail@test.com',
      };

      await updateUsersInfo(updateData);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/users.update',
        {
          userId: 'user123',
          data: updateData,
        }
      );
    });

    it('includes customFields in update', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { updateUsersInfo } = require('../users');
      const updateData = {
        customFields: {
          department: 'Engineering',
          role: 'Developer',
        },
      };

      await updateUsersInfo(updateData);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/users.update',
        expect.objectContaining({
          userId: 'user123',
          data: updateData,
        })
      );
    });

    it('returns updated user info', async () => {
      const response = {
        success: true,
        user: {
          _id: 'user123',
          username: 'testuser',
          name: 'New Name',
        },
      };
      mockZivaFetch.mockResolvedValue(response);

      const { updateUsersInfo } = require('../users');
      const result = await updateUsersInfo({ name: 'New Name' });

      expect(result).toEqual(response);
    });

    it('handles update error', async () => {
      const response = { success: false, error: 'Validation failed' };
      mockZivaFetch.mockResolvedValue(response);

      const { updateUsersInfo } = require('../users');
      const result = await updateUsersInfo({ name: 'Invalid' });

      expect(result).toEqual(response);
    });
  });

  describe('getAllCustomFields', () => {
    it('fetches custom fields for current user', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
        user: {
          customFields: { role: 'admin' },
        },
      });

      const { getAllCustomFields } = require('../users');
      await getAllCustomFields();

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/users.info',
        undefined,
        {
          userId: 'user123',
          fields: JSON.stringify({ customFields: 1 }),
        }
      );
    });

    it('fetches custom fields for specified user', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
        user: {
          customFields: { role: 'user' },
        },
      });

      const { getAllCustomFields } = require('../users');
      await getAllCustomFields('other_user_id');

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/users.info',
        undefined,
        {
          userId: 'other_user_id',
          fields: JSON.stringify({ customFields: 1 }),
        }
      );
    });

    it('falls back to store userId when not provided', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
        user: { customFields: {} },
      });

      const { getAllCustomFields } = require('../users');
      await getAllCustomFields();

      const call = (mockZivaFetch as jest.Mock).mock.calls[0];
      expect(call[3].userId).toBe('user123');
    });

    it('uses empty string when both userId params missing', async () => {
      mockUseCollabStore.getState.mockReturnValueOnce({
        userId: null,
      });

      mockZivaFetch.mockResolvedValue({
        success: true,
      });

      const { getAllCustomFields } = require('../users');
      await getAllCustomFields();

      const call = (mockZivaFetch as jest.Mock).mock.calls[0];
      expect(call[3].userId).toBe('');
    });

    it('returns user custom fields', async () => {
      const response = {
        success: true,
        user: {
          _id: 'user123',
          customFields: {
            department: 'Engineering',
            level: 'Senior',
          },
        },
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getAllCustomFields } = require('../users');
      const result = await getAllCustomFields();

      expect(result.user?.customFields).toEqual({
        department: 'Engineering',
        level: 'Senior',
      });
    });
  });

  describe('updateCustomFields', () => {
    it('updates custom fields via updateUsersInfo', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { updateCustomFields } = require('../users');
      const customFields = {
        department: 'Sales',
        region: 'APAC',
      };

      await updateCustomFields(customFields);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/users.update',
        {
          userId: 'user123',
          data: { customFields },
        }
      );
    });

    it('wraps fields in customFields key', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { updateCustomFields } = require('../users');
      await updateCustomFields({
        role: 'manager',
        permissions: ['edit', 'delete'],
      });

      const call = (mockZivaFetch as jest.Mock).mock.calls[0];
      const body = call[2];

      expect(body.data.customFields).toEqual({
        role: 'manager',
        permissions: ['edit', 'delete'],
      });
    });

    it('returns update result', async () => {
      const response = { success: true, user: { customFields: { updated: true } } };
      mockZivaFetch.mockResolvedValue(response);

      const { updateCustomFields } = require('../users');
      const result = await updateCustomFields({ updated: true });

      expect(result.success).toBe(true);
    });
  });

  describe('updateUserFieldsInCollab', () => {
    it('calls admin endpoint with data', async () => {
      mockZivaFetchAdmin.mockResolvedValue({ success: true });

      const { updateUserFieldsInCollab } = require('../users');
      const adminData = { userId: 'target_user', role: 'moderator' };

      await updateUserFieldsInCollab(adminData);

      expect(mockZivaFetchAdmin).toHaveBeenCalledWith(
        'POST',
        '/vertivusers.update',
        adminData
      );
    });

    it('returns admin update response', async () => {
      const response = { success: true, message: 'User updated' };
      mockZivaFetchAdmin.mockResolvedValue(response);

      const { updateUserFieldsInCollab } = require('../users');
      const result = await updateUserFieldsInCollab({});

      expect(result).toEqual(response);
    });

    it('handles admin update error', async () => {
      const response = { success: false, error: 'Permission denied' };
      mockZivaFetchAdmin.mockResolvedValue(response);

      const { updateUserFieldsInCollab } = require('../users');
      const result = await updateUserFieldsInCollab({});

      expect(result.success).toBe(false);
    });
  });

  describe('resetUserAvatar', () => {
    it('posts reset avatar request', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { resetUserAvatar } = require('../users');
      const data = { reason: 'User requested' };

      await resetUserAvatar(data);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/users.resetAvatar',
        data
      );
    });

    it('returns reset response', async () => {
      const response = { success: true };
      mockZivaFetch.mockResolvedValue(response);

      const { resetUserAvatar } = require('../users');
      const result = await resetUserAvatar({});

      expect(result).toEqual(response);
    });

    it('handles reset error', async () => {
      const response = { success: false, error: 'Avatar not found' };
      mockZivaFetch.mockResolvedValue(response);

      const { resetUserAvatar } = require('../users');
      const result = await resetUserAvatar({});

      expect(result.success).toBe(false);
    });
  });

  describe('updateUserAvatar', () => {
    it('posts avatar FormData to users.setAvatar', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const { updateUserAvatar } = require('../users');
      const formData = new FormData();
      formData.append('image', new Blob(['test']), 'avatar.jpg');

      await updateUserAvatar(formData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://rc.test/api/v1/users.setAvatar',
        expect.objectContaining({
          method: 'POST',
          body: formData,
        })
      );
    });

    it('includes auth headers in avatar upload', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const { updateUserAvatar } = require('../users');
      const formData = new FormData();

      await updateUserAvatar(formData);

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers;

      expect(headers['X-Auth-Token']).toBe('token123');
      expect(headers['X-User-Id']).toBe('user123');
      expect(headers['User-Agent']).toBe('ios');
    });

    it('throws error when not authenticated', async () => {
      mockUseCollabStore.getState.mockReturnValueOnce({
        authToken: null,
        userId: null,
      });

      const { updateUserAvatar } = require('../users');
      const formData = new FormData();

      await expect(updateUserAvatar(formData)).rejects.toThrow(
        'Not authenticated with collab'
      );
    });

    it('throws error when only authToken missing', async () => {
      mockUseCollabStore.getState.mockReturnValueOnce({
        authToken: null,
        userId: 'user123',
      });

      const { updateUserAvatar } = require('../users');
      const formData = new FormData();

      await expect(updateUserAvatar(formData)).rejects.toThrow(
        'Not authenticated with collab'
      );
    });

    it('returns upload response', async () => {
      const response = { success: true, url: 'avatar_url' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(response),
      });

      const { updateUserAvatar } = require('../users');
      const formData = new FormData();

      const result = await updateUserAvatar(formData);

      expect(result).toEqual(response);
    });

    it('handles upload error', async () => {
      const response = { success: false, error: 'File too large' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(response),
      });

      const { updateUserAvatar } = require('../users');
      const formData = new FormData();

      const result = await updateUserAvatar(formData);

      expect(result.success).toBe(false);
    });
  });
});
