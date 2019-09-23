"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var extend = require("extend");

function instance(token) {
	var RX = new RegExp("\\" + token + "\\{[^\\}]+\\}", 'g'); // /\$\{[^\}]+\}/g;
	var RX_RPL_PARSE = new RegExp("\\" + token + "\\{([^\\}]+)\\}"); // /\$\{([^\}]+)\}/;
	var RX_RPL_TOKEN = new RegExp("\\" + token + "\\{|\\}"); // /\$\{|\}/g;
	var CACHE = {};

	function cacheeval(obj, key) {
		if (!CACHE[key]) {
			var fn = eval("(function(){\n\t\t\t\treturn function() {\n\t\t\t\t\ttry {\n\t\t\t\t\t\treturn this." + key + ";\n\t\t\t\t\t}catch(err) {\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\treturn " + key + ";\n\t\t\t\t\t\t}catch(err) {\n\t\t\t\t\t\t\treturn undefined;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t})()");
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

	function fnassign(path) {
		return eval("(function(){\n\t\t\treturn function(obj,val) {\n\t\t\t\ttry {\n\t\t\t\t\treturn obj." + path + " = val;\n\t\t\t\t}catch(err) {}\n\t\t\t}\n\t\t})()");
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
				var key = token.replace(RX_RPL_PARSE, "$1").trim();
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
		list = list.filter(function (l) {
			return l != "";
		});
		len = list.length;

		if (len > 1) {
			return function (entry) {
				var ret = "";
				for (var i = 0; i < len; i++) {
					var t = list[i];
					ret += typeof t == "string" ? t : t(entry);
				}
				return ret;
			};
		} else {
			return function (entry) {
				var t = list[0];
				return typeof t == "string" ? t : t(entry);
			};
		}
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

	function exprfn(input, replace) {
		if (typeof input == 'number') {
			return function (obj) {
				return input;
			};
		} else if ((typeof input === "undefined" ? "undefined" : _typeof(input)) == "object") {
			return jsontokens(input, replace);
		} else {
			return tokens(input);
		}
	}

	return {
		fn: parse,
		eval: parse,
		assign: fnassign,
		expr: exprfn,
		expression: exprfn
	};
}

module.exports = instance;
//# sourceMappingURL=expression.js.map
