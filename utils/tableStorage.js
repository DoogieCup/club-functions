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
            this.tableService = azure.createTableService(this.connectionString);
        };

        ensureTable(){
            var that = this;
            that.log(`Ensuring ${this.tableName} table`);
            return new Promise((accept, reject) => {
                try{
                    if (that.tableCreated){
                        accept();
                        return;
                    }

                    that.log(`${that.tableName} does not exist, creating`);
                        that.tableService.createTableIfNotExists(that.tableName, (error, result, response) => {
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
            return new Promise((accept, reject) => {
                var that = this;
                try{
                    this.ensureTable().then(() => {
                        that.tableService.insertEntity(that.tableName, entity, function(error, insertResult, response) {
                            if (error) {
                                that.log(`Failed to insert entity to table ${that.tableName} ${entity.PartitionKey['_']} ${entity.PartitionKey['_']} ${JSON.stringify(entity)}\n${error}\n${result}`);
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
            this.log(`Retrieving entity ${partitionKey} ${rowKey}`);
            return new Promise((accept, reject) => {
                var that = this;
                try{
                    that.tableService.retrieveEntity(that.tableName, partitionKey, rowKey, (error, result, response) => {
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
            return new Promise((accept, reject) => {
                var that = this;
                try{
                    that.log(`Upserting entity ${partitionKey} ${rowKey}`);
                    this.ensureTable().then(() => {
                        that.log(`${that.tableName} ensured, fetching entity`);
                        this.retrieveEntity(partitionKey, rowKey)
                            .then((originalEntity) => {
                                if (!originalEntity){
                                    originalEntity = {
                                        PartitionKey: entGen.String(partitionKey),
                                        RowKey: entGen.String(rowKey)
                                    };
                                    that.log(`Existing entity not found, creating new entity ${JSON.stringify(originalEntity)}`);
                                }

                                let updatedEntity = fnChangeObject(originalEntity);
                                that.tableService.insertOrReplaceEntity (that.tableName, updatedEntity, {checkEtag: true}, function(error, updateResult, response){
                                    if (error){
                                        reject(error);
                                    }
                                    that.log(`Updated ${that.tableName} ${partitionKey} ${rowKey} ${JSON.stringify(updateResult)}`);
                                    accept();
                                });
                            });
                    }).catch((err) => {
                        reject(err);
                    });
                } catch(err) {
                    reject(err);
                }
            });
        };

        queryEntities(query){
            this.log(`Received query ${query}`);
            return new Promise((accept, reject) => {
                var that = this;
                try{
                    var queryObject = new azure.TableQuery()
                        .where(query);
                    that.tableService.queryEntities(that.tableName, queryObject, null, function(err, result){
                        if (err){reject(err);}
                        accept(result.entries);
                    });
                } catch(err){
                    reject(err);
                }
            });
        };
    };
})();