'use strict';
(function(){
    let context = function(inner) {

        let joined = false;

        let build = function(input){
            let result = input.trim();
            return joined && inner ? `(${result})` : result;
        }

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
                    return build(myInput);
                }
            }
        };

        let joiningStrategy = function(input){
            let myInput = input || '';
            let _joiner = function(joiner, fn){
                if (!fn){
                    throw Error(`Cannot join without a fuction`);
                }

                let subClause = fn(context(true)).build();

                let result =  `${myInput} ${joiner} ${subClause}`.trim();
                joined = true;
                return joiningStrategy(result);
            }

            return {
                and: function(fn){
                    return _joiner('and', fn);
                },
                or: function(fn){
                    return _joiner('or', fn);
                },
                build: function(){
                    return build(myInput);
                }
            };
        }

        return basicStrategy();
    }

    module.exports = function(){
        return context();
    }
})();