'use strict';
(function(){
    var tape = require('tape');
    var sinon = require('sinon');
    var Handler = require('../contracts_model/handler.js');
    var log = (msg) => {console.log(msg)};
    var createEvents = require('../test_utils/eventBuilder.js')(log);
    var Writer = require('../test_utils/fake_contracts_store');
    var Promise = require('promise');
    var Fetcher = require('../test_utils/fake_event_store');
    var Versions = require('../test_utils/fake_version_writer.js');

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

        var writer = new Writer(log);
        var fetcher = new Fetcher(events);
        var versionWriter = new Versions();
        console.log(`Fetcher created ${JSON.stringify(fetcher.events)}`);
        
        var handler = new Handler(log, fetcher.fetch(), writer.writer(), versionWriter.writerFunction());
        var newEvent = events[events.length-1];
        handler.process(0, newEvent)
            .then(() => {
                console.log(`Events ${JSON.stringify(writer.events)}`);
                t.equal(Object.keys(writer.events).length, 1);
                t.equal(versionWriter.get('Team1'), 1);
                t.end();
            }).catch((err) => {
                console.log(`Error ${err} ${err.stack}`);
            });
    });

    tape('Multiple contracts add together', (t) => {
        var events = createEvents('Team1', [
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

        var writer = new Writer(log);
        var fetcher = new Fetcher(events);
        var versionWriter = new Versions();
        console.log(`Fetcher created ${JSON.stringify(fetcher.events)}`);
        
        var handler = new Handler(log, fetcher.fetch(), writer.writer(), versionWriter.writerFunction());
        var newEvent = events[events.length-1];
        handler.process(0, newEvent)
            .then(() => {
                console.log(`Events ${JSON.stringify(writer.events)}`);
                t.equal(Object.keys(writer.events).length, 1);
                t.equal(writer.events['Team1|2015'].length, 2);
                t.equal(versionWriter.get('Team1'), 2);
                t.end();
            }).catch((err) => {
                console.log(`Error ${err} ${err.stack}`);
            });
    });
})();