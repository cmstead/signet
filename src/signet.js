var signet = (function () {
    'use strict';

    function runningInNode() {
        return typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    }

    function throwOnTypeMismatch(type, value, message) {
        if (typeof value !== type) {
            throw new TypeError(message + ', you provided ' + typeof value);
        }
    }

    function isFunctionNotation(signature) {
        return signature.match(/\=\>/g) !== null;
    }

    function isEmptyToken(token) {
        return token.trim() === '';
    }

    function containsValidTypes(signatureTokens) {
        return signatureTokens.filter(isEmptyToken).length === 0;
    }

    function validateSignature(signature) {
        var signatureTokens = signature.split('=>');
        return isFunctionNotation(signature) && containsValidTypes(signatureTokens);
    }

    function sign(signature, userFn) {
        var signatureMsg = 'Invalid signature. All signatures must be formatted as: type list => type list => ... => type';

        throwOnTypeMismatch('string', signature, 'Signature must be a string');
        throwOnTypeMismatch('function', userFn, 'Signee must be a function');

        if (!validateSignature(signature)) {
            throw new SyntaxError(signatureMsg);
        }

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