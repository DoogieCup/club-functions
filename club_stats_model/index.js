'use strict';
(function(){
    let Handler = require('./handler.js');
    let TableStorage = require('../utils/tableStorage.js');
    let connectionString = process.env.AzureWebJobsDashboard;

    module.exports = function(context, input){
        let contractsStorage = new TableStorage(context.log, 'ContractsReadModels', connectionString);
        let statsStorage = new TableStorage(context.log, 'seasonStatsByPlayer', connectionString);
        let outputStorage = new TableStorage(context.log, 'SeasonStatsByClub', connectionString);
        let handler = new Handler(context.log, outputStorage, contractsStorage, statsStorage);

        handler.process(input).then(() => {
            context.done();
        }).catch((err) => {
            context.log(`Failed. ${err} ${err.stack}}`)
            context.done(err);
        });
    };
})();