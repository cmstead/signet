var assert = require('chai').assert;
var signet = require('../src/signet')();

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

        it('should make signature function persist optional arguments', function() {
            signet.sign('number, [number] => number', add);

            add.signature = 'foo';

            assert.equal(add.signature, 'number, [number] => number');
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
        
        it('should attach an execution context', function () {
            var testObj = {};
            var signedFn = signet.sign('* => *', function (foo){
                return 'bar';
            }, testObj);
            
            assert.equal(signedFn.executionContext, testObj);
        });

        it('should be signed', function() {
            assert.equal(signet.sign.signature, 'string, function, [object] => function');
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
            var curriedAdd = signet.enforce('number => string => string', 
                function curriedAdd (a){
                    return function (b) {
                        return a + b;
                    }
                });
            
            assert.doesNotThrow(curriedAdd(1).bind(null, 'foo'));
        });

        //  Current goal
        it('should verify return value', function () {
            var badFn = signet.enforce(
                '() => string',
                function badFn (){
                    return 42;
                }
            );
            
            assert.throws(badFn, 'Expected return value of type string but got number');
        });
        
        it('should call function with passed object context', function () {
            var testObj = { foo: 'bar' };
            var enforcedFn = signet.enforce('() => *', function () {
                return this.foo;
            }, testObj);
            
            assert.equal(enforcedFn(), 'bar');
        });

    });
    
    describe('extend', function () {
        
        it('should extend the type language with a new type', function () {
            var intType = signet.enforce('number => boolean', function (value){
                return Math.floor(value) === value;
            });
            
            signet.extend('testInt', intType);
            
            var intAdd = signet.enforce('testInt, testInt => testInt', function(a, b) { return a + b; });
            
            assert.throws(intAdd.bind(null, 1.2, 3));
        });
        
        it('should throw an error if a type is already defined', function () {
            var intType = signet.enforce('number => boolean', function (value){
                return Math.floor(value) === value;
            });
            
            // Int type is already defined from test above. Cannot isolate this test. : (
            assert.throws(signet.extend.bind(null, 'testInt', intType));
        });

        it('should split secondary type values on ; for higher-kinded types', function () {
            var pairType = signet.enforce('array, object => boolean', function (value, typeObj){
                var firstType = typeObj.valueType[0];
                var secondType = typeObj.valueType[1];
                return typeof value[0] === firstType && typeof value[1] === secondType;
            });
            
            signet.extend('testPair', pairType);
            
            var pairFn = signet.enforce('testPair<number; number> => any', function (a) {});
            
            assert.doesNotThrow(pairFn.bind(null, [5, 5]));
            assert.throws(pairFn.bind(null, [5, 'foo']), 'Expected type testPair<number;number> but got object');
        });
        
        it('should provide isTypeOf for higher-kinded type checking', function () {
            var tripleType = signet.enforce('array, object, function => boolean', function tripleType (value, typeObj, isTypeOf){
                return isTypeOf(typeObj.valueType[0])(value[0]) &&
                       isTypeOf(typeObj.valueType[1])(value[1]) &&
                       isTypeOf(typeObj.valueType[2])(value[2]);
            });
            
            signet.extend('testTriple', tripleType);
            
            var tripleFn = signet.enforce('testTriple<number; number; number> => any', function (a) {});
            
            assert.doesNotThrow(tripleFn.bind(null, [5, 6, 7]));
            assert.throws(tripleFn.bind(null, [5, 'foo', 7]));
        });
        
        it('should provide type object to type predicate for richer checking', function () {
            var rangedType = signet.enforce('number, object => boolean', function (value, typeObj) {
                var range = typeObj.valueType;
                var lowerBound = parseInt(range[0], 10);
                var upperBound = parseInt(range[1], 10);
                
                return lowerBound <= value && value <= upperBound;
            });
            
            signet.extend('testRanged', rangedType);
            
            var rangedFn = signet.enforce('testRanged<3;5> => any', function (a) {});
            
            assert.doesNotThrow(rangedFn.bind(null, 4));
            assert.throws(rangedFn.bind(null, 9));
        });
        
    });
    
    describe('subtype', function () {
        
        it('should subtype from an existing type', function () {
            signet.subtype('testInt')('natural', function (value) {
                return value > 0;
            });
            
            var naturalNumberFn = signet.enforce('natural => any', function (a) {});
            
            assert.throws(naturalNumberFn.bind(null, 1.5));
            assert.throws(naturalNumberFn.bind(null, -1));
            assert.doesNotThrow(naturalNumberFn.bind(null, 3));
        })
        
    });
    
    describe('alias', function () {
        
        it('should define a new data type matching requirements', function () {
            signet.alias('testR2IntPoint', 'testPair<number;number>');
            var checkIntPoint = signet.isTypeOf('testR2IntPoint');
            
            assert.equal(checkIntPoint([3, 4]), true);
            assert.equal(checkIntPoint([9.3, 'foo']), false);
        });
        
    });
        
    describe('isTypeOf', function () {
        
        it('should return a predicate function', function () {
            assert.equal(typeof signet.isTypeOf('number'), 'function');
        });
        
        it('should return true if basic type matches', function () {
            assert.equal(signet.isTypeOf('number')(5), true);
        });
        
        it('should return false if basic type does not match', function () {
            assert.equal(signet.isTypeOf('string')({}), false);
        });
        
        it('should not throw on failing subtype check when supertype is not matched', function () {
            assert.doesNotThrow(signet.isTypeOf('testInt').bind(null, 'foo'));
        });
        
        it('should properly check higher-kinded types', function () {
            assert.equal(signet.isTypeOf('testRanged<0;10>')(7), true);
        });

        it('should throw when type does not exist', function () {
            assert.throws(signet.isTypeOf('numumber'), 'Type numumber is not known');
        });
    });
    
});