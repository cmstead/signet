var signet = (function () {
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

    // State rules for type lexer

    var lexRules = [
        function initRule(key, types) {
            return types.length === 1 ? 'accept' : 'init';
        },

        function failRule(key, types) {
            return isBadTypeList(types) ? 'fail' : key;
        }

    ];

    var lexStates = {
        init: lexRules,
        accept: lexRules,
        fail: [] // Always fails
    }

    // State rules for type verification

    var verifyRules = [
        function accept(key, typeObj, value) {
            return supportedTypes[typeObj.type](value) ? 'accept' : 'fail';
        },

        function skip(key, typeObj) {
            return typeObj.optional && key === 'fail' ? 'skip' : key;
        }
    ];

    var verificationStates = {
        skip: verifyRules,
        accept: verifyRules,
        fail: []
    };

    // State machine execution

    function updateState(states, stateKey, type, value) {
        return states[stateKey].reduce(function (key, rule) {
            return rule(key, type, value);
        }, stateKey);
    }

    var updateLexState = updateState.bind(null, lexStates);
    var updateVerificationState = updateState.bind(null, verificationStates);

    // Predicate functions

    function isType(type) {
        return function (value) {
            return type === typeof value;
        }
    }

    function isInstanceOf(obj) {
        return function (value) {
            return value instanceof obj;
        }
    }

    function matches(pattern) {
        return function (value) {
            return value.match(pattern) !== null;
        }
    }

    function isBadTypeList(types) {
        return types.length === 0 || types.filter(isTypeInvalid).length > 0;
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
        return matches(/^\(\s*\)$/)(token) ? token.replace(/\s*/g, '') : token.replace(/[()]/g, '');
    }

    function splitSignature(signature) {
        return signature.split(/\s*\=\>\s*/g);
    }

    // Metadata attachment

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

    // Type construction

    function buildTypeObj(token) {
        var splitType = token.replace(/[\[\]]/g, '').split(/\s*(\<|\:)\s*/);

        var type = splitType[0];
        var secondaryType = splitType.length > 1 ? splitType.pop().replace('>') : undefined;
        var isValueType = isType('string')(secondaryType) && type === 'array';

        return {
            type: type,
            subType: !isValueType ? secondaryType : undefined,
            valueType: isValueType ? secondaryType : undefined,
            optional: matches(/\[[^\]]+\]/)(token)
        };
    }

    function buildTypeTree(rawToken) {
        return stripParens(rawToken.trim())
            .split(/\s*\,\s*/g)
            .map(buildTypeObj);
    }

    // Verification mutually recursive behavior

    function getNextArgs(state, args) {
        return state === 'skip' ? args : args.slice(1);
    }

    function isVerificationComplete(nextSignature, nextArgs) {
        return nextSignature.length === 0 || nextArgs.length === 0;
    }

    function nextVerificationStep(inputSignature, args, state) {
        var errorMessage = 'Expected type ' + inputSignature[0].type + ' but got ' + typeof args[0];

        var nextSignature = inputSignature.slice(1);
        var nextArgs = getNextArgs(state, args);
        var done = isVerificationComplete(nextSignature, nextArgs);

        throwOnTypeState('fail', state, errorMessage);

        return !done ? verifyOnState(nextSignature, nextArgs, state) : state;
    }

    function verifyOnState(inputSignature, args, inState) {
        var state = isType('undefined')(inState) ? 'accept' : inState;
        var outState = updateVerificationState(state, inputSignature[0], args[0]);

        return nextVerificationStep(inputSignature, args, outState);
    }

    // Type enforcement setup and behavior

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

    // Core functionality

    function sign(signature, userFn) {
        var tokenTree = splitSignature(signature).map(buildTypeTree);

        throwOnInvalidSignature(tokenTree, userFn);

        return attachSignatureData(userFn, signature, tokenTree);
    }

    function verify(signedFn, args) {
        var finalState = verifyOnState(signedFn.signatureTree[0], Array.prototype.slice.call(args, 0));

        throwOnTypeState('skip', finalState, 'Optional types were not fulfilled properly');
    }

    function enforce(signedFn) {
        var enforcementWrapper = buildEnforceWrapper(signedFn);

        attachProp(enforcementWrapper, 'signature', signedFn.signature);
        attachProp(enforcementWrapper, 'signatureTree', signedFn.signatureTree);
        attachProp(enforcementWrapper, 'toString', signedFn.toString.bind(signedFn));

        return enforcementWrapper;
    }

    var signAndEnforce = function (signature, userFn) {
        return enforce(sign(signature, userFn));
    }

    function extend(key, predicate) {
        if (typeof supportedTypes[key] !== 'undefined') {
            throw new Error('Cannot redefine type ' + key);
        }
        
        supportedTypes[key] = predicate;
    }

    // Final module definition

    var signet = {
        enforce: signAndEnforce('string, function => function', signAndEnforce),
        extend: signAndEnforce('string, function => undefined', extend),
        sign: signAndEnforce('string, function => function', sign),
        verify: signAndEnforce('function, object => undefined', verify)
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = signet;
    }

    return signet;

})();