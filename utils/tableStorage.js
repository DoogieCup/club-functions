'use strict';
(function(){
    var Promise = require('promise');
    var azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;
    module.exports = class{
        constructor(log, tableName, connectionString){
            this.log = log;
            this.tableName = tableName;
            this.tableCreated = false;
            this.connectionString = connectionString;
        };

        ensureTable(){
            let tableService = azure.createTableService(this.connectionString);
            var that = this;
            return new Promise((accept, reject) => {
                try{
                    if (that.tableCreated){
                        accept();
                        return;
                    }

                    that.log(`${that.tableName} does not exist, creating`);
                        tableService.createTableIfNotExists(that.tableName, (error, result, response) => {
                        that.log(`Create ${that.tableName} table callback executing`);
                        if (error) {
                            that.log(`ERROR ${error}`);
                            reject(error);
                            return;
                        }

                        that.log(`Ensured ${that.tableName} table, result ${JSON.stringify(result)}`);
                        that.tableCreated = true;
                        accept();
                    });
                }
                catch (err){
                    that.log(`Error creating the table ${that.tableName}\n${err} ${err.stack}`);
                    reject(err);
                }
            });
        };

        insertEntity(entity){
            let tableService = azure.createTableService(this.connectionString);
            return new Promise((accept, reject) => {
                var that = this;
                try{
                    this.ensureTable().then(() => {
                        tableService.insertEntity(that.tableName, entity, function(error, insertResult, response) {
                            if (error) {
                                that.log(`Failed to insert entity to table ${that.tableName} ${entity.PartitionKey['_']} ${entity.RowKey['_']} ${JSON.stringify(entity)}\n${error}\n${insertResult}`);
                                reject(error);
                                return;
                            }
                            that.log(`New entity written to ${that.tableName} ${entity.PartitionKey['_']} ${entity.RowKey['_']} ${JSON.stringify(entity)}`);
                            accept(entity);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                } catch(err){
                    reject(err);
                }
            });
        };

        retrieveEntity(partitionKey, rowKey){
            let tableService = azure.createTableService(this.connectionString);
            this.log(`Retrieving entity ${partitionKey} ${rowKey}`);
            return new Promise((accept, reject) => {
                var that = this;
                try{
                    tableService.retrieveEntity(that.tableName, String(partitionKey), String(rowKey), (error, result, response) => {
                        if (error){
                            if (response.statusCode === 404){
                                accept();
                                return;
                            }

                            that.log(`Failed to retrieve entity from table ${that.tableName} ${partitionKey} ${rowKey}\n${error}\n${result}`);
                            reject(error);
                            return;
                        }

                        accept(result);
                    });
                } catch(err) {
                    reject(err);
                }
            });
        };

        upsertEntity(partitionKey, rowKey, fnChangeObject){
            let tableService = azure.createTableService(this.connectionString);
                var log = this.log;
                log(`Upserting entity ${partitionKey} ${rowKey}`);
                return this.ensureTable().then(() => {
                    return this.retrieveEntity(partitionKey, rowKey)
                        .then((originalEntity) => {
                            if (!originalEntity){
                                originalEntity = {
                                    PartitionKey: entGen.String(String(partitionKey)),
                                    RowKey: entGen.String(String(rowKey))
                                };
                                log(`Existing entity not found, creating new entity ${JSON.stringify(originalEntity)}`);
                            }

                            let updatedEntity = fnChangeObject(originalEntity);
                            return this.replaceEntity(updatedEntity);
                        });
                });
        };

        replaceEntity(entity){
            let tableService = azure.createTableService(this.connectionString);
            return new Promise((accept, reject) => {
                var that = this;
                try{
                    this.ensureTable().then(() => {
                        tableService.insertOrReplaceEntity(that.tableName, entity, {checkEtag: true}, function(error, insertResult, response) {
                            if (error) {
                                that.log(`Failed to insert entity to table ${that.tableName} ${entity.PartitionKey['_']} ${entity.RowKey['_']} ${JSON.stringify(entity)}\n${error}\n${insertResult}`);
                                reject(error);
                                return;
                            }
                            that.log(`New entity written to ${that.tableName} ${entity.PartitionKey['_']} ${entity.RowKey['_']} ${JSON.stringify(entity)}`);
                            accept(entity);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                } catch(err){
                    reject(err);
                }
            });
        }

        queryEntities(query){
            let tableService = azure.createTableService(this.connectionString);
            this.log(`Received query ${query}`);
            return new Promise((accept, reject) => {
                var that = this;
                try{
                    var queryObject = new azure.TableQuery()
                        .where(query);

                    var results = [];
                    var recurse = (cont) => {
                        tableService.queryEntities(that.tableName, queryObject, cont, function(err, result){
                            try{
                                if (err){reject(err);}

                                result.entries.forEach((entry) => {
                                    results.push(entry);
                                });

                                if (!result.continuationToken){
                                    accept(results);
                                    return;
                                }
                                this.log(`Found continuation, recursing.`);
                                recurse(result.continuationToken);
                            } catch(err){
                                reject(err);
                            }
                        });
                    };

                    recurse(null);
                } catch(err){
                    reject(err);
                }
            });
        };
    };
})();