var signet = (function() {
    'use strict';

    // State machine for type lexer
    function stripValidTypes (types){
        return types.filter(isTypeInvalid);
    }

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
            return stripValidTypes(types).length > 0 ? 'fail' : key;
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

    function runningInNode() {
        return typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    }

    function isTypeInvalid(type) {
        // This will expand over time to perform a richer test
        return type === '';
    }

    function isTokenTreeValid(tokenTree) {
        return tokenTree.length > 1 && tokenTree.reduce(updateState, 'init') === 'accept';
    }

    function hasNoArgs(token) {
        return token.match(/^\(\s*\)$/) !== null;
    }

    // Utility functions

    function stripParens(rawToken) {
        var token = rawToken.trim();
        return hasNoArgs(token) ? token : token.replace(/[()]/g, '');
    }

    function splitTypes(token) {
        return token.split(/\s*\,\s*/g);
    }

    function stripParensAndSplit(rawToken) {
        return splitTypes(stripParens(rawToken));
    }

    function parseSignature(signature) {
        return signature
            .split(/\s*\=\>\s*/g)
            .map(stripParensAndSplit);
    }

    // Throw on error functions

    function throwOnInvalidSignature(tokenTree) {
        if (!isTokenTreeValid(tokenTree)) {
            throw new Error('Invalid function signature; ensure all input and output paths are valid.');
        }
    }

    function throwOnTypeMismatch(type, value, message) {
        if (typeof value !== type) {
            throw new TypeError(message + ', you provided ' + typeof value);
        }
    }

    // Core functionality

    function sign(signature, userFn) {
        throwOnTypeMismatch('string', signature, 'Signature must be a string');
        throwOnTypeMismatch('function', userFn, 'Signee must be a function');

        var tokenTree = parseSignature(signature);

        throwOnInvalidSignature(tokenTree);

        Object.defineProperty(userFn, 'signature', {
            value: signature,
            writeable: false
        });

        Object.defineProperty(userFn, 'signatureTree', {
            value: tokenTree,
            writeable: false
        });

        return userFn;
    }

    sign('string, function => function', sign);
    
    var signet = {
        sign: sign
    };

    if (runningInNode()) {
        module.exports = signet;
    }

    return signet;

})();