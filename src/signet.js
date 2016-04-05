var signet = (function () {
    'use strict';

    // Predicate functions
    
    function runningInNode() {
        return typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    }

    function isTypeValid (type){
        return typeof type === 'string' && type.trim() !== '';
    }

    function isLastTypeOk (tokenTree){
        return tokenTree[tokenTree.length - 1].filter(isTypeValid).length === 1;
    }

    function hasFatArrow (tokenTree){
        return tokenTree.length > 1;
    }

    function isTokenTreeValid (tokenTree){
        return tokenTree
            .reduce(function (validated, tokens) {
                return validated && tokens.filter(isTypeValid).length > 0;
            }, hasFatArrow(tokenTree) && isLastTypeOk(tokenTree));
    }

    function hasNoArgs (token){
        return token.match(/^\(\s*\)$/) !== null;
    }

    // Utility functions

    function stripParens (rawToken){
        var token = rawToken.trim();
        return hasNoArgs(token) ? token : token.replace(/[()]/g, '');
    }
    
    function splitTypes (token){
        return token.split(/\s*\,\s*/g);
    }

    function buildTokenTree (signature){
        return signature
            .split(/\s*\=\>\s*/g)
            .map(stripParens)
            .map(splitTypes);
    }

    // Throw on error functions
    
    function throwOnInvalidSignature (signature){
        var tokenTree = buildTokenTree(signature);
        var message = 'Invalid function signature; ensure all input and output paths are valid.';
        
        if(!isTokenTreeValid(tokenTree)) {
            throw new Error(message);
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
        throwOnInvalidSignature(signature);

        Object.defineProperty(userFn, 'signature', {
            value: signature,
            writeable: false
        });

        return userFn;
    }

    var signet = {
        sign: sign
    };

    if (runningInNode()) {
        module.exports = signet;
    }

    return signet;

})();