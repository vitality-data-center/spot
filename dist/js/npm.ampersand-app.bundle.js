(window.webpackJsonp=window.webpackJsonp||[]).push([["npm.ampersand-app"],{fcbc:function(module,exports,__webpack_require__){eval('/*$AMPERSAND_VERSION*/\nvar Events = __webpack_require__(/*! ampersand-events */ "13c2");\nvar toArray = __webpack_require__(/*! lodash/toArray */ "ffaf");\nvar extend = __webpack_require__(/*! lodash/assign */ "5ad5");\n\n\n// instance app, can be used just by itself\n// or by calling as function to pass labels\n// by attaching all instances to this, we can\n// avoid globals\nvar app = {\n    extend: function () {\n        var args = toArray(arguments);\n        args.unshift(this);\n        return extend.apply(null, args);\n    },\n    reset: function () {\n        // clear all events\n        this.off();\n        // remove all but main two methods\n        for (var item in this) {\n            if (item !== \'extend\' && item !== \'reset\') {\n                delete this[item];\n            }\n        }\n        // remix events\n        Events.createEmitter(this);\n    }\n};\n\nEvents.createEmitter(app);\n\n// export our singleton\nmodule.exports = app;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmNiYy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9hbXBlcnNhbmQtYXBwL2FtcGVyc2FuZC1hcHAuanM/ZWU2NSJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiRBTVBFUlNBTkRfVkVSU0lPTiovXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnYW1wZXJzYW5kLWV2ZW50cycpO1xudmFyIHRvQXJyYXkgPSByZXF1aXJlKCdsb2Rhc2gvdG9BcnJheScpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2xvZGFzaC9hc3NpZ24nKTtcblxuXG4vLyBpbnN0YW5jZSBhcHAsIGNhbiBiZSB1c2VkIGp1c3QgYnkgaXRzZWxmXG4vLyBvciBieSBjYWxsaW5nIGFzIGZ1bmN0aW9uIHRvIHBhc3MgbGFiZWxzXG4vLyBieSBhdHRhY2hpbmcgYWxsIGluc3RhbmNlcyB0byB0aGlzLCB3ZSBjYW5cbi8vIGF2b2lkIGdsb2JhbHNcbnZhciBhcHAgPSB7XG4gICAgZXh0ZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgICAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgICAgIHJldHVybiBleHRlbmQuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSxcbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBjbGVhciBhbGwgZXZlbnRzXG4gICAgICAgIHRoaXMub2ZmKCk7XG4gICAgICAgIC8vIHJlbW92ZSBhbGwgYnV0IG1haW4gdHdvIG1ldGhvZHNcbiAgICAgICAgZm9yICh2YXIgaXRlbSBpbiB0aGlzKSB7XG4gICAgICAgICAgICBpZiAoaXRlbSAhPT0gJ2V4dGVuZCcgJiYgaXRlbSAhPT0gJ3Jlc2V0Jykge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2l0ZW1dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlbWl4IGV2ZW50c1xuICAgICAgICBFdmVudHMuY3JlYXRlRW1pdHRlcih0aGlzKTtcbiAgICB9XG59O1xuXG5FdmVudHMuY3JlYXRlRW1pdHRlcihhcHApO1xuXG4vLyBleHBvcnQgb3VyIHNpbmdsZXRvblxubW9kdWxlLmV4cG9ydHMgPSBhcHA7XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///fcbc\n')}}]);