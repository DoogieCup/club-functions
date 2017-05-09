'use strict';
(function(){
    var Promise = require('promise');
    var keyConverter = require('../utils/keyConverter.js');
    let azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;
    module.exports = class{
        constructor(log,
            eventFetcher,
            writer,
            versionWriter){
                this.log = log;
                this.writer = writer;
                this.eventFetcher = eventFetcher;
                this.versionWriter = versionWriter;
            };
        
        process(currentVersion, newEvent){
            var log = this.log;
            var clubId = newEvent.PartitionKey['_'];
            var version = keyConverter.parseVersion(newEvent.RowKey['_']);
            return this.eventFetcher.fetch(clubId, currentVersion, version)
                .then((events) => {
                    log(`Found ${JSON.stringify(events)} events`);
                    log(`Found ${events.length} events`);
                    var currentPromise = new Promise((accept1, reject1) => {accept1()});
                    events.forEach((event) => {
                        if (event.eventType['_'] !== "ContractImported"){
                            return;
                        }

                        var payload = JSON.parse(event.payload['_']);
                        var fromYear = keyConverter.parseRound(payload.FromRound).year;
                        var toYear = keyConverter.parseRound(payload.ToRound).year;

                        for (var i=fromYear;i<=toYear;i++){
                            let closedYear = i;
                            currentPromise = currentPromise.then(() => {
                                log(`Writing Year ${closedYear} FY ${fromYear} TY ${toYear} E ${JSON.stringify(payload)}`);

                                return this.writer.upsertEntity(clubId,
                                    closedYear,
                                    (entity) => {
                                        console.log(`INITIAL ${JSON.stringify(entity)}`);
                                        let array = entity.Contracts ? JSON.parse(entity.Contracts['_']) : [];
                                        array.push(payload);
                                        entity.Contracts = entGen.String(JSON.stringify(array));
                                        console.log(`FINAL ${JSON.stringify(entity)}`);
                                        return entity;
                                    });
                            });
                        }
                    });

                    return currentPromise.then(() => {
                        return this.versionWriter.write(clubId, keyConverter.parseVersion(events[events.length-1].RowKey['_']));
                    });
                });
        };
    };
})();