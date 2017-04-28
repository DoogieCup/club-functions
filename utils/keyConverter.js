'use strict';
(function(){
    module.exports.parseVersion = function(version){
        return parseInt(version.replace(/^0*/g, ''));
    };

    module.exports.toVersionKey = function(version){
        return ('0000000000' + String(version)).slice(-10);
    };

    module.exports.parseRound = function(round){
        var year = String(round).slice(0, 4);
        var newRound = String(round).slice(4, 6);

        return {year: parseInt(year), round: parseInt(newRound)};
    };

    module.exports.toRoundKey = function(year, round){
        var newRound = ('00' + String(round)).slice(-2);
        return String(year) + String(newRound);
    };
})();