'use strict';
(function(){
    let tape = require('tape');
    let Handler = require('../clubs_model/handler.js') ;
    var createEvents = require('../test_utils/eventBuilder.js')(console.log);
    var Writer = require('../test_utils/fake_writer');
    var Promise = require('promise');
    var Fetcher = require('../test_utils/fake_event_store');
    var Versions = require('../test_utils/fake_version_writer.js');

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

        var writer = new Writer(log);
        var fetcher = new Fetcher(events);
        var versionWriter = new Versions();
        console.log(`Fetcher created ${JSON.stringify(fetcher.events)}`);

        var handler = new Handler(console.log, fetcher.fetch(), writer.writer(), versionWriter.writerFunction());
        var newEvent = events[events.length-1];
        handler.process(0, newEvent)
            .then(() => {
                console.log(`Events ${JSON.stringify(writer.events)}`);
                t.equal(Object.keys(writer.events).length, 2);
                t.equal(versionWriter.get('Team1'), 3);
                t.equal(writer.events['Testalicious|Team1'].length, 1);
                console.log(`BUCKET ${JSON.stringify(writer.events['Testalicious|Team1'])}`);
                // There really shouldn't be an array inside the writer here, it should be rewritten
                t.equal(writer.events['Testalicious|Team1'][0].ClubName, 'Testalicious');
                t.end();
            }).catch((err) => {
                console.log(`Error ${err} ${err.stack}`);
            });
    });
})();