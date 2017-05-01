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
                var log = this.log;
                try{
                    var clubId = newEvent.PartitionKey['_'];
                    var version = keyConverter.parseVersion(newEvent.RowKey['_']);
                    let faulted = false;
                    var eventsToProcess = this.eventFetcher(clubId, currentVersion, version)
                        .then((events) => {
                            log(`Found ${events.length} events`);
                            var currentPromise = new Promise((accept1, reject1) => {accept1()});
                            events.forEach((event) => {

                                if (faulted){
                                    reject('faulted');
                                }

                                var payload = JSON.parse(event.Payload['_']);
                                var fromYear = keyConverter.parseRound(payload.FromRound).year;
                                var toYear = keyConverter.parseRound(payload.ToRound).year;

                                for (var i=fromYear;i<=toYear;i++){
                                    let closedYear = i;
                                    currentPromise = currentPromise.then(() => {
                                        if (faulted){return new Promise((accept1, reject1) => {reject1('faulted');})}
                                        log(`Writing Year ${closedYear} FY ${fromYear} TY ${toYear} E ${JSON.stringify(payload)}`);
                                        return this.writer(clubId, closedYear, payload);
                                    }).catch((err) => {
                                        reject(err);
                                        faulted = true;
                                        return;
                                    });
                                    if (faulted){
                                        break;
                                    }
                                }
                            });

                            if (faulted){
                                log(`Fault detected, not writing.`);
                                reject();
                                return;
                            }
                            currentPromise.then(() => {
                                this.versionWriter(clubId, version).then(
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