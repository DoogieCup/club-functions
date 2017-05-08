'use strict';
(function(){
    let azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;
    let batcher = require('../utils/batcher.js');
    let odata = require('../utils/odataQuery.js');

    module.exports = class{
        constructor(log, outputStore, contractsStore, statsStore){
            this.log = log;
            this.outputStore = outputStore;
            this.contractsStore = contractsStore;
            this.statsStore = statsStore;
        };
        process(input){
            return new Promise((accept, reject) => {
                this.contractsStore.retrieveEntity(input.clubId, String(input.year)).then((contract) => {
                    let playerIds = JSON.parse(contract.Contracts['_']).map((entity) => {return entity.PlayerId});

                    let playerIdBatches = batcher(playerIds, 12);

                    let queries = playerIdBatches.map((batch) => {
                        return odata()
                            .equals('PartitionKey', String(input.year))
                            .and((queryClause) => {
                                let firstDone = false;
                                batch.forEach((playerId) => {
                                    let fn = (clause) => clause.equals('RowKey', playerId);

                                    if (firstDone){
                                        queryClause = queryClause.or(fn);
                                    } else{
                                        queryClause = fn(queryClause);
                                        firstDone = true;
                                    }
                            });
                            return queryClause;
                        })
                        .build();
                    });

                    this.log(`Built queries ${JSON.stringify(queries)}`);
                    let statsMap = new Map();

                    let stats = queries.map((query) => {
                        return this.statsStore.queryEntities(query);
                    }).filter((item) => item)
                    .reduce((acc, item) => {
                        let nacc = acc || [];
                        return nacc.concat(item)
                    })
                    .forEach((item) => {
                        statsMap.set(item.RowKey['_'], JSON.parse(item.StatsString['_']));
                    });

                    let contracts = JSON.parse(contract.Contracts['_'] )
                    .map((c) => {
                        c.Stats = statsMap.get(c.PlayerId)
                        return c;
                    });
                    
                    var entity = {
                        PartitionKey: entGen.String(input.clubId),
                        RowKey: entGen.String(String(input.year)),
                        Contracts: entGen.String(JSON.stringify(contracts))
                    };

                    this.outputStore.insertEntity(entity).then(() => {
                        accept();
                    }).catch((err) => {
                        reject(err);
                    });
                }).catch((err) => {
                    reject(err);
                });
            });
        };
    };
})();