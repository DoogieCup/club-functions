'use strict';
(function(){
    var keyConverter = require('../utils/keyConverter.js');
    var Promise = require('promise');
    module.exports = class{
        constructor(events){
            console.log(`DEPRECATED use event_fetcher with a taboe_storage`);
            this.events = {};
            var version = 1;
            events.forEach((event) => {
                try{
                    if (!(event.PartitionKey['_'] in this.events)){
                        console.log(`Creating new map ${event.PartitionKey['_']}`);
                        this.events[event.PartitionKey['_']] = new Map();
                    }
                    console.log(`Setting ${event.PartitionKey['_']} to ${keyConverter.parseVersion(event.RowKey['_'])}`);
                    this.events[event.PartitionKey['_']].set(keyConverter.parseVersion(event.RowKey['_']), event);
                } catch(err){
                    console.log(`Failed to create event ${JSON.stringify(event)}\n${err}\n${err.stack}`);
                    throw Error(err);
                }
            }, this);

            console.log(`Constructed. This.events ${JSON.stringify(this.events)}`);
        };

        fetch(){
            return (id, currentVersion, newVersion) => {
                console.log(`Fetching. Current events: ${JSON.stringify(this.events)}`);
                return new Promise((accept, reject) => {
                    try{
                        var rtn = [];

                        var partition = this.events[String(id)];

                        for (var [key, value] of this.events[id]) {
                            if (key > currentVersion && key <= newVersion){
                                console.log(`Pusing event ${key} ${JSON.stringify(value)}`);
                                rtn.push(value);
                            }
                        }

                        accept(rtn);
                    } catch(err){
                        console.log(`Failure, current events: ${JSON.stringify(this.events)}\n${JSON.stringify(this)}`);
                        reject(err);
                    };                
                });
            };
        };
    };
})();