//
//  TimonModule.m
//  MyTestApp
//
//  Derived from ziva_app, updated for current timon lib.rs iOS FFI.
//

#import <Foundation/Foundation.h>
#import "TimonModule.h"
#import <dlfcn.h>
#import "timon.h"

@implementation TimonModule

RCT_EXPORT_MODULE();

// Declare Rust functions
extern char* nativeInitTimon(const char* storage_path, unsigned int bucket_interval, const char* user_name);
extern char* nativeCreateDatabase(const char* db_name);
extern char* nativeCreateTable(const char* db_name, const char* table_name, const char* schema);
extern char* nativeListDatabases(void);
extern char* nativeListTables(const char* db_name);
extern char* nativeDeleteDatabase(const char* db_name);
extern char* nativeDeleteTable(const char* db_name, const char* table_name);
extern char* nativeInsert(const char* db_name, const char* table_name, const char* json_data);
extern char* nativeQuery(const char* db_name, const char* sql_query, const char* username, int limit_partitions);
extern char* nativeInitBucket(const char* bucket_endpoint, const char* bucket_name, const char* access_key_id, const char* secret_access_key, const char* bucket_region);
// extern char* nativeQueryBucket(const char* username, const char* db_name, const char* sql_query, const char* date_range_json);
extern char* nativeCloudSinkParquet(const char* dbName, const char* tableName);
extern char* nativeCloudFetchParquet(const char* userName, const char* dbName, const char* tableName, const char* dateRangeJson);
extern char* nativeCloudSyncParquet(const char* dbName, const char* tableName, const char* dateRangeJson, const char* userName);
// extern char *nativeGetAllSyncMetadata(const char *db_name);
// extern char *nativeGetSyncMetadata(const char *db_name, const char *table_name);
extern char *nativeCloudFetchParquetBatch(const char *usernames_json, const char *db_names_json, const char *table_names_json, const char *date_range_json);

// Function to free Rust strings
extern void rust_string_free(char* s);

// Helper function to convert Rust string to NSString and free memory
NSString* stringFromRust(char* rustString) {
    if (rustString == NULL) {
        return nil;
    }
    NSString *nsString = [NSString stringWithUTF8String:rustString];
    rust_string_free(rustString);
    return nsString;
}

// ******************************** File Storage Methods ********************************

// initTimon
RCT_EXPORT_METHOD(initTimon:(NSString *)storagePath
                  bucketInterval:(nonnull NSNumber *)bucketInterval
                  userName:(NSString *)userName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_storagePath = [storagePath UTF8String];
    uint32_t bucketIntervalValue = [bucketInterval unsignedIntValue];
    const char *c_userName = [userName UTF8String];

    // Call the nativeInitTimon function
    char *result = nativeInitTimon(c_storagePath, bucketIntervalValue, c_userName);

    if (result == NULL) {
        reject(@"Error", @"Failed to initialize Timon", nil);
        return;
    }

    NSString *nsResult = [NSString stringWithUTF8String:result];

    if (nsResult != nil) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to process Timon result", nil);
    }
}

// createDatabase
RCT_EXPORT_METHOD(createDatabase:(NSString *)dbName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_dbName = [dbName UTF8String];

    // Call the nativeCreateDatabase function
    char *result = nativeCreateDatabase(c_dbName);

    if (result == NULL) {
        reject(@"Error", @"Failed to create database", nil);
        return;
    }

    NSString *nsResult = stringFromRust(result);

    if (nsResult) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to process database creation result", nil);
    }
}

// createTable
RCT_EXPORT_METHOD(createTable:(NSString *)dbName
                  tableName:(NSString *)tableName
                  schema:(NSString *)schema
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_dbName = [dbName UTF8String];
    const char *c_tableName = [tableName UTF8String];
    const char *c_schema = [schema UTF8String];

    char *result = nativeCreateTable(c_dbName, c_tableName, c_schema);
    if (result == NULL) {
        reject(@"Error", @"Failed to create table", nil);
        return;
    }

    // Convert the result from Rust (C string) to NSString
     NSString *nsResult = stringFromRust(result);

    if (nsResult) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to process table creation result", nil);
    }
}

// listDatabases
RCT_EXPORT_METHOD(listDatabases:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Call the nativeListDatabases function
    char *result = nativeListDatabases();

    if (result == NULL) {
        reject(@"Error", @"Failed to list databases", nil);
        return;
    }

    // Convert the result from Rust (C string) to NSString
    NSString *nsResult = stringFromRust(result);

    if (nsResult) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to process database list", nil);
    }
}

// listTables
RCT_EXPORT_METHOD(listTables:(NSString *)dbName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_dbName = [dbName UTF8String];

    // Call the nativeListTables function
    char *result = nativeListTables(c_dbName);

    if (result == NULL) {
        reject(@"Error", @"Failed to list tables", nil);
        return;
    }

    // Convert the result from Rust (C string) to NSString
    NSString *nsResult = stringFromRust(result);

    if (nsResult) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to process table list", nil);
    }
}

