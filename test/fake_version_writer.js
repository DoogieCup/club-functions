'use strict';
(function(){
    var Promise = require('promise');
    module.exports = class{
        constructor(){
            this.versions = new Map();
        };

        writerFunction(){
            return (clubId, version) => {
                console.log(`Updating version ${clubId} ${version}`);
                return new Promise((accept, reject) => {
                    this.versions.set(clubId, version);
                    accept();
                });
            };
        }

        get(clubId){
            return this.versions.get(clubId);
        }
    };
})();