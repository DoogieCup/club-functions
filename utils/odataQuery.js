'use strict';
(function(){

    let basicStrategy = function(input){
        let myInput = input || '';

        return {
            _operator: function(operator, key, value){
                if (typeof(value) == 'string'){
                    value = `'${value}'`;
                }

                let result = `${myInput} ${key} ${operator} ${value}`.trim();
                return joiningStrategy(result);
            },
            equals: function(key, value){
                return this._operator('eq', key, value);
            },
            build: function(){
                return myInput.trim();
            }
        }
    };

    let joiningStrategy = function(input){

        let myInput = input || '';

        return {
            _joiner: function(joiner, fn){
                if (!fn){
                    throw Error(`Cannot join without a fuction`);
                }

                let subClause = fn(basicStrategy()).build();

                let result =  `${myInput} ${joiner} ${subClause}`.trim();
                return basicStrategy(result);
            },
            and: function(fn){
                return this._joiner('and', fn);
            },
            or: function(fn){
                return this._joiner('or', fn);
            },
            build: function(){
                return myInput.trim();
            }
        };
    }

    module.exports = function(){
        return basicStrategy();
    }
})();