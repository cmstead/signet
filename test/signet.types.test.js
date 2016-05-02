var assert = require('chai').assert;
var signet = require('../src/signet.types');

describe('extension types', function () {
    
    describe('int', function () {
        
        it('should correctly validate an integer', function () {
            assert.equal(signet.isTypeOf('int')(10), true);
        });
        
        it('should correctly throw an error on a non-integer', function () {
            assert.equal(signet.isTypeOf('int')('foo'), false);
        });
        
    });
    
    describe('bounded', function () {
        
        it('should correctly validate a bounded number type', function () {
            assert.equal(signet.isTypeOf('bounded<0;1>')(0.5), true);
        });
        
        it('should correctly validate a bounded number type where number is at lower bound', function () {
            assert.equal(signet.isTypeOf('bounded<0;1>')(0), true);
        });
        
        it('should correctly validate a bounded number type where number is at upper bound', function () {
            assert.equal(signet.isTypeOf('bounded<0;1>')(1), true);
        });
        
        it('should return false on out of bound value', function () {
            assert.equal(signet.isTypeOf('bounded<1;2>')(7), false);
        });
        
        it('should return false on invalid type value', function () {
            assert.equal(signet.isTypeOf('bounded<1;2>')('foo'), false);
        });
        
    });
    
    describe('boundedInt', function () {
        
        it('should correctly validate a bounded int type', function () {
            assert.equal(signet.isTypeOf('boundedInt<0;1>')(1), true);
        });
        
        it('should correctly return false on invalid number', function () {
            assert.equal(signet.isTypeOf('boundedInt<0;1>')(0.5), false);
        });
        
        it('should return false on out of bound value', function () {
            assert.equal(signet.isTypeOf('boundedInt<1;2>')(7), false);
        });
        
        it('should return false on invalid type value', function () {
            assert.equal(signet.isTypeOf('boundedInt<1;2>')('foo'), false);
        });
        
    });
    
    describe('tuple', function () {
        
        it('should return true on valid tuple', function () {
            assert.equal(signet.isTypeOf('tuple<number;string;object>')([1, 'foo', {}]), true);
        });
        
        it('should return false when tuple is wrong length', function () {
            assert.equal(signet.isTypeOf('tuple<number;number>')([1, 2, 3]), false);
        });
        
        it('should return false when tuple contains wrong type', function () {
            assert.equal(signet.isTypeOf('tuple<number;number>')([1, 'foo']), false);
        });
        
    });
    
});