'use strict';
(function(){
    var Promise = require('promise');
    var eventBuilder = require('./eventBuilder');
    module.exports = class{
        constructor(log){
            this.events = new Map();
            this.log = log;
        };

        writer(){
            return (clubId, year, contract) => {
                this.log(`Writing ${clubId} ${year} ${JSON.stringify(contract)}`);
                return new Promise((accept, reject) => {
                    try{
                        this.events.set({clubId: clubId, year: year}, contract);
                        accept();
                    } catch(err) {
                        reject(err);
                    }                
                });
            };
        };
    };
})();