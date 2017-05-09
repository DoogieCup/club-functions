'use strict';
(function(){
    var tape = require('tape');
    var Handler = require('../contracts_model/handler.js');
    var createEvents = require('../test_utils/eventBuilder.js')(console.log);
    var Promise = require('promise');
    var Fetcher = require('../utils/event_fetcher.js');
    var VersionWriter = require('../utils/version_writer.js');
    var TableStorage = require('../test_utils/fake_table_storage.js');

    tape('Constructor does not throw', (t) => {
        t.doesNotThrow(() => new Handler());
        t.end();
    });

    tape('Player drafted', (t) => {
        t.end();
    });

    tape('Player delisted', (t) => {
        t.end();
    });

    tape('Contract imported', (t) => {
        var events = createEvents('Team1', [
            {name:'ContractImported', event:{
                PlayerId: 'Player1',
                FromRound: 201501,
                ToRound: 201524,
                DraftPick: 1
            }}
        ]);

        var output = new TableStorage();
        var eventStorage = new TableStorage(events);
        eventStorage.addQueryResponse(`PartitionKey eq 'Team1' and RowKey gt '0000000000' and RowKey le '0000000001'`,
            events);
        var fetcher = new Fetcher(console.log, eventStorage);
        var versionStorage = new TableStorage();
        var versionWriter = new VersionWriter(console.log, versionStorage, 'contracts_tests');
        console.log(`Fetcher created ${JSON.stringify(fetcher.events)}`);
        
        var handler = new Handler(console.log, fetcher, output, versionWriter);
        var newEvent = events[events.length-1];
        handler.process(0, newEvent)
            .then(() => {
                return versionStorage.retrieveEntity('Team1', 'contracts_tests').then((entity) => {
                    t.equal(entity.Version['_'], 1);
                }).then(() => {
                    t.equal(output.partitions.size, 1);
                    return output.retrieveEntity('Team1', '2015').then((entity) => {
                        console.log(`ENTITY ${JSON.stringify(entity)}`);
                        t.equal(JSON.parse(entity.Contracts['_']).length, 1);
                    });
                });
            }).catch((err) => {
                t.fail(`Error ${err} ${err.stack}`);
            });
            t.end();
    });

    tape('Multiple contracts add together', (t) => {
        var events = createEvents('Team1', [
            {
                name:'clubCreated', event:{
                    ClubName:"Testalicious",
                    CoachName:"Totally Testing",
                    Email:"Nope@example.com"
            }},
            {name:'ContractImported', event:{
                PlayerId: 'Player1',
                FromRound: 201501,
                ToRound: 201524,
                DraftPick: 1
            }},
            {name:'ContractImported', event:{
                PlayerId: 'Player2',
                FromRound: 201501,
                ToRound: 201524,
                DraftPick: 2
            }}
        ]);

        var output = new TableStorage();
        var eventStorage = new TableStorage(events);
        eventStorage.addQueryResponse(`PartitionKey eq 'Team1' and RowKey gt '0000000000' and RowKey le '0000000003'`,
            events);
        var fetcher = new Fetcher(console.log, eventStorage);
        var versionStorage = new TableStorage();
        var versionWriter = new VersionWriter(console.log, versionStorage, 'contracts_tests');
        console.log(`Fetcher created ${JSON.stringify(fetcher.events)}`);
        
        var handler = new Handler(console.log, fetcher, output, versionWriter);
        var newEvent = events[events.length-1];
        handler.process(0, newEvent)
            .then(() => {
                return versionStorage.retrieveEntity('Team1', 'contracts_tests').then((entity) => {
                    t.equal(entity.Version['_'], 3);
                }).then(() => {
                    t.equal(output.partitions.size, 1);
                    return output.retrieveEntity('Team1', '2015').then((entity) => {
                        console.log(`ENTITY ${JSON.stringify(entity)}`);
                        t.equal(JSON.parse(entity.Contracts['_']).length, 2);
                    });
                });
            }).catch((err) => {
                t.fail(`Error ${err} ${err.stack}`);
            });
            t.end();
    });
})();