// deleteDatabase
RCT_EXPORT_METHOD(deleteDatabase:(NSString *)dbName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_dbName = [dbName UTF8String];

    // Call the nativeDeleteDatabase function
    char *result = nativeDeleteDatabase(c_dbName);

    if (result == NULL) {
        reject(@"Error", @"Failed to delete database", nil);
        return;
    }

    // Convert the result from Rust (C string) to NSString
     NSString *nsResult = stringFromRust(result);

    if (nsResult) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to process database deletion result", nil);
    }
}


// deleteTable
RCT_EXPORT_METHOD(deleteTable:(NSString *)dbName
                  tableName:(NSString *)tableName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_dbName = [dbName UTF8String];
    const char *c_tableName = [tableName UTF8String];

    // Call the nativeDeleteTable function
    char *result = nativeDeleteTable(c_dbName, c_tableName);

    if (result == NULL) {
        reject(@"Error", @"Failed to delete table", nil);
        return;
    }

    // Convert the result from Rust (C string) to NSString
    NSString *nsResult = stringFromRust(result);
    if (nsResult) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to process table deletion result", nil);
    }
}

// insert
RCT_EXPORT_METHOD(insert:(NSString *)dbName
                  tableName:(NSString *)tableName
                  jsonData:(NSString *)jsonData
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_dbName = [dbName UTF8String];
    const char *c_tableName = [tableName UTF8String];
    const char *c_jsonData = [jsonData UTF8String];

    char *result = nativeInsert(c_dbName, c_tableName, c_jsonData);
    if (result) {
        NSString *nsResult = stringFromRust(result);
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to insert data", nil);
    }
}

// query
RCT_EXPORT_METHOD(query:(NSString *)dbName
                  sqlQuery:(NSString *)sqlQuery
                  username:(NSString *)username
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        const char *c_dbName = [dbName UTF8String];
        const char *c_sqlQuery = [sqlQuery UTF8String];
        const char *c_username = [username UTF8String];
        
        char *result = nativeQuery(c_dbName, c_sqlQuery, c_username, 0); // limit_partitions=0: query all
        
        if (result) {
            NSString *nsResult = stringFromRust(result);
            resolve(nsResult);
        } else {
            reject(@"Error", @"Failed to query", nil);
        }
    });
}



// ******************************** S3 Compatible Storage ********************************

// initBucket
RCT_EXPORT_METHOD(initBucket:(NSString *)bucketEndpoint
                  bucketName:(NSString *)bucketName
                  accessKeyId:(NSString *)accessKeyId
                  secretAccessKey:(NSString *)secretAccessKey
                  bucketRegion:(NSString *)bucketRegion
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_bucketEndpoint = [bucketEndpoint UTF8String];
    const char *c_bucketName = [bucketName UTF8String];
    const char *c_accessKeyId = [accessKeyId UTF8String];
    const char *c_secretAccessKey = [secretAccessKey UTF8String];
    const char *c_bucketRegion = [bucketRegion UTF8String];
    
    char *result = nativeInitBucket(c_bucketEndpoint, c_bucketName, c_accessKeyId, c_secretAccessKey, c_bucketRegion);
    
    if (result) {
        NSString *nsResult = stringFromRust(result);
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to initialize bucket", nil);
    }
}

// queryBucket
// RCT_EXPORT_METHOD(queryBucket:(NSString *)userName
//                   dbName:(NSString *)dbName
//                   sqlQuery:(NSString *)sqlQuery
//                   dateRange:(NSDictionary *)dateRange
//                   resolver:(RCTPromiseResolveBlock)resolve
//                   rejecter:(RCTPromiseRejectBlock)reject)
// {
//     const char *c_userName = [userName UTF8String];
//     const char *c_dbName = [dbName UTF8String];
//     const char *c_sqlQuery = [sqlQuery UTF8String];
    
//     NSError *error;
//     NSData *jsonData = [NSJSONSerialization dataWithJSONObject:dateRange options:0 error:&error];
//     if (!jsonData) {
//         reject(@"Error", @"Invalid date range", error);
//         return;
//     }
//     NSString *dateRangeJson = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
//     const char *c_dateRangeJson = [dateRangeJson UTF8String];
    
//     char *result = nativeQueryBucket(c_userName, c_dbName, c_sqlQuery, c_dateRangeJson);
    
//     if (result) {
//          NSString *nsResult = stringFromRust(result);
//         free(result); // Free allocated memory
//         resolve(nsResult);
//     } else {
//         reject(@"Error", @"Failed to query bucket", nil);
//     }
// }

// // sinkDailyParquet
// RCT_EXPORT_METHOD(sinkDailyParquet:(NSString *)userName
//                   dbName:(NSString *)dbName
//                   tableName:(NSString *)tableName
//                   resolver:(RCTPromiseResolveBlock)resolve
//                   rejecter:(RCTPromiseRejectBlock)reject)
// {
//     const char *c_userName = [userName UTF8String];
//     const char *c_dbName = [dbName UTF8String];
//     const char *c_tableName = [tableName UTF8String];
//     char *result = Java_com_zivaone_ring_app_TimonModule_sinkDailyParquet(c_userName, c_dbName, c_tableName);
//     NSString *nsResult = stringFromRust(result);
//     if (nsResult) {
//         resolve(nsResult);
//     } else {
//         reject(@"Error", @"Failed to sink daily parquet", nil);
//     }
// }

