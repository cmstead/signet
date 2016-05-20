var assert = require('chai').assert;
var signet = require('../src/signet');

describe('performance - no assertions here', function () {

    var functionFactory;

    beforeEach(function () {
        functionFactory = function () {
            return function (a) {
                return function (b) {
                    return a + b;
                }
            }
        }
    });

    it('should measure performance of signing a function', function () {
        var start = Date.now();
        var tempFn;

        for (var i = 0; i < 1000; i++) {
            signet.sign('number => number => number', functionFactory());
        }
        var totalTime = Date.now() - start;
        console.log("\t\tAverage signing time over 1000 executions: " + totalTime + ' microseconds');
    });

    it('should measure performance of enforcing a function', function () {
        var start = Date.now();
        var tempFn;

        for (var i = 0; i < 1000; i++) {
            signet.enforce('number => number => number', functionFactory());
        }
        var totalTime = Date.now() - start;
        console.log("\t\tAverage enforcement time over 1000 executions: " + totalTime + ' microseconds');
    });

    it('should measure performance of verifying a function at call time', function () {
        var testFunctions = [];
        var i = 0;
        for (i = 0; i < 1000; i++) {
            testFunctions.push(signet.enforce('number => number => number', functionFactory()));
        }

        var start = Date.now();
        var tempFn;

        for (i = 0; i < testFunctions.length; i++) {
            testFunctions[i](5);
        }

        var totalTime = Date.now() - start;
        console.log("\t\tAverage verification time over 1000 executions: " + totalTime + ' microseconds');
    });

});