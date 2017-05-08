'use strict';
(function(){
    module.exports = function(items, batchSize){

        if (batchSize < 1){
            throw Error('Must have positive batch size');
        }

        if (!items){
            return [];
        }

        if (items.length <= batchSize){
            return [items];
        }

        let recurse = function(items) {
            if (items.length <= batchSize){
                return [items];
            }

            var left = recurse(items.slice(0, batchSize));
            var right = recurse(items.slice(batchSize, items.length));

            return left.concat(right);
        };

        return recurse(items);
    };
})();