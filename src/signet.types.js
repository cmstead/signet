(function () {
    'use strict';

    if (typeof require === 'function') {
        var signet = require('./signet');
    }

    signet.subtype('number')('int', intType);

    function intType(value) {
        return Math.floor(value) === value;
    }

    signet.subtype('number')('bounded', boundedType);

    function boundedType(value, typeObj) {
        var lowerBound = parseInt(typeObj.valueType[0], 10);
        var upperBound = parseInt(typeObj.valueType[1], 10);
        
        return lowerBound <= value && value <= upperBound;
    }

    signet.subtype('int')('boundedInt', boundedIntType);

    function boundedIntType(value, typeObj) {
        var boundStr = 'bounded<' + typeObj.valueType.join(';') + '>';
        return signet.isTypeOf(boundStr)(value);
    }

    signet.subtype('array')('tuple', tupleType);
    
    function checkType (tuple, type, index){
        return signet.isTypeOf(type)(tuple[index]);
    }
    
    function tupleType(tuple, typeObj, isTypeOf) {
        return tuple.length === typeObj.valueType.length &&
               typeObj.valueType
                    .map(checkType.bind(null, tuple))
                    .reduce(function (a, b) { return a && b; }, true);
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = signet;
    }

})();