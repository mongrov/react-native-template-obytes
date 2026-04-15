import { NativeModules } from 'react-native';
import { 
  initTimon, 
  initBucket,
  createDatabase, 
  createTable,
  listDatabases,
  deleteDatabase,
  insert, 
  query,
  cloudSinkParquet,
  cloudFetchParquetBatch,
  getSyncMetadata,
  preloadTables,
  currentDataViewUser,
  setCurrentDataViewUser
} from '../timon-module';
import * as constants from '../constants';

const mockTimonModule = NativeModules.TimonModule;

describe('Timon Module Bridge', () => {
  let isIosSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setCurrentDataViewUser(null);
    if (isIosSpy) isIosSpy.mockRestore();
  });


  afterEach(() => {
  });



  describe('initTimon', () => {
    it('calls native initTimon with correct arguments', async () => {
      mockTimonModule.initTimon.mockResolvedValue('success');
      const result = await initTimon('/path', 60, 'user123');
      
      expect(mockTimonModule.initTimon).toHaveBeenCalledWith('/path', 60, 'user123');
      expect(result).toBe('success');
    });

    it('throws error if native call fails', async () => {
      const error = new Error('Native Fail');
      mockTimonModule.initTimon.mockRejectedValue(error);
      
      await expect(initTimon('/path', 60, 'user123')).rejects.toThrow('Native Fail');
    });
  });

  describe('createDatabase', () => {
    it('returns parsed JSON from native result', async () => {
      const mockResult = JSON.stringify({ status: 'ok' });
      mockTimonModule.createDatabase.mockResolvedValue(mockResult);
      
      const result = await createDatabase('myDB');
      
      expect(mockTimonModule.createDatabase).toHaveBeenCalledWith('myDB');
      expect(result).toEqual({ status: 'ok' });
    });

    it('returns error object if native call throws', async () => {
      const error = new Error('Create Error');
      mockTimonModule.createDatabase.mockRejectedValue(error);
      
      const result = await createDatabase('myDB');
      expect(result).toBe(error);
    });
  });

  describe('insert', () => {
    it('stringifies JSON data before calling native insert', async () => {
      const data = [{ id: 1 }];
      mockTimonModule.insert.mockResolvedValue('{"rows": 1}');
      
      const result = await insert('db', 'table', data);
      
      expect(mockTimonModule.insert).toHaveBeenCalledWith('db', 'table', JSON.stringify(data));
      expect(result).toEqual({ rows: 1 });
    });
  });

  describe('query', () => {
    it('includes user info in query if set', async () => {
      const user = { _id: '123', username: 'tester' };
      setCurrentDataViewUser(user);
      
      mockTimonModule.query.mockResolvedValue('{"json_value": []}');
      
      await query('db', 'SELECT * FROM table');
      
      // on iOS (default in jest-expo), calls (dbName, sqlQuery, userNameId)
      expect(mockTimonModule.query).toHaveBeenCalledWith(
        'db', 
        'SELECT * FROM table', 
        '123_tester'
      );
    });

    it('passes null as user if no current user set', async () => {
      mockTimonModule.query.mockResolvedValue('{"json_value": []}');
      await query('db', 'SELECT * FROM table');
      expect(mockTimonModule.query).toHaveBeenCalledWith('db', 'SELECT * FROM table', null);
    });
  });
  describe('initBucket', () => {
    it('calls native initBucket with correct params', async () => {
      mockTimonModule.initBucket.mockResolvedValue('ok');
      await initBucket('ep', 'bucket', 'key', 'secret', 'region');
      expect(mockTimonModule.initBucket).toHaveBeenCalledWith('ep', 'bucket', 'key', 'secret', 'region');
    });
  });

  describe('createTable', () => {
    it('calls native createTable and parses result', async () => {
      mockTimonModule.createTable.mockResolvedValue('{"success":true}');
      const result = await createTable('db', 'table', { schema: 1 });
      expect(mockTimonModule.createTable).toHaveBeenCalledWith('db', 'table', { schema: 1 });
      expect(result).toEqual({ success: true });
    });
  });

  describe('listDatabases', () => {
    it('returns json_value from native listDatabases', async () => {
      mockTimonModule.listDatabases.mockResolvedValue('{"json_value":["db1"]}');
      const result = await listDatabases();
      expect(result).toEqual(['db1']);
    });
  });

  describe('deleteDatabase', () => {
    it('calls native deleteDatabase', async () => {
      mockTimonModule.deleteDatabase.mockResolvedValue('{"deleted":true}');
      const result = await deleteDatabase('myDB');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('cloudSinkParquet', () => {
    it('returns json_value on success', async () => {
      mockTimonModule.cloudSinkParquet.mockResolvedValue('{"json_value": "uploaded"}');
      const result = await cloudSinkParquet('db', 'table');
      expect(result).toBe('uploaded');
    });

    it('returns specific error message if time sync issue detected', async () => {
      const msg = 'The difference between the request time and the current time is too large.';
      mockTimonModule.cloudSinkParquet.mockResolvedValue(JSON.stringify({ message: msg }));
      const result = await cloudSinkParquet('db', 'table');
      expect(result).toBe(msg);
    });

  });

  describe('cloudFetchParquetBatch', () => {
    it('normalizes arrays to strings on iOS', async () => {
      // Mock Platform.OS to return 'ios'
      const { Platform } = require('react-native');
      const originalOS = Platform.OS;
      Platform.OS = 'ios';
      
      try {
        mockTimonModule.cloudFetchParquetBatch.mockResolvedValue('{"json_value":[]}');
        await cloudFetchParquetBatch(['user'], ['db'], ['table'], {});
        
        expect(mockTimonModule.cloudFetchParquetBatch).toHaveBeenCalledWith(
          JSON.stringify(['user']),
          JSON.stringify(['db']),
          JSON.stringify(['table']),
          {}
        );
      } finally {
        Platform.OS = originalOS;
      }
    });
  });


  describe('getSyncMetadata', () => {
    it('returns parsed metadata', async () => {
      mockTimonModule.getSyncMetadata.mockResolvedValue('{"lastSync": 123}');
      const result = await getSyncMetadata('db', 'table');
      expect(result).toEqual({ lastSync: 123 });
    });
  });

  describe('preloadTables', () => {
    it('calls native nativePreloadTables', async () => {
      mockTimonModule.nativePreloadTables.mockResolvedValue('{"done":true}');
      const result = await preloadTables('db', ['t1'], 'user');
      expect(mockTimonModule.nativePreloadTables).toHaveBeenCalledWith('db', ['t1'], 'user');
      expect(result).toEqual({ done: true });
    });
  });
});

