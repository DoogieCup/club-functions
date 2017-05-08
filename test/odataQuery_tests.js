'use strict';
(function(){
    var tape = require('tape');
    var query = require('../utils/odataquery.js');

    tape('Equals', (t) => {
        var output = query().equals('pk', 'value')
            .build();
        t.equals(output, "pk eq 'value'");
        t.end();
    });

    tape('Equals1', (t) => {
        var output = query().equals('pk1', 'value1')
            .build();
        t.equals(output, "pk1 eq 'value1'");
        t.end();
    });

    tape('EqualsInt', (t) => {
        var output = query().equals('pk1', 1)
            .build();
        t.equals(output, "pk1 eq 1");
        t.end();
    });

    tape('TwoEquals throws', (t) => {
        var q = query().equals('pk1', 1);
        t.throws(() => q.equals('pk2', 2));
        t.end();
    });

    tape('TwoEquals with and works', (t) => {
        var output = query().equals('pk1', 1)
        .and((q) => q.equals('pk2', 2))
        .build();
        t.equals(output, "pk1 eq 1 and pk2 eq 2");
        t.end();
    });

    tape('Two ands fails', (t) => {
        var q = query().equals('pk1', 1)
        .and((t) => {return t;});
        t.throws(() => q.and((t) => {return t}));
        t.end();
    });

    tape('or', (t) => {
        var output = query().equals('pk1', 1)
        .or((q) => q.equals('pk2', 2))
        .build();
        t.equals(output, "pk1 eq 1 or pk2 eq 2");
        t.end();
    });
})();