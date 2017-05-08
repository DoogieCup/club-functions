'use strict';
(function(){
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

        addQueryResponse(query, results){
            this.queries.set(query, results);
        }

        queryEntities(query){
            return this.queries.get(query);
        }
    };
})();