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

export function setCurrentDataViewUser(user: any) {
  currentDataViewUser.current = user;
}

function requireTimonModule() {
  if (!TimonModule) {
    // Keep this exact message — callers (e.g. TimonDataStore) use it to decide fallback behavior.
    throw new Error('NativeModules.TimonModule is null');
  }
  return TimonModule;
}

function parseJson(obj: any) {
  try {
    if (!obj)
      throw new Error('Null response');
    if (typeof obj !== 'string')
      throw new Error(obj);
    return JSON.parse(obj);
  }
  catch {
    return {};
  }
}

export async function initTimon(
  storagePath: string,
  bucketInterval: number,
  userId: string,
) {
  try {
    const mod = requireTimonModule();
    const result = await mod.initTimon(
      storagePath,
      bucketInterval,
      userId,
    );
    return result;
  }
  catch (error) {
    handleCatch(error, 'initTimon error', true, { storagePath });
    throw error;
  }
}

export async function initBucket(
  bucketEndPoint: string,
  bucketName: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucketRegion: string,
) {
  try {
    const mod = requireTimonModule();
    const result = await mod.initBucket(
      bucketEndPoint,
      bucketName,
      accessKeyId,
      secretAccessKey,
      bucketRegion,
    );
    return result;
  }
  catch (error) {
    handleCatch(error, 'initBucket error', true, { bucketEndPoint });
    throw error;
  }
}

export async function createDatabase(dbName: string) {
  try {
    const mod = requireTimonModule();
    const result = await mod.createDatabase(dbName);
    return parseJson(result);
  }
  catch (error) {
    handleCatch(error, 'createDatabase error', true, { dbName });
    return error;
  }
}

export async function createTable(dbName: string, tableName: string, schema: any) {
  try {
    const mod = requireTimonModule();
    const result = await mod.createTable(dbName, tableName, schema);
    return parseJson(result);
  }
  catch (error) {
    handleCatch(error, 'createTable error', true, { dbName, tableName });
    return error;
  }
}

export async function listDatabases() {
  try {
    const mod = requireTimonModule();
    const result = await mod.listDatabases();
    const jsonValue = parseJson(result)?.json_value;
    return jsonValue;
  }
  catch (error) {
    handleCatch(error, 'listDatabases error');
    return error;
  }
}

export async function listTables(dbName: string) {
  try {
    const mod = requireTimonModule();
    const result = await mod.listTables(dbName);
    const json_value = parseJson(result).json_value;
    return json_value;
  }
  catch (error) {
    handleCatch(error, 'listTables error', true, { dbName });
    return error;
  }
}

export async function deleteDatabase(dbName: string) {
  try {
    const mod = requireTimonModule();
    const result = await mod.deleteDatabase(dbName);
    return parseJson(result);
  }
  catch (error) {
    handleCatch(error, 'deleteDatabase error', true, { dbName });
    return error;
  }
}

export async function deleteTable(dbName: string, tableName: string) {
  try {
    const mod = requireTimonModule();
    const result = await mod.deleteTable(dbName, tableName);
    return parseJson(result);
  }
  catch (error) {
    handleCatch(error, 'deleteTable error', true, { dbName, tableName });
    return error;
  }
}

export async function query(dbName: string, sqlQuery: string, limitPartitions: number = 0) {
  try {
    const mod = requireTimonModule();
    const userNameId = currentDataViewUser?.current
      ? `${currentDataViewUser?.current?._id}_${currentDataViewUser?.current?.username}`
      : null;
    let result;
    if (IS_ANDROID) {
      result = await mod.query(
        dbName,
        sqlQuery,
        userNameId,
        limitPartitions,
      );
    }
    else {
      result = await mod.query(dbName, sqlQuery, userNameId);
    }

    const jsonValue = parseJson(result).json_value;
    return jsonValue;
  }
  catch (error) {
    handleCatch(error, 'query error', true, { dbName, sqlQuery });
    return error;
  }
}

