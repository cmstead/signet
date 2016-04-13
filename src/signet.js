var signet = (function() {
    'use strict';

    var supportedTypes = {
        '()': alwaysTrue,
        any: alwaysTrue,
        array: isInstanceOf.bind(null, Array),
        boolean: isType.bind(null, 'boolean'),
        function: isType.bind(null, 'function'),
        number: isType.bind(null, 'number'),
        object: isType.bind(null, 'object'),
        string: isType.bind(null, 'string'),
        symbol: isType.bind(null, 'symbol'),
        undefined: isType.bind(null, 'undefined')
    };

    // State machine for type lexer
    var lexRules = [
        function initRule(key, types) {
            return types.length > 1 ? 'init' : key;
        },

        function acceptRule(key, types) {
            return types.length === 1 ? 'accept' : key;
        },

        function failRule(key, types) {
            return types.length === 0 || hasInvalidTypes(types) ? 'fail' : key;
        }

    ];

    var lexStates = {
        init: lexRules,
        accept: lexRules,
        fail: [] // Always fails
    }

    var verifyRules = [
        function skip(key, type) {
            return isOptional(type) ? 'skip' : 'accept';
        },

        function failRule(key, type, value) {
            return key !== 'skip' && !isTypeMatch(type, value) ? 'fail' : key;
        }
    ];

    var verificationStates = {
        skip: verifyRules,
        accept: verifyRules,
        fail: []
    };

    function updateState(states, stateKey, type, value) {
        return states[stateKey].reduce(function(key, rule) {
            return rule(key, type, value);
        }, stateKey);
    }

    function updateLexState(stateKey, value) {
        return updateState(lexStates, stateKey, value);
    }

    function updateVerificationState(stateKey, type, value) {
        return updateState(verificationStates, stateKey, type, value);
    }

    // Predicate functions

    function isOptional(type) {
        return type.match(/\[[^\]]+\]/) !== null;
    }

    function alwaysTrue() {
        return true;
    }

    function isType(type, value) {
        return type === typeof value;
    }

    function isInstanceOf(obj, value) {
        return value instanceof obj;
    }

    function hasInvalidTypes(types) {
        return types.filter(isTypeInvalid).length > 0;
    }

    function isUnsupportedSubtype(typeTokens) {
        return typeTokens.length > 1 && typeTokens[0] !== 'object';
    }

    function isUnsupportedType(typeTokens) {
        var type = typeTokens[0].replace(/([\[\]]|\<[^>]*\>)/g, '');
        return supportedTypes[type] === undefined;
    }

    function isTypeInvalid(rawType) {
        var typeTokens = rawType.split(':');

        return isUnsupportedSubtype(typeTokens) || isUnsupportedType(typeTokens);
    }

    function isTypeMatch(rawType, value) {
        var type = rawType.replace(/(\<[^\>]*\>|\:.*$|[\[\]])/g, '');

        return supportedTypes[type](value);
    }

    function hasNoArgs(token) {
        return token.match(/^\(\)$/) !== null;
    }

    function verifyTokenTree(tokenTree) {
        return tokenTree.length > 1 && tokenTree.reduce(updateLexState, 'init') === 'accept';
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

    function throwOnSignatureMismatch(tokenTree, userFn) {
        if (tokenTree[0].length < userFn.length) {
            throw new Error('All function parameters are not accounted for in type definition')
        }
    }

    function throwOnInvalidTypeState(statePattern, state, message) {
        if (state.match(statePattern) !== null) {
            throw new TypeError(message);
        }
    }

    // Utility functions

    function stripParens(token) {
        return hasNoArgs(token) ? token : token.replace(/[()]/g, '');
    }

    function stripParensAndSplit(rawToken) {
        return stripParens(rawToken.trim()).split(/\s*\,\s*/g);
    }

    function parseSignature(signature) {
        return signature
            .split(/\s*\=\>\s*/g)
            .map(stripParensAndSplit);
    }

    function attachProp(userFn, propName, value) {
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

    function verificationComplete(inputSignature, args) {
        return inputSignature.length === 0 || args.length === 0;
    }

    function nextVerificationStep(inputSignature, args, state) {
        var nextSignature = inputSignature.slice(1);
        var nextArgs = state === 'skip' ? args : args.slice(1);
        var complete = verificationComplete(nextSignature, nextArgs);

        var errorMessage = 'Expected type ' + inputSignature[0] + ' but got ' + typeof args[0];
        throwOnInvalidTypeState(/^fail$/, state, errorMessage);

        return complete ? state : verifyOnState(nextSignature, nextArgs, state);
    }

    function verifyOnState(inputSignature, args, inState) {
        var state = typeof inState === 'undefined' ? 'accept' : inState;
        var outState = updateVerificationState(state, inputSignature[0], args[0]);

        return nextVerificationStep(inputSignature, args, outState);
    }

    function verify(signedFn, args) {
        var errorMessage = 'Optional types were not fulfilled properly';
        var finalState = verifyOnState(signedFn.signatureTree[0], Array.prototype.slice.call(args, 0));

        throwOnInvalidTypeState(/^(fail|skip)$/, finalState, errorMessage);
    }

    function buildWrapperArgs(signedFn, args) {
        var done = signedFn.length <= args.length;

        return !done ? buildWrapperArgs(signedFn, args.concat(['x' + args.length])) : args.join(',');
    }

    function enforceNext (lastFn, result){
        var signatureTokens = lastFn.signature.split(/\s*\=\>\s*/g);
        var updatedResult = result;
        
        if(signatureTokens.length > 2) {
            attachProp(result, 'signature', signatureTokens.slice(1).join(' => '));
            attachProp(result, 'signatureTree', lastFn.signatureTree.slice(1));
            updatedResult = enforce(result);
        }
        
        return updatedResult;
    }
    
    function callAndSign (signedFn, args){
        var result = signedFn.apply(null, args);
        return enforceNext(signedFn, result);
    }

    function buildEnforceWrapper(signedFn) {
        var wrapperTemplate = 'return function enforceWrapper (' + buildWrapperArgs(signedFn, []) + ') {' +
            'verify(signedFn, arguments);' +
            'return callAndSign(signedFn, Array.prototype.slice.call(arguments));' +
            '};';
        
        var wrapperFn = new Function(['signedFn', 'verify', 'callAndSign'], wrapperTemplate);
        
        return wrapperFn(signedFn, verify, callAndSign);
    }

    function enforce(signedFn) {
        var enforceWrapper = buildEnforceWrapper(signedFn);

        attachProp(enforceWrapper, 'signature', signedFn.signature);
        attachProp(enforceWrapper, 'signatureTree', signedFn.signatureTree);
        attachProp(enforceWrapper, 'toString', signedFn.toString.bind(signedFn));

        return enforceWrapper;
    }

    var signet = {
        enforce: sign('string, function => function', function(signature, userFn) {
            return enforce(sign(signature, userFn));
        }),
        sign: sign('string, function => function', sign),
        verify: sign('function, object => undefined', verify)
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = signet;
    }

    return signet;

})();