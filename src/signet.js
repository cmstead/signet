var signet = (function() {
    'use strict';

    // State machine for type lexer
    var rules = [
        function initRule(key, types) {
            return types.length > 1 ? 'init' : key;
        },

        function acceptRule(key, types) {
            return types.length === 1 ? 'accept' : key;
        },

        function failRule(key, types) {
            return types.length === 0 ? 'fail' : key;
        },

        function typeRule (key, types){
            return types.filter(isTypeInvalid).length > 0 ? 'fail' : key;
        }
    ];

    var states = {
        init: rules,
        accept: rules,
        fail: [] // Always fails
    }

    function updateState(stateKey, value) {
        return states[stateKey].reduce(function(key, rule) {
            return rule(key, value);
        }, stateKey);
    }

    // Predicate functions

    function isTypeInvalid(type) {
        var pattern = /(^\s*$|\s+)/g;
        return type.match(pattern) !== null;
    }

    function hasNoArgs(token) {
        return token.match(/^\(\s*\)$/) !== null;
    }

    function verifyTokenTree(tokenTree) {
        return tokenTree.length > 1 && tokenTree.reduce(updateState, 'init') === 'accept';
    }

    // Throw on error functions

    function throwOnTypeMismatch(type, value, message) {
        if (typeof value !== type) {
            throw new TypeError(message + ', you provided ' + typeof value);
        }
    }

    function throwOnInvalidSignature(tokenTree) {
        if (!verifyTokenTree(tokenTree)) {
            throw new Error('Invalid function signature; ensure all input and output paths are valid');
        }
    }
    
    function throwOnSignatureMismatch (tokenTree, userFn){
        if(tokenTree[0].length < userFn.length) {
            throw new Error('All function parameters are not accounted for in type definition')
        }
    }

    // Utility functions

    function stripParens(rawToken) {
        var token = rawToken.trim();
        return hasNoArgs(token) ? token : token.replace(/[()]/g, '');
    }

    function stripParensAndSplit(rawToken) {
        return stripParens(rawToken).split(/\s*\,\s*/g);
    }

    function parseSignature(signature) {
        return signature
            .split(/\s*\=\>\s*/g)
            .map(stripParensAndSplit);
    }

    function attachProp (userFn, propName, value){
        Object.defineProperty(userFn, propName, {
            value: value,
            writeable: false
        });
    }

    // Core functionality

    function sign(signature, userFn) {
        throwOnTypeMismatch('string', signature, 'Signature must be a string');
        throwOnTypeMismatch('function', userFn, 'Signee must be a function');

        var tokenTree = parseSignature(signature);

        throwOnInvalidSignature(tokenTree);
        throwOnSignatureMismatch(tokenTree, userFn);

        attachProp(userFn, 'signature', signature);
        attachProp(userFn, 'signatureTree', tokenTree);

        return userFn;
    }

    sign('string, function => function', sign);
    
    var signet = {
        sign: sign
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = signet;
    }

    return signet;

})();