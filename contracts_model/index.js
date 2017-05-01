'use strict';
(function(){
    var Handler = require('./handler.js');
    var azure = require('azure-storage');
    var keyConverter = require('../utils/keyConverter.js');
    var Promise = require('promise');
    let connectionString = process.env.AzureWebJobsDashboard;
    let entGen = azure.TableUtilities.entityGenerator;
    var readTableCreated = false;
    var TableStorage = require('../utils/tableStorage.js');

    module.exports = function(context, event) {
        var log = (msg) => {context.log(msg);}
        context.log(`Processing ${JSON.stringify(event)}`);
        let eventStorage = new TableStorage(log, 'clubEvents', connectionString);
        let contractStorage = new TableStorage(log, 'ContractsReadModels', connectionString);
        let versionStorage = new TableStorage(log, 'ContractsReadVersion', connectionString);

        var eventFetcher = (id, knownVersion, newVersion) => {
            context.log(`Executing event fetcher Id ${id} Known Version ${knownVersion} new version ${newVersion}`);
            
            var q = `PartitionKey eq '${String(id)}' and RowKey gt '${keyConverter.toVersionKey(knownVersion)}' and RowKey le '${keyConverter.toVersionKey(newVersion)}'`;
            return eventStorage.queryEntities(q);
        };

        var writer = (clubId, year, contract) => {
            context.log(`Asked to write ${clubId} ${year} ${JSON.stringify(contract)}`);
            var updater = (entity) => {
                if (!entity.Contracts){
                        entity.Contracts = entGen.String(JSON.stringify([]));
                }
                var contracts = JSON.parse(entity.Contracts['_']);
                contracts.push(contract);
                entity.Contracts = entGen.String(JSON.stringify(contracts));
                return entity;
            };

            return contractStorage.upsertEntity(String(clubId), String(year), updater);
        };

        var versionWriter = (clubId, version) => {
            context.log(`Writing version ${clubId} ${version}`);
            let upsert = (entity) => {
                context.log(`Updating version to ${version} for ${clubId}`);
                entity.Version = entGen.Int32(version);
                return entity;
            };
            return versionStorage.upsertEntity(clubId, 'ContractsReadModels', upsert);
        };

        var handler = new Handler(context.log,
            eventFetcher,
            writer,
            versionWriter);

        // This needs to be based on the last known version not 0
        try{
            let clubId = event.PartitionKey['_'];
            versionStorage.retrieveEntity(clubId, 'ContractsReadModels')
            .then((versionEntity) => {
                let version = 0;
                if (versionEntity){
                    context.log(`Found existing version for ${clubId} ${versionEntity.Version['_']}`);
                    version = versionEntity.Version['_'];
                }
                return handler.process(version, event);
            }).catch((err)=>{
                context.log(`Process faulted ${JSON.stringify(err)}`);
                context.done(err);
            });
        }
        catch(err){
            context.log(`Error ${err}`);
            context.done(err);
        }
    };
})();