"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var CACHE = {};

function fneval(obj, key) {
    try {
        return eval("this." + key);
    } catch (err) {
        return undefined;
    }
}

function cacheeval(obj, key) {
    if (!CACHE[key]) {
        var rkey = key.replace(/'/g, "\\'");
        var rx = /^[a-zA-Z$_@]/;
        var fn = eval("(function(){\n            let rx = /^[a-zA-Z$_]/;\n            return '" + rkey + "'.startsWith('this.') || '" + rkey + "'=='this' || !rx.test('" + rkey + "')?\n                function() {\n                    let r = undefined;\n                    try {r=" + key + ";}\n                    catch(err){}\n                    return r;\n                } :\n                function() {\n                    let r = undefined;\n                    try {r=this." + (rx.test(key) ? key : '$___$') + ";}\n                    catch(err){try{r=" + key + ";}catch(err){}}\n                    return r;\n                }\n        })()");
        CACHE[key] = fn;
    }
    return CACHE[key].call(obj);
}

var EVALS = {
    eval: function _eval(obj, key) {
        var v = fneval.call(obj, obj, key);
        return v === undefined ? "" : v;
    },
    iteval: function iteval(obj, key) {
        var arr = key.split(".");
        arr.forEach(function (key) {
            if (obj == null || obj == undefined) return;else obj = obj[key];
        });

        var v = obj || undefined;
        return v === undefined ? "" : v;
    },
    ceval: function ceval(obj, key) {
        var v = cacheeval(obj, key);
        return v === undefined ? "" : v;
    },
    valwalk: function valwalk(src, ops, path) {
        if (!src) return src;
        for (var k in src) {
            var newpath = "" + path + (path ? '.' : '') + k;
            var rop = ops[newpath];
            if (rop !== undefined) src[k] = rop;else if (_typeof(src[k]) == "object") EVALS.valwalk(src[k], ops, newpath);
        };
        return src;
    }
};

module.exports = EVALS;
//# sourceMappingURL=evals.js.map