export async function insert(dbName: string, tableName: string, jsonData: object[]) {
  try {
    const mod = requireTimonModule();
    const result = await mod.insert(
      dbName,
      tableName,
      JSON.stringify(jsonData),
    );
    return parseJson(result);
  }
  catch (error) {
    handleCatch(error, 'insert error', true, { dbName, tableName, jsonData });
    return error;
  }
}

export async function cloudSinkParquet(dbName: string, tableName: string) {
  try {
    const mod = requireTimonModule();
    const result = await mod.cloudSinkParquet(dbName, tableName);
    const parsedResult = parseJson(result);
    const jsonValue = parsedResult.json_value;
    if (
      !jsonValue
      && parsedResult?.message?.includes(
        'The difference between the request time and the current time is too large.',
      )
    ) {
      throw parsedResult?.message || 'Unknown error during cloudSinkParquet';
    }
    return jsonValue;
  }
  catch (error) {
    handleCatch(error, 'cloudSinkParquet error', true, { dbName, tableName });
    return error;
  }
}

export async function cloudFetchParquet(userName: string[], dbName: string, tableName: string, dateRange: any) {
  try {
    const mod = requireTimonModule();
    const result = await mod.cloudFetchParquet(
      userName,
      dbName,
      tableName,
      dateRange,
    );
    const jsonValue = parseJson(result).json_value;
    return jsonValue;
  }
  catch (error) {
    handleCatch(error, 'cloudFetchParquet error', true, { dbName, tableName });
    return error;
  }
}

export async function cloudFetchParquetBatch(userNames: string[], dbNames: string[], tableNames: string[], dateRange: any) {
  try {
    const normalize = <T>(value: T) => (IS_IOS ? JSON.stringify(value) : value);

    const mod = requireTimonModule();
    const result = await mod.cloudFetchParquetBatch(
      normalize(userNames),
      normalize(dbNames),
      normalize(tableNames),
      dateRange,
    );

    const jsonValue = parseJson(result).json_value;
    return jsonValue;
  }
  catch (error) {
    handleCatch(error, 'cloudFetchParquetBatch error', true, {
      dbNames,
      tableNames,
    });
    return error;
  }
}

export async function cloudSyncParquet(userName: string, dbName: string, tableName: string, dateRange: any) {
  try {
    const mod = requireTimonModule();
    const result = await mod.cloudSyncParquet(
      userName,
      dbName,
      tableName,
      JSON.stringify(dateRange),
    );
    const jsonValue = parseJson(result).json_value;
    return jsonValue;
  }
  catch (error) {
    handleCatch(error, 'cloudSyncParquet error', true, {
      userName,
      dbName,
      tableName,
    });
    return error;
  }
}

export async function queryBucket(userName: string, dbName: string, sqlQuery: string, dateRange: any) {
  try {
    const mod = requireTimonModule();
    const result = await mod.queryBucket(
      userName,
      dbName,
      sqlQuery,
      dateRange,
    );
    const jsonValue = JSON.parse(result).json_value;
    return jsonValue;
  }
  catch (error) {
    handleCatch(error, 'queryBucket error', true, {
      userName,
      sqlQuery,
      dateRange,
    });
    return error;
  }
}

export async function getSyncMetadata(dbName: string, tableName: string) {
  try {
    const mod = requireTimonModule();
    const result = await mod.getSyncMetadata(dbName, tableName);
    return parseJson(result);
  }
  catch (error) {
    console.error('Error calling getSyncMetadata: ', error);
  }
}

export async function getAllSyncMetadata(dbName: string) {
  try {
    const mod = requireTimonModule();
    const result = await mod.getAllSyncMetadata(dbName);
    const parsedResult = parseJson(result).json_value;
    const tables = parsedResult?.tables;
    return tables;
  }
  catch (error) {
    console.error('Error calling getAllSyncMetadata: ', error);
  }
}

export async function preloadTables(dbName: string, tableNames: string[], userName: string | null) {
  try {
    const mod = requireTimonModule();
    const result = await mod.nativePreloadTables(
      dbName,
      tableNames,
      userName,
    );
    const parsedResult = parseJson(result);
    return parsedResult;
  }
  catch (error) {
    console.error('Error calling preloadTables: ', error);
  }
}
