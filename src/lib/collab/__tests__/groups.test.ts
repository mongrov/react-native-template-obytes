jest.mock('../client', () => ({
  zivaFetch: jest.fn(),
}));

const mockZivaFetch = jest.requireMock('../client').zivaFetch as jest.Mock;

describe('collab Groups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWellnessGroup', () => {
    it('creates channel with name and members', async () => {
      mockZivaFetch.mockResolvedValue({ success: true, _id: 'channel123' });

      const { createWellnessGroup } = require('../groups');
      const channelData = {
        name: 'Wellness Group',
        members: ['user1', 'user2'],
      };

      await createWellnessGroup(channelData);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/channels.create',
        channelData,
      );
    });

    it('creates read-only channel', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { createWellnessGroup } = require('../groups');
      const channelData = {
        name: 'Read Only Group',
        readOnly: true,
      };

      await createWellnessGroup(channelData);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/channels.create',
        expect.objectContaining({
          name: 'Read Only Group',
          readOnly: true,
        }),
      );
    });

    it('returns created channel data', async () => {
      const response = { success: true, _id: 'channel456', name: 'New Group' };
      mockZivaFetch.mockResolvedValue(response);

      const { createWellnessGroup } = require('../groups');
      const result = await createWellnessGroup({ name: 'New Group' });

      expect(result).toEqual(response);
    });

    it('handles creation error', async () => {
      const response = { success: false, error: 'Channel already exists' };
      mockZivaFetch.mockResolvedValue(response);

      const { createWellnessGroup } = require('../groups');
      const result = await createWellnessGroup({ name: 'Duplicate' });

      expect(result).toEqual(response);
    });
  });

  describe('joinChannel', () => {
    it('joins channel by roomId', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { joinChannel } = require('../groups');
      await joinChannel({ roomId: 'room123' });

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/channels.join',
        { roomId: 'room123' },
      );
    });

    it('joins channel with joinCode', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { joinChannel } = require('../groups');
      await joinChannel({ roomId: 'room123', joinCode: 'code456' });

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/channels.join',
        expect.objectContaining({
          roomId: 'room123',
          joinCode: 'code456',
        }),
      );
    });

    it('joins channel by roomName', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { joinChannel } = require('../groups');
      await joinChannel({ roomName: 'general' });

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/channels.join',
        { roomName: 'general' },
      );
    });

    it('returns join result', async () => {
      const response = { success: true, channel: { _id: 'room123' } };
      mockZivaFetch.mockResolvedValue(response);

      const { joinChannel } = require('../groups');
      const result = await joinChannel({ roomId: 'room123' });

      expect(result).toEqual(response);
    });

    it('handles join failure', async () => {
      const response = { success: false, error: 'Channel not found' };
      mockZivaFetch.mockResolvedValue(response);

      const { joinChannel } = require('../groups');
      const result = await joinChannel({ roomId: 'invalid' });

      expect(result).toEqual(response);
    });
  });

  describe('getChannelMembers', () => {
    it('fetches members for channel', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
        members: [],
      });

      const { getChannelMembers } = require('../groups');
      await getChannelMembers('channel123');

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/channels.members',
        undefined,
        { roomId: 'channel123' },
      );
    });

    it('returns members list with metadata', async () => {
      const response = {
        success: true,
        members: [
          { _id: 'user1', username: 'john', name: 'John Doe', status: 'online' },
          { _id: 'user2', username: 'jane', name: 'Jane Smith', status: 'away' },
        ],
        count: 2,
        total: 2,
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getChannelMembers } = require('../groups');
      const result = await getChannelMembers('channel123');

      expect(result.members).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('returns empty members list', async () => {
      const response = {
        success: true,
        members: [],
        count: 0,
        total: 0,
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getChannelMembers } = require('../groups');
      const result = await getChannelMembers('empty_channel');

      expect(result.members).toEqual([]);
    });

    it('handles fetch error', async () => {
      const response = { success: false, error: 'Channel not found' };
      mockZivaFetch.mockResolvedValue(response);

      const { getChannelMembers } = require('../groups');
      const result = await getChannelMembers('invalid_id');

      expect(result.success).toBe(false);
    });
  });

  describe('getChannelsList', () => {
    it('fetches channels with query', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
        channels: [],
      });

      const { getChannelsList } = require('../groups');
      const query = { search: 'wellness' };

      await getChannelsList(query);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/channels.list',
        undefined,
        {
          query: JSON.stringify(query),
        },
      );
    });

    it('returns list of channels', async () => {
      const response = {
        success: true,
        channels: [
          { _id: 'ch1', name: 'General', usersCount: 10 },
          { _id: 'ch2', name: 'Random', usersCount: 5 },
        ],
        count: 2,
        total: 2,
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getChannelsList } = require('../groups');
      const result = await getChannelsList({});

      expect(result.channels).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('stringifies complex query objects', async () => {
      mockZivaFetch.mockResolvedValue({ success: true, channels: [] });

      const { getChannelsList } = require('../groups');
      const complexQuery = {
        search: 'wellness',
        exclude: ['archived'],
        minUsers: 2,
      };

      await getChannelsList(complexQuery);

      const call = (mockZivaFetch as jest.Mock).mock.calls[0];
      const params = call[3];

      expect(params.query).toBe(JSON.stringify(complexQuery));
    });

    it('handles no channels found', async () => {
      const response = {
        success: true,
        channels: [],
        count: 0,
        total: 0,
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getChannelsList } = require('../groups');
      const result = await getChannelsList({ search: 'nonexistent' });

      expect(result.channels).toEqual([]);
    });
  });

  describe('getGroupMessages', () => {
    it('fetches message history for room', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
        messages: [],
      });

      const { getGroupMessages } = require('../groups');
      await getGroupMessages('room123');

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/channels.history',
        undefined,
        { roomId: 'room123' },
      );
    });

    it('includes pagination parameters', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
        messages: [],
      });

      const { getGroupMessages } = require('../groups');
      await getGroupMessages('room123', {
        count: '50',
        offset: '100',
      });

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/channels.history',
        undefined,
        expect.objectContaining({
          roomId: 'room123',
          count: '50',
          offset: '100',
        }),
      );
    });

    it('returns message history', async () => {
      const response = {
        success: true,
        messages: [
          { _id: 'msg1', msg: 'Hello', u: { _id: 'user1' } },
          { _id: 'msg2', msg: 'Hi there', u: { _id: 'user2' } },
        ],
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getGroupMessages } = require('../groups');
      const result = await getGroupMessages('room123');

      expect(result).toEqual(response);
    });

    it('handles empty message history', async () => {
      const response = {
        success: true,
        messages: [],
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getGroupMessages } = require('../groups');
      const result = await getGroupMessages('room123');

      expect(result.messages).toEqual([]);
    });
  });

  describe('sendGroupMessage', () => {
    it('sends message to group', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { sendGroupMessage } = require('../groups');
      const messageData = {
        rid: 'room123',
        msg: 'Hello group!',
      };

      await sendGroupMessage(messageData);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/chat.sendMessage',
        { message: messageData },
      );
    });

    it('wraps message data in message field', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { sendGroupMessage } = require('../groups');
      const messageData = {
        rid: 'room456',
        msg: 'Test message',
      };

      await sendGroupMessage(messageData);

      const call = (mockZivaFetch as jest.Mock).mock.calls[0];
      const body = call[2];

      expect(body.message).toEqual(messageData);
    });

    it('returns sent message data', async () => {
      const response = {
        success: true,
        message: {
          _id: 'newmsg123',
          msg: 'Hello group!',
          ts: '2026-04-24T10:30:00.000Z',
        },
      };
      mockZivaFetch.mockResolvedValue(response);

      const { sendGroupMessage } = require('../groups');
      const result = await sendGroupMessage({
        rid: 'room123',
        msg: 'Hello group!',
      });

      expect(result).toEqual(response);
    });

    it('handles send failure', async () => {
      const response = { success: false, error: 'Room not found' };
      mockZivaFetch.mockResolvedValue(response);

      const { sendGroupMessage } = require('../groups');
      const result = await sendGroupMessage({
        rid: 'invalid_room',
        msg: 'Test',
      });

      expect(result.success).toBe(false);
    });

    it('handles missing message content', async () => {
      mockZivaFetch.mockResolvedValue({ success: true });

      const { sendGroupMessage } = require('../groups');
      await sendGroupMessage({ rid: 'room123', msg: '' });

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/chat.sendMessage',
        expect.objectContaining({
          message: {
            rid: 'room123',
            msg: '',
          },
        }),
      );
    });
  });
});
