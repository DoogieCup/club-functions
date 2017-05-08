'use strict';
(function(){
    var Promise = require('promise');
    var eventBuilder = require('./eventBuilder');
    module.exports = class{
        constructor(log){
            this.events = {};
            this.log = log;
        };

        writer(){
            return (partitionKey, rowKey, entity) => {
                this.log(`Writing ${partitionKey} ${rowKey} ${JSON.stringify(entity)}`);
                return new Promise((accept, reject) => {
                    try{
                        if (!this.events[partitionKey + '|' + String(rowKey)]){
                            this.events[partitionKey + '|' + String(rowKey)] = [];
                        }

                        this.events[partitionKey + '|' + String(rowKey)].push(entity);
                        accept();
                    } catch(err) {
                        reject(err);
                    }                
                });
            };
        };
    };
})();