'use strict';
(function(){

    let basicStrategy = function(input){
        let myInput = input || '';
        let _operator = function(operator, key, value){
                if (typeof(value) == 'string'){
                    value = `'${value}'`;
                }

                let result = `${myInput} ${key} ${operator} ${value}`.trim();
                return joiningStrategy(result);
            }

        return {
            equals: function(key, value){
                return _operator('eq', key, value);
            },
            build: function(){
                return myInput.trim();
            }
        }
    };

    let joiningStrategy = function(input){

        let myInput = input || '';
        let _joiner = function(joiner, fn){
                if (!fn){
                    throw Error(`Cannot join without a fuction`);
                }

                let subClause = fn(basicStrategy()).build();

                let result =  `${myInput} ${joiner} ${subClause}`.trim();
                return basicStrategy(result);
            }

        return {
            and: function(fn){
                return _joiner('and', fn);
            },
            or: function(fn){
                return _joiner('or', fn);
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