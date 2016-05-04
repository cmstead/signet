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
    
    function tupleType(tuple, typeObj) {
        return tuple.length === typeObj.valueType.length &&
               typeObj.valueType
                    .map(checkType.bind(null, tuple))
                    .reduce(function (a, b) { return a && b; }, true);
    }

    signet.subtype('string')('boundedString', boundedStringType);
    
    function boundedStringType (valueStr, typeObj){
        var lowerBound = parseInt(typeObj.valueType[0], 10);
        var upperBound = typeObj.valueType.length > 1 ? parseInt(typeObj.valueType[1], 10) : valueStr.length;
        
        return lowerBound <= valueStr.length && valueStr.length <= upperBound;
    }

    signet.subtype('string')('formattedString', formattedStringType);
    
    function formattedStringType (valueStr, typeObj){
        var pattern = new RegExp(typeObj.valueType[0]);
        
        return valueStr.match(pattern) !== null;
    }

    signet.extend('taggedUnion', taggedUnionType);
    
    function taggedUnionType (value, typeObj){
        return typeObj.valueType.reduce(function (result, type) {
            return result || signet.isTypeOf(type)(value);
        }, false);
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = signet;
    }

})();