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
            return new Promise((accept, reject) => {
                try{
                    var clubId = newEvent.PartitionKey['_'];
                    var version = keyConverter.parseVersion(newEvent.RowKey['_']);
                    var eventsToProcess = this.eventFetcher(clubId, currentVersion, version).then((events) => {
                            log(`Found ${events.length} events`);
                            var currentPromise = new Promise((accept1, reject1) => {accept1()});
                            events.forEach((event) => {
                                if (event.EventType['_'] !== "clubCreated"){
                                    return;
                                }

                                var payload = JSON.parse(event.Payload['_']);

                                currentPromise.then(() => {
                                    currentPromise = this.writer({
                                        PartitionKey: entGen.String(payload.ClubName), 
                                        RowKey: entGen.String(clubId), 
                                        Club: entGen.String(JSON.stringify(payload))});
                                });
                            });

                            currentPromise.then(() => {
                                this.versionWriter(clubId, keyConverter.parseVersion(events[events.length-1].RowKey['_'])).then(
                                    () => {accept();}
                                );
                            }).catch((err) => {
                                reject(err);
                            });
                        }).catch((err) => {
                            log(`Failed to fetch events ${err} ${err.stack}`);
                            reject(`Failed to fetch events ${err}`);
                        });
                } catch(err){
                    log(`Failed to process event due to ${err}`);
                    log(err.stack);
                    log(JSON.stringify(newEvent));
                    reject(err);
                }
                
            });
        };
    };
})();