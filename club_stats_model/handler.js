'use strict';
(function(){
    var azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;

    module.exports = class{
        constructor(log, outputStore, contractsStore, statsStore){
            this.log = log;
            this.outputStore = outputStore;
            this.contractsStore = contractsStore;
            this.statsStore = statsStore;
        };
        process(input){
            return new Promise((accept, reject) => {
                this.contractsStore.retrieveEntity(input.clubId, String(input.year)).then((contracts) => {

                    //var playerIds = contracts.map((entity) => {return entity.PartitionKey['_']});
                    
                    var entity = {
                        PartitionKey: entGen.String(input.clubId),
                        RowKey: entGen.String(String(input.year)),
                        Contracts: entGen.String(contracts.Contracts['_'])
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