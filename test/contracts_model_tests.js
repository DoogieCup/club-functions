'use strict';
(function(){
    var tape = require('tape');
    var sinon = require('sinon');
    var Handler = require('../contracts_model/handler.js');
    var log = (msg) => {console.log(msg)};
    var createEvents = require('./eventBuilder.js')(log);
    var Writer = require('./fake_contracts_store');
    var Promise = require('promise');
    var Fetcher = require('./fake_event_store');
    var Versions = require('./fake_version_writer.js');

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
})();