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
    let EventFetcher = require('../utils/event_fetcher.js');
    let VersionWriter = require('../utils/version_writer.js');

    module.exports = function(context, event) {
        var log = (msg) => {context.log(msg);}
        context.log(`Processing ${JSON.stringify(event)}`);
        let eventStorage = new TableStorage(log, 'clubEvents', connectionString);
        let contractStorage = new TableStorage(log, 'ContractsReadModels', connectionString);
        let versionStorage = new TableStorage(log, 'ContractsReadVersion', connectionString);
        let eventFetcher = new EventFetcher(context.log, eventStorage);
        let versionWriter = new VersionWriter(context.log, versionStorage, 'ContractsReadModels');

        var handler = new Handler(context.log,
            eventFetcher,
            contractStorage,
            versionWriter);

        try{
            let clubId = event.PartitionKey['_'];
            versionStorage.retrieveEntity(clubId, 'ContractsReadModels')
            .then((versionEntity) => {
                let version = -1;
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