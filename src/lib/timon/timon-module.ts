/* eslint-disable max-params */
/**
 * Timon Native Module Bridge
 * Wraps the native TimonModule (Rust-backed DB engine) exposed via React Native NativeModules.
 * All database operations go through this file.
 */
import { NativeModules } from 'react-native';

import { IS_ANDROID, IS_IOS } from './constants';
import { handleCatch } from './utils/handle-catch';

const { TimonModule } = NativeModules;

export const currentDataViewUser = { current: null as any };

export const setCurrentDataViewUser = (user: any) => {
  currentDataViewUser.current = user;
};

const parseJson = (obj: any) => {
  try {
    if (!obj) throw Error('Null response');
    if (typeof obj !== 'string') throw Error(obj);
    return JSON.parse(obj);
  } catch (_err) {
    return {};
  }
};

export async function initTimon(
  storagePath: string,
  bucketInterval: number,
  userId: string
) {
  try {
    const result = await TimonModule.initTimon(
      storagePath,
      bucketInterval,
      userId
    );
    return result;
  } catch (error) {
    handleCatch(error, 'initTimon error', true, { storagePath });
    throw error;
  }
}

export async function initBucket(
  bucketEndPoint: string,
  bucketName: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucketRegion: string
) {
  try {
    const result = await TimonModule.initBucket(
      bucketEndPoint,
      bucketName,
      accessKeyId,
      secretAccessKey,
      bucketRegion
    );
    return result;
  } catch (error) {
    handleCatch(error, 'initBucket error', true, { bucketEndPoint });
    throw error;
  }
}

export const createDatabase = async (dbName: string) => {
  try {
    const result = await TimonModule.createDatabase(dbName);
    return parseJson(result);
  } catch (error) {
    handleCatch(error, 'createDatabase error', true, { dbName });
    return error;
  }
};

export const createTable = async (
  dbName: string,
  tableName: string,
  schema: any
) => {
  try {
    const result = await TimonModule.createTable(dbName, tableName, schema);
    return parseJson(result);
  } catch (error) {
    handleCatch(error, 'createTable error', true, { dbName, tableName });
    return error;
  }
};

export const listDatabases = async () => {
  try {
    const result = await TimonModule.listDatabases();
    const jsonValue = parseJson(result)?.['json_value'];
    return jsonValue;
  } catch (error) {
    handleCatch(error, 'listDatabases error');
    return error;
  }
};

export const listTables = async (dbName: string) => {
  try {
    const result = await TimonModule.listTables(dbName);
    const json_value = parseJson(result)['json_value'];
    return json_value;
  } catch (error) {
    handleCatch(error, 'listTables error', true, { dbName });
    return error;
  }
};

export const deleteDatabase = async (dbName: string) => {
  try {
    let result = await TimonModule.deleteDatabase(dbName);
    return parseJson(result);
  } catch (error) {
    handleCatch(error, 'deleteDatabase error', true, { dbName });
    return error;
  }
};

export const deleteTable = async (dbName: string, tableName: string) => {
  try {
    let result = await TimonModule.deleteTable(dbName, tableName);
    return parseJson(result);
  } catch (error) {
    handleCatch(error, 'deleteTable error', true, { dbName, tableName });
    return error;
  }
};

export const query = async (
  dbName: string,
  sqlQuery: string,
  limitPartitions: number = 0
) => {
  try {
    const userNameId = currentDataViewUser?.current
      ? `${currentDataViewUser?.current?._id}_${currentDataViewUser?.current?.username}`
      : null;
    let result;
    if (IS_ANDROID) {
      result = await TimonModule.query(
        dbName,
        sqlQuery,
        userNameId,
        limitPartitions
      );
    } else {
      result = await TimonModule.query(dbName, sqlQuery, userNameId);
    }

    const jsonValue = parseJson(result)['json_value'];
    return jsonValue;
  } catch (error) {
    handleCatch(error, 'query error', true, { dbName, sqlQuery });
    return error;
  }
};

