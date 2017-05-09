'use strict';
(function(){
    let azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;
    module.exports = class{
        constructor(log,
            tableStorage,
            modelName){
                this.log = log;
                this.tableStorage = tableStorage;
                this.modelName = modelName;
        };
        write(entityId, version){
            let log = this.log;
            let upsert = (entity) => {
                log(`Updating version to ${version} for ${entityId}`);
                entity.Version = entGen.Int32(version);
                return entity;
            };
            return this.tableStorage.upsertEntity(entityId, this.modelName, upsert);
        };
    };
})();