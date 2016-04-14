var signet = (function() {
    'use strict';

    var supportedTypes = {
        '()': isType('string'),
        any: isType('string'),
        array: isInstanceOf(Array),
        boolean: isType('boolean'),
        function: isType('function'),
        number: isType('number'),
        object: isType('object'),
        string: isType('string'),
        symbol: isType('symbol'),
        undefined: isType('undefined')
    };

    // State machine for type lexer
    var lexRules = [
        function initRule(key, types) {
            return types.length === 1 ? 'accept' : 'init';
        },

        function failRule(key, types) {
            var badTypes = types.filter(isTypeInvalid);
            return types.length === 0 || badTypes.length > 0 ? 'fail' : key;
        }

    ];

    var lexStates = {
        init: lexRules,
        accept: lexRules,
        fail: [] // Always fails
    }

    var verifyRules = [
        function skip(key, type) {
            return type.optional ? 'skip' : 'accept';
        },

        function failRule(key, typeObj, value) {
            return key !== 'skip' && !supportedTypes[typeObj.type](value) ? 'fail' : key;
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

    var updateLexState = updateState.bind(null, lexStates);
    var updateVerificationState = updateState.bind(null, verificationStates);

    // Predicate functions

    function isType(type) {
        return function(value) {
            return type === typeof value;
        }
    }

    function isInstanceOf(obj) {
        return function(value) {
            return value instanceof obj;
        }
    }

    function hasNoArgs(token) {
        return token.match(/^\(\)$/) !== null;
    }

    function isTypeInvalid(typeObj) {
        var unsupportedType = !isType('function')(supportedTypes[typeObj.type]);
        var unsupportedSubtype = isType('string')(typeObj.subType) && typeObj.type !== 'object';

        return unsupportedType || unsupportedSubtype;
    }

    // Throw on error functions

    function throwOnTypeMismatch(type, value, message) {
        if (typeof value !== type) {
            throw new TypeError(message + ', you provided ' + typeof value);
        }
    }

    function throwOnInvalidSignature(tokenTree, userFn) {
        var shortTokenTree = tokenTree <= 1;
        var typesOkay = tokenTree.reduce(updateLexState, 'init') === 'accept';
        var lengthOkay = tokenTree[0].length >= userFn.length;

        var message = !lengthOkay ?
            'All function parameters are not accounted for in type definition' :
            'Invalid function signature; ensure all input and output paths are valid';

        if (!lengthOkay || shortTokenTree || !typesOkay) {
            throw new Error(message);
        }
    }

    function throwOnTypeState(failState, state, message) {
        if (state === failState) {
            throw new TypeError(message);
        }
    }

    // Utility functions

    function stripParens(token) {
        return hasNoArgs(token) ? token.replace(/\s*/g, '') : token.replace(/[()]/g, '');
    }

    function buildTypeObj(token) {
        var splitType = token.split(/\s*(\<|\:)\s*/);
        var type = splitType[0].replace(/[\[\]]/g, '');
        var secondaryType = splitType.length > 1 ? splitType.pop() : undefined;
        var isValueType = isType('string')(secondaryType) && secondaryType.match(/^[^\>]+\>/g) !== null;

        return {
            type: type,
            subType: !isValueType ? secondaryType : undefined,
            valueType: isValueType ? secondaryType.replace('>', '') : undefined,
            optional: token.match(/\[[^\]]+\]/) !== null
        };
    }

    function splitSignature(signature) {
        return signature.split(/\s*\=\>\s*/g);
    }

    function buildTypeTree(rawToken) {
        return stripParens(rawToken.trim())
            .split(/\s*\,\s*/g)
            .map(buildTypeObj);
    }

    function parseSignature(signature) {
        return splitSignature(signature).map(buildTypeTree);
    }

    function attachProp(userFn, propName, value) {
        Object.defineProperty(userFn, propName, {
            value: value,
            writeable: false
        });
    }

    function attachSignatureData(userFn, signature, tokenTree) {
        if (tokenTree.length > 1) {
            attachProp(userFn, 'signature', signature);
            attachProp(userFn, 'signatureTree', tokenTree);
        }

        return userFn;
    }

    // Core functionality

    function sign(signature, userFn) {
        var tokenTree = parseSignature(signature);

        throwOnInvalidSignature(tokenTree, userFn);

        return attachSignatureData(userFn, signature, tokenTree);
    }

    function nextVerificationStep(inputSignature, args, state) {
        var errorMessage = 'Expected type ' + inputSignature[0].type + ' but got ' + typeof args[0];

        var nextSignature = inputSignature.slice(1);
        var nextArgs = state === 'skip' ? args : args.slice(1);
        var complete = nextSignature.length === 0 || nextArgs.length === 0;

        throwOnTypeState('fail', state, errorMessage);

        return complete ? state : verifyOnState(nextSignature, nextArgs, state);
    }

    function verifyOnState(inputSignature, args, inState) {
        var state = typeof inState === 'undefined' ? 'accept' : inState;
        var outState = updateVerificationState(state, inputSignature[0], args[0]);

        return nextVerificationStep(inputSignature, args, outState);
    }

    function verify(signedFn, args) {
        var finalState = verifyOnState(signedFn.signatureTree[0], Array.prototype.slice.call(args, 0));

        throwOnTypeState('skip', finalState, 'Optional types were not fulfilled properly');
    }

    function buildWrapperArgs(signedFn, args) {
        var done = signedFn.length <= args.length;

        return !done ? buildWrapperArgs(signedFn, args.concat(['x' + args.length])) : args.join(',');
    }

    function callAndEnforce(signedFn, args) {
        var result = signedFn.apply(null, args);
        var signature = splitSignature(signedFn.signature).slice(1).join(' => ');
        var tokenTree = signedFn.signatureTree.slice(1);

        attachSignatureData(result, signature, tokenTree);

        return tokenTree.length > 1 ? enforce(result) : result;
    }

    function buildEnforceWrapper(signedFn) {
        var wrapperTemplate = 'return function enforceWrapper (' + buildWrapperArgs(signedFn, []) + ') {' +
            'verify(signedFn, arguments);' +
            'return callAndEnforce(signedFn, Array.prototype.slice.call(arguments));' +
            '};';

        var wrapperFn = new Function(['signedFn', 'verify', 'callAndEnforce'], wrapperTemplate);

        return wrapperFn(signedFn, verify, callAndEnforce);
    }

    function enforce(signedFn) {
        var enforceWrapper = buildEnforceWrapper(signedFn);

        attachProp(enforceWrapper, 'signature', signedFn.signature);
        attachProp(enforceWrapper, 'signatureTree', signedFn.signatureTree);
        attachProp(enforceWrapper, 'toString', signedFn.toString.bind(signedFn));

        return enforceWrapper;
    }

    var signAndEnforce = function(signature, userFn) {
        return enforce(sign(signature, userFn));
    }

    var signet = {
        enforce: signAndEnforce('string, function => function', signAndEnforce),
        sign: signAndEnforce('string, function => function', sign),
        verify: signAndEnforce('function, object => undefined', verify)
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = signet;
    }

    return signet;

})();