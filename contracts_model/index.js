'use strict';
(function(){
    var Handler = require('./handler.js');
    var azure = require('azure-storage');
    var keyConverter = require('../utils/keyConverter.js');
    var Promise = require('promise');
    let connectionString = process.env.AzureWebJobsDashboard;
    let entGen = azure.TableUtilities.entityGenerator;
    var readTableCreated = false;

    module.exports = function(context, event) {
        var eventFetcher = (id, knownVersion, newVersion) => {
            let tableService = azure.createTableService(connectionString);
            context.log(`Executing event fetcher Id ${id} Known Version ${knownVersion} new version ${newVersion}`);
            
            var q = `PartitionKey eq '${String(id)}' and RowKey gt '${keyConverter.toVersionKey(knownVersion)}' and RowKey le '${keyConverter.toVersionKey(newVersion)}'`;
            context.log(`Query: ${q}`);
            var query = new azure.TableQuery()
                .where(q);

            var result = new Promise((fulfill, reject) => {
                tableService.queryEntities('clubEvents', query, null, function(err, result){
                    if (err){reject(err);}
                    fulfill(result.entries);
                });
            });
            
            return result;
        };

        var writer = (clubId, year, contract) => {
            var tableService = azure.createTableService(connectionString);
            context.log(`Asked to write ${clubId} ${year} ${JSON.stringify(contract)}`);
            var result = (new Promise((fulfill, reject)=>{
                if (readTableCreated){
                    fulfill();
                    return;
                }

                tableService.createTableIfNotExists('ContractsReadModels', function(error, result, response) {
                    if (error) {reject(error);}
                    context.log(`Ensured ContractsReadModels table, result ${JSON.stringify(result)}`);
                    readTableCreated = true;
                    fulfill();
                });
            })).then(() => {return new Promise((fulfill, reject) => {
                var entity = {
                    PartitionKey: entGen.String(String(clubId)),
                    RowKey: entGen.String(String(year)),
                    Contract: JSON.stringify(contract)
                };

                tableService.insertEntity('ContractsReadModels', entity, function(error, result, response) {
                    if (error) {
                        reject(error);
                    }
                    context.log(`New contract written ${playerId} ${round} ${JSON.stringify(contract)}`);
                    fulfill();
                });
            })});

            return result;
        };

        var versionWriter = (clubId, version) => {
            let tableService = azure.createTableService(connectionString);
            var result = (new Promise((fulfill, reject)=>{
                tableService.createTableIfNotExists('ContractsReadVersion', function(error, result, response) {
                    if (error) {reject(error);}
                    context.log(`Ensured ContractsReadVersion table, result ${JSON.stringify(result)}`);
                    fulfill();
                });
            })).then(() => {return new Promise((fulfill, reject) => {
                var versionRow = {
                    PartitionKey: entGen.String(String(year)),
                    RowKey: entGen.String(String(version))
                };

                tableService.insertEntity('ContractsReadVersion', versionRow, function(error, result, response) {
                    if (error) {
                        reject(error);
                    }
                    context.log(`New version written ${year} ${version}`);
                    fulfill();
                });
            })});

            return result;
        };

        var handler = new Handler(context.log,
            eventFetcher,
            writer,
            versionWriter);

        // This needs to be based on the last known version not 0
        handler.process(0, event)
            .then(()=>{
                context.done(null);
            }).catch((err)=>{
                context.log(`Process faulted ${JSON.stringify(err)}`);
                context.done(err);
            });
    };
})();