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
                this.versionWriter = versionWriter;
            };
        
        process(currentVersion, newEvent){
            return new Promise((accept, reject) => {
                try{
                    var clubId = newEvent.PartitionKey['_'];
                    var version = keyConverter.parseVersion(newEvent.RowKey['_']);
                    var eventsToProcess = this.eventFetcher(clubId, currentVersion, version)
                        .then((events) => {
                            var currentPromise = new Promise((accept, reject) => {accept()});
                            events.forEach((event) => {
                                var payload = JSON.parse(event.Payload['_']);
                                this.log(`EVENT ${JSON.stringify(payload)}`);
                                var fromYear = keyConverter.parseRound(payload.FromRound).year;
                                var toYear = keyConverter.parseRound(payload.ToRound).year;

                                for (var i=fromYear;i<=toYear;i++){
                                    this.log(`Writing Year ${i} FY ${fromYear} TY ${toYear} E ${JSON.stringify(payload)}`);
                                    let closedYear = i;
                                    currentPromise = currentPromise.then(() => {
                                        return this.writer(clubId, closedYear, payload);
                                    }).catch((err) => {
                                        reject(err);
                                        return;
                                    });
                                }
                            });

                            currentPromise.then(() => {
                                this.versionWriter(clubId, version).then(
                                    () => {accept();}
                                );
                            });
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