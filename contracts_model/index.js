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
            let tableService = azure.createTableService(connectionString);
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
                    Contracts: JSON.stringify([contract])
                };

                tableService.retrieveEntity('ContractsReadModels', String(clubId), String(year), function(error, result, response){
                    if (error && response.statusCode === 404){
                        tableService.insertEntity('ContractsReadModels', entity, function(error, insertResult, response) {
                            if (error) {
                                reject(error);
                            }
                            context.log(`New contract written ${clubId} ${year} ${JSON.stringify(contract)}`);
                            fulfill();
                        });
                        return;
                    }

                    context.log(`Found existing entry ${JSON.stringify(result.Contracts)}`);
                    result.Contracts['_'] = JSON.stringify(JSON.parse(result.Contracts['_']).push(contract));
                    tableService.replaceEntity('ContractsReadModels', result, {checkEtag: true}, function(error, updateResult, response){
                        if (error){
                            reject(error);
                        }
                        context.log(`Updated contracts ${clubId} ${year} ${result.Contracts}`);
                        fulfill();
                    });
                });
            })});

            return result;
        };

        var versionWriter = (clubId, version) => {
            return new Promise((accept, reject) => {
                let tableService = azure.createTableService(connectionString);
                tableService.createTableIfNotExists('ContractsReadVersion', function(error, result, response) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    context.log(`Ensured ContractsReadVersion table, result ${JSON.stringify(result)}`);
                    var versionRow = {
                        PartitionKey: entGen.String(String(year)),
                        RowKey: entGen.String(String(version))
                    };

                    tableService.insertEntity('ContractsReadVersion', versionRow, function(error, result, response) {
                        if (error) {
                            reject(error);
                            return;
                        }
                        context.log(`New version written ${year} ${version}`);
                        fulfill();
                    });
                });
            });
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