var assert = require('chai').assert;
var signet = require('../src/signet');

describe('signet', function() {

    describe('sign', function() {
        var add;

        beforeEach(function() {
            add = function(a, b) {
                return a + b;
            }
        })

        it('should add a signature property to passed function', function() {
            signet.sign('number, number => number', add);

            assert.equal(typeof add.signature, 'string');
        });

        it('should make signature property immutable', function() {
            signet.sign('number, number => number', add);

            add.signature = 'foo';

            assert.equal(add.signature, 'number, number => number');
        });

        it('should add a signature AST to passed function', function() {
            var expected = '[[{"type":"number","optional":false},{"type":"number","optional":false}],[{"type":"number","optional":false}]]';

            signet.sign('number, number => number', add);

            assert.equal(JSON.stringify(add.signatureTree), expected);
        });

        it('should make signatureTree property immutable', function() {
            var expected = '[[{"type":"number","optional":false},{"type":"number","optional":false}],[{"type":"number","optional":false}]]';

            signet.sign('number, number => number', add);

            add.signatureTree = [];

            assert.equal(JSON.stringify(add.signatureTree), expected);
        });

        it('should throw an error if signature is not a string', function() {
            assert.throws(signet.sign.bind(null, {}, add));
        });

        it('should throw an error if userFn is not a function', function() {
            assert.throws(signet.sign.bind(null, 'number => number', {}));
        });

        it('should throw an error if fat arrow is missing', function() {
            assert.throws(signet.sign.bind(null, 'number', add));
        });

        it('should throw an error if types are missing on left of fat arrow', function() {
            assert.throws(signet.sign.bind(null, ' => number', add));
        });

        it('should throw an error if type is missing on right of fat arrow', function() {
            assert.throws(signet.sign.bind(null, 'number => ', add));
        });

        it('should throw an error if type is missing at any point in the chain', function() {
            assert.throws(signet.sign.bind(null, 'number => => number', add));
        });

        it('should throw an error if final type contains multiple definitions', function() {
            assert.throws(signet.sign.bind(null, 'number => number, string', add));
        });

        it('should throw an error if a type is invalid in a list', function() {
            assert.throws(signet.sign.bind(null, 'number, => number', add));
        });

        it('should throw an error if type contains spaces', function() {
            assert.throws(signet.sign.bind(null, 'nu mber => number', add));
        });

        it('should throw an error if all function parameters are not typed', function() {
            assert.throws(signet.sign.bind(null, 'number => number', add));
        });

        it('should throw an error if any variable type names are unrecognized', function() {
            assert.throws(signet.sign.bind(null, 'foo, number => number', add));
        });

        it('should not throw an error if object:whatever is the type', function() {
            assert.doesNotThrow(signet.sign.bind(null, 'object:foo, number => number', add));
        });

        it('should throw an error if non-object data type contains a colon', function() {
            assert.throws(signet.sign.bind(null, 'number:foo, number => number', add));
        });

        it('should not throw an error if type is a typed array i.e. array<number>', function() {
            assert.doesNotThrow(signet.sign.bind(null, 'array<number>, number => number', add));
        });

        it('should not throw an error if type is optional', function() {
            assert.doesNotThrow(signet.sign.bind(null, '[number], number => number', add));
        });

        it('should return original function', function() {
            var result = signet.sign('number, number => number', add);

            assert.equal(result, add);
        });

        it('should be signed', function() {
            assert.equal(signet.sign.signature, 'string, function => function');
        });

    });

    describe('verify', function() {

        function buildSignedFn(signature) {
            return signet.sign(signature, function(a) { });
        }

        it('should not throw an error if boolean argument is correctly matched', function() {
            var testFn = buildSignedFn('boolean => any');
            assert.doesNotThrow(signet.verify.bind(null, testFn, [true]));
        });

        it('should throw an error if boolean argument is not matched', function() {
            var testFn = buildSignedFn('boolean => any');
            assert.throws(signet.verify.bind(null, testFn, ['foo']));
        });

        it('should not throw an error if function argument is correctly matched', function() {
            var testFn = buildSignedFn('function => any');
            assert.doesNotThrow(signet.verify.bind(null, testFn, [testFn]));
        });

        it('should throw an error if number function is not matched', function() {
            var testFn = buildSignedFn('function => any');
            assert.throws(signet.verify.bind(null, testFn, ['foo']));
        });

        it('should not throw an error if number argument is correctly matched', function() {
            var testFn = buildSignedFn('number => any');
            assert.doesNotThrow(signet.verify.bind(null, testFn, [5]));
        });

        it('should throw an error if number argument is not matched', function() {
            var testFn = buildSignedFn('number => any');
            assert.throws(signet.verify.bind(null, testFn, ['foo']));
        });

        it('should not throw an error if object argument is correctly matched', function() {
            var testFn = buildSignedFn('object => any');
            assert.doesNotThrow(signet.verify.bind(null, testFn, [{}]));
        });

        it('should throw an error if object argument is not matched', function() {
            var testFn = buildSignedFn('object => any');
            assert.throws(signet.verify.bind(null, testFn, ['foo']));
        });

        it('should not throw an error if string argument is correctly matched', function() {
            var testFn = buildSignedFn('string => any');
            assert.doesNotThrow(signet.verify.bind(null, testFn, ['pass']));
        });

        it('should throw an error if string argument is not matched', function() {
            var testFn = buildSignedFn('string => any');
            assert.throws(signet.verify.bind(null, testFn, [987]));
        });

        it('should not throw an error if symbol argument is correctly matched', function() {
            var testFn = buildSignedFn('symbol => any');
            assert.doesNotThrow(signet.verify.bind(null, testFn, [Symbol('foo')]));
        });

        it('should throw an error if symbol argument is not matched', function() {
            var testFn = buildSignedFn('symbol => any');
            assert.throws(signet.verify.bind(null, testFn, [987]));
        });

        it('should not throw an error if undefined argument is correctly matched', function() {
            var testFn = buildSignedFn('undefined => any');
            assert.doesNotThrow(signet.verify.bind(null, testFn, []));
        });

        it('should throw an error if undefined argument is not matched', function() {
            var testFn = buildSignedFn('undefined => any');
            assert.throws(signet.verify.bind(null, testFn, [987]));
        });

        it('should not throw an error if array argument is correctly matched', function() {
            var testFn = buildSignedFn('array => any');
            assert.doesNotThrow(signet.verify.bind(null, testFn, [[]]));
        });

        it('should throw an error if array argument is not matched', function() {
            var testFn = buildSignedFn('array => any');
            assert.throws(signet.verify.bind(null, testFn, [987]));
        });

        it('should throw an error if second value is a type mismatch', function() {
            var testFn = buildSignedFn('number, string => any');
            assert.throws(signet.verify.bind(null, testFn, [5, 5]));
        });

        it('should throw an error if later values are mismatched', function() {
            var testFn = buildSignedFn('number, any, string => any');
            assert.throws(signet.verify.bind(null, testFn, [5, 'foo', 5]));
        });

        it('should not throw an error if array has a secondary type', function() {
            var testFn = buildSignedFn('array<secondary> => number');
            assert.doesNotThrow(signet.verify.bind(null, testFn, [[]]));
        });

        it('should not throw an error if object has a secondary type', function() {
            var testFn = buildSignedFn('object:secondary => number');
            assert.doesNotThrow(signet.verify.bind(null, testFn, [{}]));
        });

        it('should not throw an error if optional argument is not satisfied', function() {
            var testFn = buildSignedFn('[number], string => number');
            assert.doesNotThrow(signet.verify.bind(null, testFn, ['foo']));
        });

        it('should throw an error if optional argument is not satisfied and extra values are left', function() {
            var testFn = buildSignedFn('[number], string, [number] => number');
            assert.throws(signet.verify.bind(null, testFn, ['foo', 'bar']));
        });

    });

    describe('enforce', function() {

        var add;
        var signature;

        beforeEach(function() {
            add = function add(a, b) {
                return a + b;
            }
            
            signature = 'number, number => number';
        });

        it('should return a function', function() {
            assert.equal(typeof signet.enforce(signature, add), 'function');
        });

        it('should return a function which throws an error if contract is not fulfilled', function() {
            assert.throws(signet.enforce(signature, add).bind(null, 5, 'foo'));
        });

        it('should return a function which throws an error only if contract is not fulfilled', function() {
            assert.doesNotThrow(signet.enforce(signature, add).bind(null, 5, 5));
        });

        it('should return a function which returns correct result on execution', function() {
            assert.equal(signet.enforce(signature, add)(5, 5), 10);
        });

        it('should return a function with correct signature', function() {
            assert.equal(signet.enforce(signature, add).signature, add.signature);
        });

        it('should return a function with correct signature tree', function() {
            assert.equal(signet.enforce(signature, add).signatureTree, add.signatureTree);
        });

        it('should return a function with the correct argument length', function() {
            assert.equal(signet.enforce(signature, add).length, add.length);
        });

        it('should return a function with toString which returns string version of original fn', function() {
            assert.equal(signet.enforce(signature, add).toString(), add.toString());
        });

        it('should enforce curried functions', function () {
            var curriedAdd = signet.enforce('number => number => number', 
                function curriedAdd (a){
                    return function (b) {
                        return a + b;
                    }
                });
            
            assert.throws(curriedAdd(1).bind(null, 'foo'));
        });

        it('should enforce curried functions and resolve on success', function () {
            var curriedAdd = signet.enforce('number => string => number', 
                function curriedAdd (a){
                    return function (b) {
                        return a + b;
                    }
                });
            
            assert.doesNotThrow(curriedAdd(1).bind(null, 'foo'));
        });

    });

});