export const insert = async (
  dbName: string,
  tableName: string,
  jsonData: object[]
) => {
  try {
    const result = await TimonModule.insert(
      dbName,
      tableName,
      JSON.stringify(jsonData)
    );
    return parseJson(result);
  } catch (error) {
    handleCatch(error, 'insert error', true, { dbName, tableName, jsonData });
    return error;
  }
};

export const cloudSinkParquet = async (dbName: string, tableName: string) => {
  try {
    const result = await TimonModule.cloudSinkParquet(dbName, tableName);
    const parsedResult = parseJson(result);
    const jsonValue = parsedResult['json_value'];
    if (
      !jsonValue &&
      parsedResult?.message?.includes(
        'The difference between the request time and the current time is too large.'
      )
    ) {
      throw parsedResult?.message || 'Unknown error during cloudSinkParquet';
    }
    return jsonValue;
  } catch (error) {
    handleCatch(error, 'cloudSinkParquet error', true, { dbName, tableName });
    return error;
  }
};

export const cloudFetchParquet = async (
  userName: string[],
  dbName: string,
  tableName: string,
  dateRange: any
) => {
  try {
    const result = await TimonModule.cloudFetchParquet(
      userName,
      dbName,
      tableName,
      dateRange
    );
    const jsonValue = parseJson(result)['json_value'];
    return jsonValue;
  } catch (error) {
    handleCatch(error, 'cloudFetchParquet error', true, { dbName, tableName });
    return error;
  }
};

export const cloudFetchParquetBatch = async (
  userNames: string[],
  dbNames: string[],
  tableNames: string[],
  dateRange: any
) => {
  try {
    const normalize = <T>(value: T) => (IS_IOS ? JSON.stringify(value) : value);

    const result = await TimonModule.cloudFetchParquetBatch(
      normalize(userNames),
      normalize(dbNames),
      normalize(tableNames),
      dateRange
    );

    const jsonValue = parseJson(result)['json_value'];
    return jsonValue;
  } catch (error) {
    handleCatch(error, 'cloudFetchParquetBatch error', true, {
      dbNames,
      tableNames,
    });
    return error;
  }
};

export const cloudSyncParquet = async (
  userName: string,
  dbName: string,
  tableName: string,
  dateRange: any
) => {
  try {
    const result = await TimonModule.cloudSyncParquet(
      userName,
      dbName,
      tableName,
      JSON.stringify(dateRange)
    );
    const jsonValue = parseJson(result)['json_value'];
    return jsonValue;
  } catch (error) {
    handleCatch(error, 'cloudSyncParquet error', true, {
      userName,
      dbName,
      tableName,
    });
    return error;
  }
};

export const queryBucket = async (
  userName: string,
  dbName: string,
  sqlQuery: string,
  dateRange: any
) => {
  try {
    const result = await TimonModule.queryBucket(
      userName,
      dbName,
      sqlQuery,
      dateRange
    );
    const jsonValue = JSON.parse(result)['json_value'];
    return jsonValue;
  } catch (error) {
    handleCatch(error, 'queryBucket error', true, {
      userName,
      sqlQuery,
      dateRange,
    });
    return error;
  }
};

export const getSyncMetadata = async (dbName: string, tableName: string) => {
  try {
    const result = await TimonModule.getSyncMetadata(dbName, tableName);
    return parseJson(result);
  } catch (error) {
    console.error('Error calling getSyncMetadata: ', error);
  }
};

export const getAllSyncMetadata = async (dbName: string) => {
  try {
    const result = await TimonModule.getAllSyncMetadata(dbName);
    const parsedResult = parseJson(result)['json_value'];
    const tables = parsedResult?.tables;
    return tables;
  } catch (error) {
    console.error('Error calling getAllSyncMetadata: ', error);
  }
};

export const preloadTables = async (
  dbName: string,
  tableNames: string[],
  userName: string | null
) => {
  try {
    const result = await TimonModule.nativePreloadTables(
      dbName,
      tableNames,
      userName
    );
    const parsedResult = parseJson(result);
    return parsedResult;
  } catch (error) {
    console.error('Error calling preloadTables: ', error);
  }
};