// @end

// cloudSinkParquet
// nativeCloudSinkParquet takes only (db_name, table_name) in current timon lib.rs.
RCT_EXPORT_METHOD(cloudSinkParquet:(NSString *)dbName
                  tableName:(NSString *)tableName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_dbName = [dbName UTF8String];
    const char *c_tableName = [tableName UTF8String];

    char *result = nativeCloudSinkParquet(c_dbName, c_tableName);
    NSString *nsResult = stringFromRust(result);

    if (nsResult) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to sync cloud parquet", nil);
    }
}


// cloudFetchParquet
RCT_EXPORT_METHOD(cloudFetchParquet:(NSString *)userName
                  dbName:(NSString *)dbName
                  tableName:(NSString *)tableName
                  dateRangeJson:(NSString *)dateRangeJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char *c_userName = [userName UTF8String];
    const char *c_dbName = [dbName UTF8String];
    const char *c_tableName = [tableName UTF8String];
    const char *c_dateRangeJson = [dateRangeJson UTF8String];
    
    // Corrected function call
    char *result = nativeCloudFetchParquet(c_userName, c_dbName, c_tableName, c_dateRangeJson);
    
    NSString *nsResult = stringFromRust(result);
    
    if (nsResult) {
        resolve(nsResult);
    } else {
        reject(@"Error", @"Failed to fetch cloud parquet", nil);
    }
}

// cloudSyncParquet
RCT_EXPORT_METHOD(cloudSyncParquet:(NSString *)userName
                    dbName:(NSString *)dbName
                    tableName:(NSString *)tableName
                    dateRangeJson:(NSString *)dateRangeJson
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject)
    {
        const char *c_userName = [userName UTF8String];
        const char *c_dbName = [dbName UTF8String];
        const char *c_tableName = [tableName UTF8String];
        const char *c_dateRangeJson = [dateRangeJson UTF8String];
        
        // Call the native Rust function
        char *result = nativeCloudSyncParquet(c_dbName, c_tableName, c_dateRangeJson, c_userName);
        
        NSString *nsResult = stringFromRust(result);
        
        if (nsResult) {
            resolve(nsResult);
        } else {
            reject(@"Error", @"Failed to sync cloud parquet", nil);
        }
}


// RCT_EXPORT_METHOD(getAllSyncMetadata:(NSString *)dbName resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// {
//   @try {
//     const char *cDbName = [dbName UTF8String];
//     const char *cResult = nativeGetAllSyncMetadata(cDbName);

//     if (cResult != NULL) {
//       NSString *result = [NSString stringWithUTF8String:cResult];
//       resolve(result);
//     } else {
//       reject(@"native_error", @"Received null from nativeGetAllSyncMetadata", nil);
//     }
//   } @catch (NSException *exception) {
//     reject(@"exception", exception.reason, nil);
//   }
// }

// RCT_EXPORT_METHOD(getSyncMetadata:(NSString *)dbName
//                   tableName:(NSString *)tableName
//                   resolver:(RCTPromiseResolveBlock)resolve
//                   rejecter:(RCTPromiseRejectBlock)reject)
// {
//   @try {
//     const char *cDbName = [dbName UTF8String];
//     const char *cTableName = [tableName UTF8String];
//     const char *cResult = nativeGetSyncMetadata(cDbName, cTableName);

//     if (cResult != NULL) {
//       NSString *result = [NSString stringWithUTF8String:cResult];
//       resolve(result);
//       // Optionally free memory if Rust allocates
//       // free_rust_string((char *)cResult);
//     } else {
//       reject(@"native_error", @"Received null from nativeGetSyncMetadata", nil);
//     }
//   } @catch (NSException *exception) {
//     reject(@"exception", exception.reason, nil);
//   }
// }

// cloudFetchParquetBatch
RCT_EXPORT_METHOD(cloudFetchParquetBatch:(NSString *)usernamesJson
                    dbNamesJson:(NSString *)dbNamesJson
                    tableNamesJson:(NSString *)tableNamesJson
                    dateRangeJson:(NSString *)dateRangeJson
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject)
        {
            const char *c_usernamesJson = [usernamesJson UTF8String];
            const char *c_dbNamesJson = [dbNamesJson UTF8String];
            const char *c_tableNamesJson = [tableNamesJson UTF8String];
            const char *c_dateRangeJson = [dateRangeJson UTF8String];

            // Call the native Rust function
            char *result = nativeCloudFetchParquetBatch(c_usernamesJson, c_dbNamesJson, c_tableNamesJson, c_dateRangeJson);

            NSString *nsResult = stringFromRust(result);

            if (nsResult) {
                resolve(nsResult);
            } else {
                reject(@"Error", @"Failed to fetch cloud parquet batch", nil);
            }
        }

@end
