var expect = require('expect.js');
var flui = require('../index');

describe('flui', function () {
    var context;
    
    beforeEach(function () {
        context = flui.context();
    });
    
    describe('- on and trigger', function () {
        it('should "trigger" all callbacks attached using "on"', function () {
            var counter = 0;
            
            context.on('event', function () {
                counter++;
            });
            
            context.on('event', function () {
                counter++;
            });
            
            context.trigger('event');
            
            expect(counter).to.be(2);
        });
        
        it('should trigger callbacks in required order', function (done) {
            var log = '';
            var sw = false;
            
            process.nextTick(function () {
                context.trigger('1');
            });
            
            context.on('4', function () {
                log += '4';
                expect(log).to.be('123234');
                done();
            });
            
            context.on('3', function () {
                log += '3';
                
                if (sw) {
                    context.trigger('4');
                }
                
                else {
                    sw = !sw;
                    context.trigger('2');
                }
            });
            
            context.on('1', function () {
                log += '1';
                context.trigger('2');
            });
            
            context.on('2', function () {
                log += '2';
                context.trigger('3');
            });
        });
        
        it('should pass arguments given in trigger into callback', function () {
            context.on('single', function (arg) {
                expect(arg).to.be('foo');
            });
            
            context.on('multi', function (arg1, arg2) {
                expect(arg1).to.be('foo');
                expect(arg2).to.be('bar');
            });
            
            context.trigger('single', 'foo');
            context.trigger('multi', 'foo', 'bar');
        });
    });
    
    describe('- then', function () {
        it('should attach callback on given event', function (done) {
            context.on('step', context.then('event'));
            
            context.on('event', function () {
                done();
            });
            
            context.trigger('step');
        });
    });
});