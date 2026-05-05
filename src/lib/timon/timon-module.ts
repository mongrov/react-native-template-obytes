/* eslint-disable max-params */
import { NativeModules } from 'react-native';

import { IS_ANDROID, IS_IOS } from './constants';
import { handleCatch } from './utils/handle-catch';

const { TimonModule } = NativeModules;

type User = { _id: string; username: string } | null;
export const currentDataViewUser = { current: null as User };

export function setCurrentDataViewUser(user: User) {
  currentDataViewUser.current = user;
}

function parseJson(obj: unknown): Record<string, unknown> {
  if (obj == null)
    throw new Error('Null response from native module');
  if (typeof obj !== 'string')
    throw new Error(`Expected string response, got ${typeof obj}`);
  return JSON.parse(obj);
}

export async function initTimon(
  storagePath: string,
  bucketInterval: number,
  userId: string,
) {
  try {
    return await TimonModule.initTimon(storagePath, bucketInterval, userId);
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
    return await TimonModule.initBucket(
      bucketEndPoint,
      bucketName,
      accessKeyId,
      secretAccessKey,
      bucketRegion,
    );
  }
  catch (error) {
    handleCatch(error, 'initBucket error', true, { bucketEndPoint });
    throw error;
  }
}

export async function createDatabase(dbName: string) {
  try {
    return parseJson(await TimonModule.createDatabase(dbName));
  }
  catch (error) {
    handleCatch(error, 'createDatabase error', true, { dbName });
    throw error;
  }
}

export async function createTable(dbName: string, tableName: string, schema: string) {
  try {
    return parseJson(await TimonModule.createTable(dbName, tableName, schema));
  }
  catch (error) {
    handleCatch(error, 'createTable error', true, { dbName, tableName });
    throw error;
  }
}

export async function listDatabases() {
  try {
    return parseJson(await TimonModule.listDatabases()).json_value as string[] | undefined;
  }
  catch (error) {
    handleCatch(error, 'listDatabases error');
    throw error;
  }
}

export async function listTables(dbName: string) {
  try {
    return parseJson(await TimonModule.listTables(dbName)).json_value as string[] | undefined;
  }
  catch (error) {
    handleCatch(error, 'listTables error', true, { dbName });
    throw error;
  }
}

export async function deleteDatabase(dbName: string) {
  try {
    const result = await TimonModule.deleteDatabase(dbName);
    return parseJson(result);
  }
  catch (error) {
    handleCatch(error, 'deleteDatabase error', true, { dbName });
    throw error;
  }
}

export async function deleteTable(dbName: string, tableName: string) {
  try {
    const result = await TimonModule.deleteTable(dbName, tableName);
    return parseJson(result);
  }
  catch (error) {
    handleCatch(error, 'deleteTable error', true, { dbName, tableName });
    throw error;
  }
}

export async function query(dbName: string, sqlQuery: string, limitPartitions: number = 0) {
  try {
    const userNameId = currentDataViewUser.current
      ? `${currentDataViewUser.current._id}_${currentDataViewUser.current.username}`
      : null;

    const result = IS_ANDROID
      ? await TimonModule.query(dbName, sqlQuery, userNameId, limitPartitions)
      : await TimonModule.query(dbName, sqlQuery, userNameId);

    return parseJson(result).json_value;
  }
  catch (error) {
    handleCatch(error, 'query error', true, { dbName, sqlQuery });
    throw error;
  }
}

export async function insert(dbName: string, tableName: string, jsonData: object[]) {
  try {
    return parseJson(await TimonModule.insert(dbName, tableName, JSON.stringify(jsonData)));
  }
  catch (error) {
    handleCatch(error, 'insert error', true, { dbName, tableName, jsonData });
    throw error;
  }
}

export async function cloudSinkParquet(dbName: string, tableName: string) {
  try {
    const parsedResult = parseJson(await TimonModule.cloudSinkParquet(dbName, tableName));
    const jsonValue = parsedResult.json_value;
    if (
      !jsonValue
      && (parsedResult?.message as string)?.includes(
        'The difference between the request time and the current time is too large.',
      )
    ) {
      throw new Error((parsedResult?.message as string) ?? 'Unknown error during cloudSinkParquet');
    }
    return jsonValue;
  }
  catch (error) {
    handleCatch(error, 'cloudSinkParquet error', true, { dbName, tableName });
    throw error;
  }
}

export async function cloudFetchParquet(
  userName: string[],
  dbName: string,
  tableName: string,
  dateRange: unknown,
) {
  try {
    return parseJson(
      await TimonModule.cloudFetchParquet(userName, dbName, tableName, dateRange),
    ).json_value;
  }
  catch (error) {
    handleCatch(error, 'cloudFetchParquet error', true, { dbName, tableName });
    throw error;
  }
}

export async function cloudFetchParquetBatch(
  userNames: string[],
  dbNames: string[],
  tableNames: string[],
  dateRange: unknown,
) {
  try {
    const normalize = <T>(value: T) => (IS_IOS ? JSON.stringify(value) : value);

    return parseJson(
      await TimonModule.cloudFetchParquetBatch(
        normalize(userNames),
        normalize(dbNames),
        normalize(tableNames),
        dateRange,
      ),
    ).json_value;
  }
  catch (error) {
    handleCatch(error, 'cloudFetchParquetBatch error', true, { dbNames, tableNames });
    throw error;
  }
}

export async function cloudSyncParquet(
  userName: string,
  dbName: string,
  tableName: string,
  dateRange: unknown,
) {
  try {
    return parseJson(
      await TimonModule.cloudSyncParquet(userName, dbName, tableName, JSON.stringify(dateRange)),
    ).json_value;
  }
  catch (error) {
    handleCatch(error, 'cloudSyncParquet error', true, { userName, dbName, tableName });
    throw error;
  }
}

export async function queryBucket(
  userName: string,
  dbName: string,
  sqlQuery: string,
  dateRange: unknown,
) {
  try {
    return parseJson(
      await TimonModule.queryBucket(userName, dbName, sqlQuery, dateRange),
    ).json_value;
  }
  catch (error) {
    handleCatch(error, 'queryBucket error', true, { userName, sqlQuery, dateRange });
    throw error;
  }
}

export async function getSyncMetadata(dbName: string, tableName: string) {
  try {
    return parseJson(await TimonModule.getSyncMetadata(dbName, tableName));
  }
  catch (error) {
    handleCatch(error, 'getSyncMetadata error', true, { dbName, tableName });
  }
}

export async function getAllSyncMetadata(dbName: string) {
  try {
    const jsonValue = parseJson(await TimonModule.getAllSyncMetadata(dbName)).json_value as
      | { tables?: unknown }
      | undefined;
    return jsonValue?.tables;
  }
  catch (error) {
    handleCatch(error, 'getAllSyncMetadata error', true, { dbName });
  }
}

export async function preloadTables(
  dbName: string,
  tableNames: string[],
  userName: string | null,
) {
  try {
    return parseJson(await TimonModule.nativePreloadTables(dbName, tableNames, userName));
  }
  catch (error) {
    handleCatch(error, 'preloadTables error', true, { dbName, tableNames });
  }
}
