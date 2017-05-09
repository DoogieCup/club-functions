'use strict';
(function(){
    let tape = require('tape');
    let Handler = require('../clubs_model/handler.js') ;
    let createEvents = require('../test_utils/eventBuilder.js')(console.log);
    let Writer = require('../test_utils/fake_writer');
    let Promise = require('promise');
    let EventFetcher = require('../utils/event_fetcher.js');
    let Versions = require('../test_utils/fake_version_writer.js');
    let TableStorage = require('../test_utils/fake_table_storage.js');
    let VersionWriter = require('../utils/version_writer.js');

    tape('Handler constructs', (t) => {
        t.doesNotThrow(() => new Handler(console.log));
        t.end();
    });

    tape('clubCreated creates club', (t) => {
        var events = createEvents('Team1', [
            {
                name:'clubCreated', event:{
                    ClubName:"Testalicious",
                    CoachName:"Totally Testing",
                    Email:"Nope@example.com"
                }
            },
            {
                name:'clubCreated', event:{
                    ClubName:"Testtastic",
                    CoachName:"Testing2",
                    Email:"Nope@example.com"
                }
            },
            {name:'ContractImported', event:{
                PlayerId: 'Player2',
                FromRound: 201501,
                ToRound: 201524,
                DraftPick: 2
            }}
        ]);

        let writer = new TableStorage();
        let eventStore = new TableStorage(events);
        eventStore.addQueryResponse(`PartitionKey eq 'Team1' and RowKey gt '0000000000' and RowKey le '0000000003'`, events);
        let fetcher = new EventFetcher(console.log, eventStore);
        let versionStorage = new TableStorage();
        let versionWriter = new VersionWriter(console.log, versionStorage, 'ClubsReadModels');
        console.log(`Fetcher created ${JSON.stringify(fetcher.events)}`);

        var handler = new Handler(console.log, fetcher, writer, versionWriter);
        var newEvent = events[events.length-1];
        handler.process(0, newEvent)
            .then(() => {
                t.equal(writer.partitions.size, 2);
                return versionStorage.retrieveEntity('Team1', 'ClubsReadModels').then((entity) => {
                    t.equal(entity.Version['_'], 3);
                }).then(() => {
                    return writer.retrieveEntity('Testalicious', 'Team1').then((entity) => {
                        t.equal(JSON.parse(entity.Club['_']).ClubName, 'Testalicious');
                    });
                })
            }).catch((err) => {
                t.fail(`Error ${err} ${err.stack}`);
            });
            t.end();
    });
})();