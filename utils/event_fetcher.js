'use strict';
(function(){
    let odata = require('./odataQuery.js');
    let keyConverter = require('../utils/keyConverter.js');
    module.exports = class{
        constructor(log, tableStorage){
            this.log = log;
            this.tableStorage = tableStorage;
        }

        fetch(id, knownVersion, newVersion) {
            this.log(`Executing event fetcher Id ${id} Known Version ${knownVersion} new version ${newVersion}`);
            
            let q = odata()
                .equals('PartitionKey', String(id))
                .and((a) => a.gt('RowKey', keyConverter.toVersionKey(knownVersion)))
                .and((a) => a.le('RowKey', keyConverter.toVersionKey(newVersion)))
                .build();

            return this.tableStorage.queryEntities(q);
        };
    }
})();