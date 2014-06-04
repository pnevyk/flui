/**
 * @library flui
 * @author Petr Nevyhoštěný
 * @version 0.1.0
 * @license https://github.com/nevyk/flui/blob/master/LICENSE MIT License
 * @description Flow control library which uses event or queue approach to avoid callback hell
 */

(function () {
    'use strict';
    
    function isString(value) {
        return typeof value === 'string';
    }
    
    function isArray(value) {
        return value instanceof Array;
    }
    
    function isFunction(value) {
        return typeof value === 'function';
    }
    
    function isDefined(value) {
        return typeof value !== 'undefined';
    }
    
    function getKeys(obj) {
        //TODO: write fallback for IE < 9
        return Object.keys(obj);
    }
    
    function extend(toExtend, base) {
        var property = typeof toExtend === 'function' ? 'prototype' : '__proto__';
        var proto, i, len, keys;

        proto = toExtend[property];
        toExtend[property] = new base();

        for (i = 0, keys = getKeys(proto), len = keys.length; i < len; i++) {
            toExtend[property][keys[i]] = proto[keys[i]];
        }

        return toExtend;
    }
    
    // === Context ===
    // event approach
    
    function FluiContext() {
        var events = [];
        
        this._listeners = function (event) {
            if (events[event] === undefined) {
                events[event] = [];
            }

            return events[event];
        }
    };
    
    FluiContext.prototype.on = function (event, callback) {
        var i, len;
        
        if (isArray(event)) {
            for (i = 0, len = event.length; i < len; i++) {
                this.on(event[i], callback);
            }
        }
        
        if (!isString(event)) throw 'event must be a string';
        if (!isFunction(callback)) throw 'callback must be a function';
        
        this._listeners(event).push(callback);
        
        return this;
    };
    
    FluiContext.prototype.trigger = function (event) {
        var i, len, eventlessArgs;
        var args = Array.prototype.slice.call(arguments, 0);
        args.shift();
        
        if (isArray(event)) {
            for (i = 0, len = event.length; i < len; i++) {
                eventlessArgs = args.slice(0);
                eventlessArgs.unshift(event[i]);
                this.trigger.apply(eventlessArgs);
            }
        }
        
        if (!isString(event)) throw 'event must be a string';
        
        var listeners = this._listeners(event);
        
        for (i = 0, len = listeners.length; i < len; i++) {
            listeners[i].apply(null, args);
        }
        
        return this;
    }

    FluiContext.prototype.then = function (event) {
        if (!isString(event)) throw 'event must be a string';
        
        var self = this;
        
        return function () {
            self.trigger(event, Array.prototype.slice.call(arguments, 0));
        };
    }
    
    // === Queue ===
    // queue approach
    
    function FluiQueue(actions) {
        if (isDefined(actions) && !isArray(actions)) throw 'actions must be an array';
        
        this._actions = actions || [];
        this._running = false;
        this._errorHandler = function () {};
    }
    
    FluiQueue.prototype.add = function (actions) {
        if (!isArray(actions)) actions = [actions];
        
        Array.prototype.push.apply(this._actions, actions);
        
        return this;
    };
    
    FluiQueue.prototype.next = function () {
        if (this._actions.length > 0 && this._running) {
            var action = this._actions.shift();
            
            if (!isFunction(action)) throw 'action must be a function';
            
            try {
                action.apply(action, arguments);
            }
            
            catch (e) {
                this.raiseError(e);
            }
        }
        
        return this;
    };
    
    FluiQueue.prototype.run = function () {
        this._running = true;
        this.next.apply(this, arguments);
        return this;
    };
    
    FluiQueue.prototype.stop = function () {
        this._running = false;
        return this;
    };
    
    FluiQueue.prototype.wait = function () {
        var self = this;
        
        return function () {
            self.next.apply(self, arguments);
        };
    };
    
    FluiQueue.prototype.error = function (callback) {
        if (!isFunction(callback)) throw 'callback must be a function';
        this._errorHandler = callback;
        return this;
    };
    
    FluiQueue.prototype.raiseError = function () {
        this._running = false;
        this._errorHandler.apply(this, arguments);
        return this;
    };

    var flui = {
        context : function () {
            return new FluiContext();
        },
        eventable : function (toExtend) {
            return extend(toExtend, FluiContext);
        },
        queue : function (actions) {
            return new FluiQueue(actions);
        }
    };
    
    if (typeof window !== 'undefined') {
        window.flui = flui;
    }

    else {
        module.exports = flui;
    }
})();