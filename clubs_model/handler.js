(function(){
    let Promise = require('promise');
    let keyConverter = require('../utils/keyConverter.js');
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
            }

        process(currentVersion, newEvent){
            let log = this.log;
            let clubId = newEvent.PartitionKey['_'];
            let version = keyConverter.parseVersion(newEvent.RowKey['_']);
            return this.eventFetcher.fetch(clubId, currentVersion, version).then((events) => {
                log(`Found ${events.length} events`);
                let currentPromise = new Promise((accept, reject) => {accept()});
                events.forEach((event) => {
                    
                    if (event.eventType['_'] !== "clubCreated"){
                        log(`IGNORING EVENT ${event.eventType['_']} clubCreated`);
                        return;
                    }
                    log(`PROCESSING EVENT ${JSON.stringify(event)}`);

                    let payload = JSON.parse(event.payload['_']);
                    currentPromise.then(() => {
                        currentPromise = this.writer.replaceEntity({
                            PartitionKey: entGen.String(payload.ClubName),
                            RowKey: entGen.String(clubId), 
                            Club: entGen.String(JSON.stringify(payload))});
                    });
                });

                return currentPromise.then(() => {
                    return this.versionWriter.write(clubId, keyConverter.parseVersion(events[events.length-1].RowKey['_']));
                });
            });
        };
    };
})();