'use strict';
(function(){
    let azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;
    let batcher = require('../utils/batcher.js');
    let odata = require('../utils/odataQuery.js');

    module.exports = class{
        constructor(log, 
            outputStore, 
            contractsStore, 
            statsStore,
            playersStore){
            this.log = log;
            this.outputStore = outputStore;
            this.contractsStore = contractsStore;
            this.statsStore = statsStore;
            this.playersStore = playersStore;
        };

        process(input){
            return this.contractsStore.retrieveEntity(input.clubId, String(input.year)).then((contract) => {

                if (!contract){
                    return new Promise((accept, reject) => {
                        reject(`Could not locate contract for ${input.clubId} ${input.year}. Ensure the data exists.`);
                    });
                }

                let playerIds = JSON.parse(contract.Contracts['_']).map((entity) => {return entity.PlayerId});

                let playerIdBatches = batcher(playerIds, 12);

                let statsQueries = playerIdBatches.map((batch) => {
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

                let playerQueries = playerIdBatches.map((batch) =>{
                    let q = odata();
                    let firstDone = false;
                    batch.forEach((id) => {
                        if (!firstDone){
                            q = q.equals('RowKey', id);
                            firstDone = true;
                            return;
                        }
                        q = q.or((x) => x.equals('RowKey', id));
                    });
                    return q.build();
                });

                this.log(`Built queries ${JSON.stringify(statsQueries)}`);
                let statsMap = new Map();
                let playersMap = new Map();

                let statsPromises = statsQueries.map((query) =>
                    this.statsStore.queryEntities(query)
                );

                let playerPromises = playerQueries.map((query) =>
                    this.playersStore.queryEntities(query)
                );

                return Promise.all(statsPromises).then((stats) => {
                    return Promise.all(playerPromises).then((players) => {
                        this.log(`Queries completed. Processing`);
                        stats.filter((item) => item)
                            .reduce((acc, item) => {
                                return acc.concat(item)
                            }, [])
                            .forEach((item) => {
                                statsMap.set(item.RowKey['_'], JSON.parse(item.StatsString['_']));
                            });

                        this.log(`PLAYERS ${JSON.stringify(players)}`);

                        players.filter((player) => player)
                            .reduce((acc, item) => {
                                return acc.concat(item)
                            }, [])
                            .forEach((item) => {
                                playersMap.set(item.RowKey['_'], item.Name['_']);
                            });

                        let contracts = JSON.parse(contract.Contracts['_'])
                            .map((c) => {
                                c.Stats = statsMap.get(c.PlayerId);
                                c.PlayerName = playersMap.get(c.PlayerId) || c.PlayerId;
                                return c;
                            });
                            
                        var entity = {
                            PartitionKey: entGen.String(input.clubId),
                            RowKey: entGen.String(String(input.year)),
                            Contracts: entGen.String(JSON.stringify(contracts)),
                        };

                        this.log(`Writing entity:\n${JSON.stringify(entity)}`);
                        return this.outputStore.replaceEntity(entity);
                    });
                });
            });
        };
    };
})();