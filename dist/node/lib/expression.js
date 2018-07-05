"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var extend = require("extend");
var RX = /\$\{[^\}]+\}/g;
var RX_RPL_PARSE = /[\$\{\}]/g;
var RX_RPL_TOKEN = /\$|\{|\}/g;

var CACHE = {};

function cacheeval(obj, key) {
	if (!CACHE[key]) {
		var fn = eval("(function(){\n\t\t\treturn function() {\n\t\t\t\ttry {\n\t\t\t\t\treturn this." + key + ";\n\t\t\t\t}catch(err) {\n\t\t\t\t\treturn undefined;\n\t\t\t\t}\n\t\t\t}\n\t\t})()");
		CACHE[key] = fn;
	}
	return CACHE[key].call(obj);
}

function fneval(obj, key) {
	try {
		return eval("this." + key);
	} catch (err) {
		return undefined;
	}
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

function parse(expr, method) {
	method = method || "ceval";
	var m = expr.match(RX);
	if (m) {
		m.forEach(function (token) {
			var key = token.replace(RX_RPL_PARSE, "").trim();
			expr = expr.replace(token, "__val(entry,'" + key + "')");
		});
	}
	var fn = new Function("entry", "__val", "return (" + expr + ")");

	return function (entry) {
		return fn(entry, EVALS[method]);
	};
}

function tokens(expr, method) {
	method = EVALS[method || "ceval"];
	if (expr == "${JSON}") return function (entry) {
		return JSON.stringify(entry, null, 2);
	};

	var list = [],
	    len = 0;
	var m = expr.match(RX) || [];
	m.forEach(function (token) {
		var idx = expr.indexOf(token);
		var t = expr.substring(0, idx);
		var rtoken = token.replace(RX_RPL_TOKEN, "");
		expr = expr.substring(idx + token.length);
		list.push(t);
		list.push(function (entry) {
			return method(entry, rtoken);
		});
	});
	list.push(expr);
	len = list.length;

	return function (entry) {
		var ret = "";
		for (var i = 0; i < len; i++) {
			var t = list[i];
			ret += typeof t == "string" ? t : t(entry);
		}
		return ret;
	};
}

function jsontokens(json) {
	var ops = [],
	    len = 0;

	function walk(json, path) {
		if (!json) return;
		Object.keys(json).forEach(function (k) {
			var newpath = "" + path + (path ? '.' : '') + k;
			var t = json[k];
			if (typeof t == "string") {
				ops.push({ path: newpath, fn: tokens(t) });
			} else {
				walk(t, newpath);
			}
		});
	}

	walk(json, "");
	len = ops.length;

	return function (entry) {
		var map = {};
		for (var i = 0; i < len; i++) {
			var op = ops[i];
			map[op.path] = op.fn(entry);
		}
		return EVALS.valwalk(extend(true, {}, json), map, "");
	};
}

module.exports = {
	fn: parse,
	eval: parse,
	expr: function expr(input, replace) {
		if ((typeof input === "undefined" ? "undefined" : _typeof(input)) == "object") {
			return jsontokens(input, replace);
		} else {
			return tokens(input);
		}
	}
};
//# sourceMappingURL=expression.js.map
