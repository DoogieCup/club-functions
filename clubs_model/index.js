'use strict';
(function(){
    let Handler = require('./handler.js');
    let TableStorage = require('../utils/tableStorage.js');
    let connectionString = process.env.AzureWebJobsDashboard;
    let keyConverter = require('../utils/keyConverter.js');
    let Promise = require('promise');
    let azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;
    let EventFetcher = require('../utils/event_fetcher.js');
    let VersionWriter = require('../utils/version_writer.js');

    module.exports = function(context, input){
        let outputStorage = new TableStorage(context.log, 'ClubsRead', connectionString);
        let eventStorage = new TableStorage(context.log, 'clubEvents', connectionString);
        let versionStorage = new TableStorage(context.log, 'ClubsReadVersion', connectionString);
        let versionWriter = new VersionWriter(context.log, versionStorage, 'ClubsRead');
                
        let handler = new Handler(context.log,
            new EventFetcher(context.log, eventStorage),
            outputStorage, 
            versionWriter);

        try{
            versionStorage.retrieveEntity(input.PartitionKey['_'], 'ClubsRead')
            .then((versionEntity) => {
                let version = -1;
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