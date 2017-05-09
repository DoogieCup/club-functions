'use strict';
(function(){
    let azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;
    module.exports = class{
        constructor(rows){
            this.partitions = new Map();
            this.queries = new Map();
            if (rows){
                rows.forEach((row) => {
                    this.insertRow(row);
                });
            }
        };

        insertRow(row){
            let pKey = String(row.PartitionKey['_']);
            let rKey = String(row.RowKey['_']);
            if (!this.partitions.has(pKey)){
                this.partitions.set(pKey, new Map());
            }

            if (this.partitions.get(pKey).has(rKey)){
                throw Error('Duplicated insert');
            }

            this.partitions.get(pKey).set(rKey, row);
        }

        insertEntity(entity){
            return new Promise((accept, reject) => {
                try{
                    this.insertRow(entity);
                    accept(entity);
                } catch(err){
                    reject(err);
                }
            });
        }

        retrieveEntity(partitionKey, rowKey){
            return new Promise((accept, reject) => {
                try{
                    if (!this.partitions.has(partitionKey)){
                        accept();
                        return;
                    }
                    var partition = this.partitions.get(partitionKey);
                    if (!partition.has(rowKey)){
                        accept();
                        return;
                    }

                    var result = partition.get(rowKey);
                    accept(result);
                } catch (err){
                    reject(err);
                }
            });
        }

        replaceEntity(row){
            return new Promise((accept, reject) => {
                try{
                    let pKey = String(row.PartitionKey['_']);
                    let rKey = String(row.RowKey['_']);
                    if (!this.partitions.has(pKey)){
                        this.partitions.set(pKey, new Map());
                    }

                    var result = this.partitions.get(pKey).set(rKey, row);
                    accept(result);
                }  catch(err){
                    reject(err);
                }
            });
        }

        upsertEntity(partitionKey, rowKey, fnChangeObject){
            console.log(`Upserting entity ${partitionKey} ${rowKey}`);
            return this.retrieveEntity(partitionKey, rowKey)
                .then((originalEntity) => {
                    if (!originalEntity){
                        originalEntity = {
                            PartitionKey: entGen.String(partitionKey),
                            RowKey: entGen.String(rowKey)
                        };
                        console.log(`Existing entity not found, creating new entity ${JSON.stringify(originalEntity)}`);
                    }

                    let updatedEntity = fnChangeObject(originalEntity);
                    return this.replaceEntity(updatedEntity);
                });
        }

        addQueryResponse(query, results){
            this.queries.set(query, results);
        }

        queryEntities(query){
            return new Promise((accept, reject) => {
                try{
                    if (!this.queries.has(query)){
                        console.log(`Couldnlt locate query ${query}`);
                    }

                    accept(this.queries.get(query));
                } catch(err){
                    reject(err);
                }
            });
        }
    };
})();