'use strict';
(function(){
    let tape = require('tape');
    let Handler = require('../club_stats_model/handler.js');
    let log = (msg) => {console.log(msg)};
    var azure = require('azure-storage');
    let entGen = azure.TableUtilities.entityGenerator;
    let FakeStore = require('../test_utils/fake_table_storage.js');    

    tape("Constructor doesn't throw", (t) => {
        t.doesNotThrow(() => {new Handler(log)});
        t.end();
    });

    tape('Handler aggregates contracts and stats', (t) => {
        var clubId = 'ClubId';
        var year = 2016;
        let input = {clubId: clubId, year: year};

        let contracts = {
            PartitionKey: entGen.String(clubId),
            RowKey: entGen.String(String(year)),
            Contracts: entGen.String(JSON.stringify([
                {"PlayerId":"7b1f685e-396e-48ba-9a97-e07f2d4f6e5a","FromRound":200801,"ToRound":200806,"DraftPick":17},
                {"PlayerId":"9bedbb07-6255-43e8-9d7c-87dc8300f504","FromRound":200801,"ToRound":200806,"DraftPick":23},
                {"PlayerId":"f75b5fb1-c1eb-4318-bee5-b0595191c6e2","FromRound":200801,"ToRound":200806,"DraftPick":11},
                {"PlayerId":"04230b98-12d8-45c4-9c0b-7b01dd6a868d","FromRound":200801,"ToRound":200824,"DraftPick":15},
                {"PlayerId":"1940e63e-3731-483d-a206-608cb86197f2","FromRound":200801,"ToRound":200824,"DraftPick":4},
                {"PlayerId":"314c1fb2-9355-494c-923f-b5303f851b00","FromRound":200801,"ToRound":200824,"DraftPick":3},
                {"PlayerId":"3486270a-4c1d-4692-b9c8-8fb991c929c7","FromRound":200801,"ToRound":200824,"DraftPick":14},
                {"PlayerId":"36881b30-59c0-4fd5-bd9b-b76e42148317","FromRound":200801,"ToRound":200824,"DraftPick":12},
                {"PlayerId":"3a4da28d-76c3-4197-a295-925ca47650f2","FromRound":200801,"ToRound":200824,"DraftPick":20},
                {"PlayerId":"709599ad-f6ed-4494-b6e9-993ca6895558","FromRound":200801,"ToRound":200824,"DraftPick":2},
                {"PlayerId":"78ab68bc-590d-4818-9aec-912b0d6c2eff","FromRound":200801,"ToRound":200824,"DraftPick":1},
                {"PlayerId":"8d8f5f89-c314-40d5-b42c-08807a7acfb9","FromRound":200801,"ToRound":200824,"DraftPick":22},
                {"PlayerId":"b171a31b-3128-4df1-90a8-018ea02bc9c5","FromRound":200801,"ToRound":200824,"DraftPick":8},
                {"PlayerId":"b2cfb591-74b9-47d4-b6a0-00e32826365f","FromRound":200801,"ToRound":200824,"DraftPick":6},
                {"PlayerId":"bbfbbb49-6571-436e-ab00-71e349b15292","FromRound":200801,"ToRound":200824,"DraftPick":5},
                {"PlayerId":"c271b229-c5fe-43bc-b04a-c8ada6881a58","FromRound":200801,"ToRound":200824,"DraftPick":7},
                {"PlayerId":"ecfeafc7-1440-45cb-9e95-e0ff71f4e21a","FromRound":200801,"ToRound":200824,"DraftPick":13},
                {"PlayerId":"bddde034-aaed-4afb-a8fe-4299c6fe6cc0","FromRound":200801,"ToRound":200906,"DraftPick":18},
                {"PlayerId":"01699472-0abb-43d1-8f28-c1d8251b45d5","FromRound":200801,"ToRound":200924,"DraftPick":19},
                {"PlayerId":"6e792dcd-3a22-4946-a9dc-0380f878c09c","FromRound":200801,"ToRound":200924,"DraftPick":9},
                {"PlayerId":"f64e6209-538e-4a29-9369-f686cfc3acf4","FromRound":200801,"ToRound":200924,"DraftPick":16},
                {"PlayerId":"fa138503-6e7b-4ba8-9ec2-ba95f3fbeb97","FromRound":200801,"ToRound":200924,"DraftPick":10},
                {"PlayerId":"32e8c5a4-9eb3-4dd8-800c-800706e7f218","FromRound":200801,"ToRound":201024,"DraftPick":24},
                {"PlayerId":"f0eb1566-64f4-44cf-8667-5659074ead3d","FromRound":200801,"ToRound":201124,"DraftPick":21},
                {"PlayerId":"9bedbb07-6255-43e8-9d7c-87dc8300f504","FromRound":200807,"ToRound":200824,"DraftPick":23},
                {"PlayerId":"b2b18cc5-891d-43e6-9db2-cfff0d437da0","FromRound":200807,"ToRound":200824,"DraftPick":11},
                {"PlayerId":"ee95cf51-a8d6-483f-99cf-02c534f6616e","FromRound":200807,"ToRound":200824,"DraftPick":17}]))
        }

        var stats = [{
            PartitionKey: entGen.String(String(year)),
            RowKey: entGen.String("b2b18cc5-891d-43e6-9db2-cfff0d437da0"),
            StatsString: entGen.String(JSON.stringify({
                "9":{"f":9,"m":11,"r":3,"t":42},
                "12":{"f":13,"m":9,"r":1,"t":24},
                "15":{"f":0,"m":8,"r":5,"t":18},
                "1":{"f":5,"m":11,"r":3,"t":18},
                "4":{"f":6,"m":5,"r":2,"t":6},
                "10":{"f":7,"m":6,"r":2,"t":12},
                "13":{"f":0,"m":5,"r":2,"t":0},
                "2":{"f":8,"m":13,"r":4,"t":6},
                "19":{"f":7,"m":4,"r":1,"t":12},
                "8":{"f":20,"m":17,"r":3,"t":6},
                "11":{"f":3,"m":9,"r":4,"t":12},
                "3":{"f":1,"m":5,"r":2,"t":0}}))
        },{
            PartitionKey: entGen.String(String(year)),
            RowKey: entGen.String("ee95cf51-a8d6-483f-99cf-02c534f6616e"),
            StatsString: entGen.String(JSON.stringify({
                "20":{"f":6,"m":20,"r":22,"t":6},
                "3":{"f":0,"m":8,"r":13,"t":0},
                "6":{"f":1,"m":9,"r":14,"t":6},
                "12":{"f":6,"m":10,"r":11,"t":0},
                "15":{"f":0,"m":10,"r":14,"t":6},
                "18":{"f":1,"m":11,"r":17,"t":18},
                "21":{"f":1,"m":11,"r":20,"t":6},
                "4":{"f":6,"m":6,"r":12,"t":24},
                "7":{"f":7,"m":4,"r":6,"t":0},
                "10":{"f":0,"m":7,"r":6,"t":0},
                "13":{"f":13,"m":14,"r":33,"t":6},
                "16":{"f":0,"m":4,"r":7,"t":6},
                "2":{"f":9,"m":11,"r":7,"t":6},
                "19":{"f":1,"m":7,"r":14,"t":12},
                "22":{"f":0,"m":7,"r":6,"t":12},
                "5":{"f":1,"m":8,"r":10,"t":12},
                "11":{"f":12,"m":6,"r":6,"t":6},
                "14":{"f":0,"m":7,"r":12,"t":0},
                "17":{"f":0,"m":9,"r":9,"t":6}}))
        }]

        let players = [{
            PartitionKey: entGen.String('0'),
            RowKey: entGen.String('b2b18cc5-891d-43e6-9db2-cfff0d437da0'),
            Name: entGen.String("Johnny Test")
        },{
            PartitionKey: entGen.String('0'),
            RowKey: entGen.String('ee95cf51-a8d6-483f-99cf-02c534f6616e'),
            Name: entGen.String("Sir Testington")
        }
        ];

        var contractsStore = new FakeStore([contracts]);
        var outputStore = new FakeStore();
        var statsStore = new FakeStore(stats);
        var playersStore = new FakeStore(players);

        statsStore.addQueryResponse("PartitionKey eq '2016' and (RowKey eq '9bedbb07-6255-43e8-9d7c-87dc8300f504' or RowKey eq 'b2b18cc5-891d-43e6-9db2-cfff0d437da0' or RowKey eq 'ee95cf51-a8d6-483f-99cf-02c534f6616e')",
            stats);

        playersStore.addQueryResponse("RowKey eq '9bedbb07-6255-43e8-9d7c-87dc8300f504' or RowKey eq 'b2b18cc5-891d-43e6-9db2-cfff0d437da0' or RowKey eq 'ee95cf51-a8d6-483f-99cf-02c534f6616e'",
            players);

        let handler = new Handler(log, outputStore, contractsStore, statsStore, playersStore);
        handler.process(input).then(() => {
            outputStore.retrieveEntity(clubId, String(String(year))).then((entity) => {
                t.true(entity);
                t.equal(entity.PartitionKey['_'], clubId);
                t.equal(entity.RowKey['_'], String(year));
                var foundContracts = JSON.parse(entity.Contracts['_']);
                t.equal(foundContracts.length, 27);

                var playerId1 = "b2b18cc5-891d-43e6-9db2-cfff0d437da0";
                var playerId1Stats = foundContracts.find((element) => {
                    return element.PlayerId == playerId1
                });

                t.true(playerId1Stats);
                t.equal(playerId1Stats.FromRound, 200807);
                t.equal(playerId1Stats.Stats['9']['f'], 9);
                console.log(`Player1 ${JSON.stringify(playerId1Stats)}`);
                t.equal(playerId1Stats.PlayerName, 'Johnny Test');

                var missingPlayerId = '36881b30-59c0-4fd5-bd9b-b76e42148317';
                var missingPlayerStats = foundContracts.find((element) => {
                    return element.PlayerId == missingPlayerId
                });

                t.equal(missingPlayerStats.PlayerName, missingPlayerId);

                t.end();
            }).catch((err) => {
                console.log(`Error ${err}\n${err.stack}`);
            });
        }).catch((err) => {
            console.log(`Error ${err}\n${err.stack}`);
        });
    });
})();