'use strict';
(function(){
    let tape = require('tape');
    let batcher = require('../utils/batcher.js');

    tape('Batches 10 items into 2 of 5', (t) => {
        let items = [0,1,2,3,4,5,6,7,8,9];
        var result = batcher(items, 5);
        t.equals(result.length, 2);
        t.equals(result[0].length, 5);
        t.equals(result[1].length, 5);
        t.end();
    });

    tape('Less than batch size returns single batch', (t) => {
        let items = [0,1,2,3,4];
        var result = batcher(items, 12);
        t.equals(result.length, 1);
        t.end();
    });

    tape('Batches 10 items into 8 and 2', (t) => {
        let items = [0,1,2,3,4,5,6,7,8,9];
        var result = batcher(items, 8);
        t.equals(result.length, 2);
        t.equals(result[0].length, 8);
        t.equals(result[1].length, 2);
        t.end();
    });

    tape('Batches 9 items into 3 of 3', (t) => {
        let items = [0,1,2,3,4,5,6,7,8];
        var result = batcher(items, 3);
        t.equals(result.length, 3);
        t.equals(result[0].length, 3);
        t.equals(result[1].length, 3);
        t.equals(result[2].length, 3);
        t.end();
    });

    tape('Upper edge', (t) => {
        let items = [0,1,2];
        var result = batcher(items, 3);
        t.equals(result.length, 1);
        t.equals(result[0].length, 3);
        t.end();
    });

    tape('One down', (t) => {
        let items = [0,1,2];
        var result = batcher(items, 2);
        t.equals(result.length, 2);
        t.equals(result[0].length, 2);
        t.equals(result[1].length, 1);
        t.end();
    });

    tape('Zero batchsize throws', (t) => {
        let items = [0,1,2];
        t.throws(() => batcher(items, 0));
        t.end();
    });

    tape('Empty items returns array', (t) => {
        var result = batcher(null, 5);
        t.equal(result.length, 0);
        t.end();
    });
})();