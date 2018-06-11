"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var extend = require("extend");
var RX = /\$\{[^\}]+\}/g;

function _val(obj, key) {
	try {
		return eval("this." + key);
	} catch (err) {
		return undefined;
	}
}

function val(obj, key) {
	var v = _val.call(obj, obj, key);
	return v === undefined ? "" : v;
}

function valwalk(src, ops, path) {
	if (!src) return src;
	Object.keys(src).forEach(function (k) {
		var newpath = "" + path + (path ? '.' : '') + k;
		if (ops[newpath]) src[k] = ops[newpath];
		if (_typeof(src[k]) == "object") valwalk(src[k], ops, newpath);
	});
	return src;
}

function parse(expr) {
	var m = expr.match(RX);
	if (m) {
		m.forEach(function (token) {
			var key = token.replace(/[\$\{\}]/g, "").trim();
			expr = expr.replace(token, "__val(entry,'" + key + "')");
		});
	}
	var fn = new Function("entry", "__val", "return (" + expr + ")");

	return function (entry) {
		return fn(entry, val);
	};
}

function tokens(expr) {
	if (expr == "${JSON}") return function (entry) {
		return JSON.stringify(entry, null, 2);
	};

	var list = [];
	var m = expr.match(RX) || [];
	m.forEach(function (token) {
		var idx = expr.indexOf(token);
		var t = expr.substring(0, idx);
		expr = expr.substring(idx + token.length);
		list.push(t);
		list.push(function (entry) {
			return val(entry, token.replace(/\$|\{|\}/g, ""));
		});
	});
	list.push(expr);

	return function (entry) {
		return list.map(function (t) {
			return typeof t == "string" ? t : t(entry);
		}).join("");
	};
}

function jsontokens(json) {
	var ops = [];

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

	return function (entry) {
		var map = ops.map(function (op) {
			return { path: op.path, value: op.fn(entry) };
		}).reduce(function (map, op) {
			map[op.path] = op.value;
			return map;
		}, {});

		return valwalk(extend(true, {}, json), map, "");
	};
}

module.exports = {
	fn: parse,
	eval: parse,
	expr: function expr(input) {
		if ((typeof input === "undefined" ? "undefined" : _typeof(input)) == "object") return jsontokens(input);else return tokens(input);
	}
};
//# sourceMappingURL=expression.js.map
