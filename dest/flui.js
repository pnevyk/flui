/* flui v0.1.0 by Petr Nevyhoštěný - https://github.com/nevyk/flui (MIT licensed) */
!function(){"use strict";function t(t){return"string"==typeof t}function n(t){return t instanceof Array}function r(t){return"function"==typeof t}function i(t){return"undefined"!=typeof t}function e(t){return Object.keys(t)}function o(t,n){var r,i,o,u,s="function"==typeof t?"prototype":"__proto__";for(r=t[s],t[s]=new n,i=0,u=e(r),o=u.length;o>i;i++)t[s][u[i]]=r[u[i]];return t}function u(){var t=[];this._listeners=function(n){return void 0===t[n]&&(t[n]=[]),t[n]}}function s(t){if(i(t)&&!n(t))throw"actions must be an array";this._actions=t||[],this._running=!1,this._errorHandler=function(){}}u.prototype.on=function(i,e){var o,u;if(n(i))for(o=0,u=i.length;u>o;o++)this.on(i[o],e);if(!t(i))throw"event must be a string";if(!r(e))throw"callback must be a function";return this._listeners(i).push(e),this},u.prototype.trigger=function(r){var i,e,o,u=Array.prototype.slice.call(arguments,0);if(u.shift(),n(r))for(i=0,e=r.length;e>i;i++)o=u.slice(0),o.unshift(r[i]),this.trigger.apply(o);if(!t(r))throw"event must be a string";var s=this._listeners(r);for(i=0,e=s.length;e>i;i++)s[i].apply(null,u);return this},u.prototype.then=function(n){if(!t(n))throw"event must be a string";var r=this;return function(){r.trigger(n,Array.prototype.slice.call(arguments,0))}},s.prototype.add=function(t){return n(t)||(t=[t]),Array.prototype.push.apply(this._actions,t),this},s.prototype.next=function(){if(this._actions.length>0&&this._running){var t=this._actions.shift();if(!r(t))throw"action must be a function";try{t.apply(t,arguments)}catch(n){this.raiseError(n)}}return this},s.prototype.run=function(){return this._running=!0,this.next.apply(this,arguments),this},s.prototype.stop=function(){return this._running=!1,this},s.prototype.wait=function(){var t=this;return function(){t.next.apply(t,arguments)}},s.prototype.error=function(t){if(!r(t))throw"callback must be a function";return this._errorHandler=t,this},s.prototype.raiseError=function(){return this._running=!1,this._errorHandler.apply(this,arguments),this};var a={context:function(){return new u},eventable:function(t){return o(t,u)},queue:function(t){return new s(t)}};"undefined"!=typeof window?window.flui=a:module.exports=a}();