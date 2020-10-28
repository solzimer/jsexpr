"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var extend = require("extend"),
    Mingo = require("mingo");

function instance(token) {
	var RX = new RegExp("\\" + token + "\\{[^\\}]+\\}", 'g'); // /\$\{[^\}]+\}/g;
	var RX_RPL_PARSE = new RegExp("\\" + token + "\\{([^\\}]+)\\}"); // /\$\{([^\}]+)\}/;
	var RX_RPL_TOKEN = new RegExp("\\" + token + "\\{|\\}", 'g'); // /\$\{|\}/g;
	var RX_JSON_TOKEN = new RegExp("^\\" + token + "\\{JSON(:(\\d+|([^:]+(:(\\d+))?)))?\\}$");
	var CACHE = {};

	function cacheeval(obj, key) {
		if (!CACHE[key]) {
			var rkey = key.replace(/'/g, "\\'");
			var rx = /^[a-zA-Z$_@]/;
			var fn = eval("(function(){\n\t\t\t\tlet rx = /^[a-zA-Z$_]/;\n\t\t\t\treturn '" + rkey + "'.startsWith('this.') || '" + rkey + "'=='this' || !rx.test('" + rkey + "')?\n\t\t\t\t\tfunction() {\n\t\t\t\t\t\tlet r = undefined;\n\t\t\t\t\t\ttry {r=" + key + ";}\n\t\t\t\t\t\tcatch(err){}\n\t\t\t\t\t\treturn r;\n\t\t\t\t\t} :\n\t\t\t\t\tfunction() {\n\t\t\t\t\t\tlet r = undefined;\n\t\t\t\t\t\ttry {r=this." + (rx.test(key) ? key : '$___$') + ";}\n\t\t\t\t\t\tcatch(err){try{r=" + key + ";}catch(err){}}\n\t\t\t\t\t\treturn r;\n\t\t\t\t\t}\n\t\t\t})()");
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
				var key = token.replace(RX_RPL_PARSE, "$1").trim().replace(/'/g, "\\'");
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

		// JSON stringify
		if (RX_JSON_TOKEN.test(expr)) {
			var parts = expr.replace(RX_RPL_TOKEN, "").split(":");
			var nexpr = parts[1];
			var spaces = parts[2];
			if (parts.length == 2) {
				if (isNaN(nexpr)) {
					spaces = 2;
				} else {
					nexpr = 'this';spaces = parts[1];
				}
			} else if (parts.length == 1) {
				nexpr = 'this';
				spaces = 2;
			}
			spaces = parseInt(spaces);
			var fnxpr = tokens("${" + nexpr + "}");
			return function (entry) {
				return JSON.stringify(fnxpr(entry), null, spaces);
			};
		}

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

	function mingotokens(json) {
		var xpr = Array.isArray(json.$) ? json.$ : [json.$];
		var aggr = new Mingo.Aggregator(xpr);
		return function (input) {
			var isArray = Array.isArray(input);
			var res = aggr.run(isArray ? input : [input]);
			if (!isArray && res.length <= 1) return res[0];else return res;
		};
	}

	function exprfn(input, replace) {
		if (typeof input == 'number') {
			return function (obj) {
				return input;
			};
		} else if ((typeof input === "undefined" ? "undefined" : _typeof(input)) == "object") {
			var ninput = extend({}, input);
			delete ninput['$'];

			var prfn = input["$"] ? mingotokens(input, replace) : function () {
				return input;
			};
			var nxfn = Object.keys(ninput).length ? jsontokens(ninput, replace) : function (input) {
				return input;
			};

			return function (obj) {
				var prres = prfn(obj);
				var nxres = nxfn(prres);
				if (typeof nxres._ !== 'undefined' && Object.keys(nxres).length == 1) return nxres._;else return nxres;
			};
		} else {
			return tokens(input);
		}
	}

	function traverse(object, callback) {
		for (var key in object) {
			object[key] = callback(object, key, object[key]);
		}

		for (var _key in object) {
			if (_typeof(object[_key]) == 'object') {
				traverse(object[_key], callback);
			}
		}
	}

	return {
		fn: parse,
		eval: parse,
		assign: fnassign,
		expr: exprfn,
		expression: exprfn,
		traverse: traverse
	};
}

module.exports = instance;
//# sourceMappingURL=expression.js.map
