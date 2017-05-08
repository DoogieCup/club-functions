'use strict';
(function(){
    let Handler = require('./handler.js');
    let TableStorage = require('../utils/tableStorage.js');
    let connectionString = process.env.AzureWebJobsDashboard;
    var keyConverter = require('../utils/keyConverter.js');
    var Promise = require('promise');
    var azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;

    module.exports = function(context, input){
        let outputStorage = new TableStorage(context.log, 'ClubsRead', connectionString);
        let eventStorage = new TableStorage(context.log, 'clubEvents', connectionString);
        let versionStorage = new TableStorage(context.log, 'ClubsReadVersion', connectionString);

        var versionWriter = (clubId, version) => {
            context.log(`Writing version ${clubId} ${version}`);
            let upsert = (entity) => {
                context.log(`Updating version to ${version} for ${clubId}`);
                entity.Version = entGen.Int32(version);
                return entity;
            };
            return versionStorage.upsertEntity(clubId, 'ClubsReadModels', upsert);
        };

        var eventFetcher = (id, knownVersion, newVersion) => {
            context.log(`Executing event fetcher Id ${id} Known Version ${knownVersion} new version ${newVersion}`);
            
            var q = `PartitionKey eq '${String(id)}' and RowKey gt '${keyConverter.toVersionKey(knownVersion)}' and RowKey le '${keyConverter.toVersionKey(newVersion)}'`;
            return eventStorage.queryEntities(q);
        };

        let handler = new Handler(context.log,
            eventFetcher,
            outputStorage, 
            versionWriter);

        try{
            versionStorage.retrieveEntity(input.PartitionKey['_'], 'ClubsReadModels')
            .then((versionEntity) => {
                let version = 0;
                if (versionEntity){
                    context.log(`Found existing version for ${clubId} ${versionEntity.Version['_']}`);
                    version = versionEntity.Version['_'];
                }

                handler.process(version, input).then(() => {
                    context.done();
                }).catch((err) => {
                    context.log(`Failed. ${err} ${err.stack}}`)
                    context.done(err);
                });
            });
        }catch(err){
            context.done(err);
        }
    };
})();