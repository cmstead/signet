var assert = require('chai').assert;
var signet = require('../src/signet');

describe('signet', function () {

    describe('sign', function () {
        var add;
        
        beforeEach(function () {
            add = function (a, b){
                return a + b;
            }
        })
        
        it('should add a signature property to passed function', function () {
            signet.sign('number, number => number', add);
            
            assert.equal(typeof add.signature, 'string');
        });
        
        it('should make signature property immutable', function () {
            signet.sign('number, number => number', add);
            
            add.signature = 'foo';
            
            assert.equal(add.signature, 'number, number => number');
        });
        
        it('should add a signature AST to passed function', function () {
            var expected = [['number', 'number'], ['number']];
            
            signet.sign('number, number => number', add);
            
            assert.equal(add.signatureTree.toString(), expected.toString());
        });
        
        it('should make signatureTree property immutable', function () {
            var expected = [['number', 'number'], ['number']];

            signet.sign('number, number => number', add);
            
            add.signatureTree = [];
            
            assert.equal(add.signatureTree.toString(), expected.toString());
        });
        
        it('should throw an error if signature is not a string', function () {
            assert.throws(signet.sign.bind(null, {}, add));
        });
        
        it('should throw an error if userFn is not a function', function () {
            assert.throws(signet.sign.bind(null, 'number => number', {}));
        });
        
        it('should throw an error if fat arrow is missing', function () {
            assert.throws(signet.sign.bind(null, 'number', add));
        });
        
        it('should throw an error if types are missing on left of fat arrow', function () {
            assert.throws(signet.sign.bind(null, ' => number', add));
        });
        
        it('should throw an error if type is missing on right of fat arrow', function () {
            assert.throws(signet.sign.bind(null, 'number => ', add));
        });
        
        it('should throw an error if type is missing at any point in the chain', function () {
            assert.throws(signet.sign.bind(null, 'number => => number', add));
        });
        
        it('should throw an error if final type contains multiple definitions', function () {
            assert.throws(signet.sign.bind(null, 'number => number, string', add));
        });
        
        it('should throw an error if a type is invalid in a list', function () {
            assert.throws(signet.sign.bind(null, 'number, => number', add));
        });
        
        it('should throw an error if type contains spaces', function () {
            assert.throws(signet.sign.bind(null, 'nu mber => number', add));
        });
        
        it('should throw an error if all function parameters are not typed', function () {
            assert.throws(signet.sign.bind(null, 'number => number', add));
        });
        
        it('should throw an error if any variable type names are unrecognized', function () {
            assert.throws(signet.sign.bind(null, 'foo, number => number', add));
        });
        
        it('should not throw an error if object:whatever is the type', function () {
            assert.doesNotThrow(signet.sign.bind(null, 'object:foo, number => number', add));
        });
        
        it('should throw an error if non-object data type contains a colon', function () {
            assert.throws(signet.sign.bind(null, 'number:foo, number => number', add));
        });
        
        it('should not throw an error if type is a typed array i.e. array<number>', function () {
            assert.doesNotThrow(signet.sign.bind(null, 'array<number>, number => number', add));
        });
        
        it('should not throw an error if type is optional', function () {
            assert.doesNotThrow(signet.sign.bind(null, '[number], number => number', add));
        });
        
        it('should return original function', function () {
            var result = signet.sign('number, number => number', add);
            
            assert.equal(result, add);
        });
        
        it('should be signed', function () {
            assert.equal(signet.sign.signature, 'string, function => function');
        });
        
    });    
    
});