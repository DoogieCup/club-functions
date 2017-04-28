'use strict';
(function(){
    var Promise = require('promise');
    var keyConverter = require('../utils/keyConverter.js');
    module.exports = class{
        constructor(log,
            eventFetcher,
            writer,
            versionWriter){
                this.log = log;
                this.writer = writer;
                this.eventFetcher = eventFetcher;
            };
        
        process(currentVersion, newEvent){
            return new Promise((accept, reject) => {
                try{
                    var clubId = newEvent.PartitionKey['_'];
                    var version = keyConverter.parseVersion(newEvent.RowKey['_']);
                    var eventsToProcess = this.eventFetcher(clubId, currentVersion, version)
                        .then((events) => {
                            events.forEach((event) => {
                                var payload = JSON.parse(event.payload['_']);
                                this.log(`EVENT ${JSON.stringify(payload)}`);
                                var fromYear = keyConverter.parseRound(payload.FromRound).year;
                                var toYear = keyConverter.parseRound(payload.ToRound).year;
                                this.writer(clubId, toYear, event.payload).catch((err) => {
                                    this.log(`Failed to write event ${err}\n${err.stack}`);
                                });
                            });
                            // this should WhenAll on the this.writer promises and accept when done
                            accept();                
                        }).catch((err) => {
                            this.log(`Failed to fetch events ${err} ${err.stack}`);
                            reject(`Failed to fetch events ${err}`);
                        });
                } catch(err){
                    this.log(`Failed to process event due to ${err}`);
                    this.log(err.stack);
                    this.log(JSON.stringify(newEvent));
                    reject(err);
                }
                
            });
        };
    };
})();