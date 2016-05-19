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
        
        it('should nest with aliasing', function () {
            signet.alias('R2Point', 'tuple<number;number>');
            signet.alias('R2Matrix', 'tuple<R2Point;R2Point>');
            
            assert.equal(signet.isTypeOf('R2Matrix')([[1, 2], [3, 4]]), true);
        });
        
        it('should nest without aliasing', function () {
            assert.equal(signet.isTypeOf('tuple<tuple<number;number>;tuple<number;number>>')([[1, 2], [3, 4]]), true);
        });
        
    });
    
    describe('boundedString', function () {
        
        it('should return true on acceptable-length string', function () {
            assert.equal(signet.isTypeOf('boundedString<5;10>')('Hello!'), true);
        });
        
        it('should return false on string length out of bounds', function () {
            assert.equal(signet.isTypeOf('boundedString<5;10>')('foo'), false);
        });
        
        it('should accept the string if it is greater than lower bound and upper bound is not defined', function () {
            assert.equal(signet.isTypeOf('boundedString<3>')('Acceptable string'), true);
        });
        
    });
    
    describe('formattedString', function () {
        
        it('should return true on acceptably formatted string', function () {
            assert.equal(signet.isTypeOf('formattedString<\\\-+>')('my-test-string'), true);
        });
        
        it('should return false on unacceptably formatted string', function () {
            assert.equal(signet.isTypeOf('formattedString<\\\-+>')('my test string'), false);
        });
        
        it('should return true on correctly formatted social security number', function () {
            assert.equal(signet.isTypeOf('formattedString<[0-9]{3}-[0-9]{2}-[0-9]{4}>')('123-45-6789'), true);
        });
        
    });
    
    describe('taggedUnion', function () {
        
        it('should verify values correctly on types', function () {
            var isStringOrInt = signet.isTypeOf('taggedUnion<int;string>');
            
            assert.equal(isStringOrInt('foo'), true);
            assert.equal(isStringOrInt(5), true);
            assert.equal(isStringOrInt(0.7), false);
        });
        
    });
    
});