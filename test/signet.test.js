var assert = require('chai').assert;
var signet = require('../src/signet');

describe('signet', function () {

    describe('sign', function () {
        var add;
        
        beforeEach(function () {
            add = function add (a, b){
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
        
        it('should return original function', function () {
            var result = signet.sign('number, number => number', add);
            
            assert.equal(result, add);
        });
        
    });    
    
});