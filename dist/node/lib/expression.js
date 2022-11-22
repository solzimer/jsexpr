'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var EVALS = require('./evals.js'),
    extend = require("extend"),
    dayjs = require('dayjs'),
    Mingo = require("mingo");

function instance(token) {
	var RX = new RegExp('\\' + token + '\\{[^\\}]+\\}', 'g');
	var RX_RPL_PARSE = new RegExp('\\' + token + '\\{([^\\}]+)\\}');
	var RX_RPL_TOKEN = new RegExp('\\' + token + '\\{|\\}', 'g');
	var RX_FILTER = new RegExp('^[A-Z_]+\\:');

	var FILTERS = {
		JSON: function (_JSON) {
			function JSON(_x) {
				return _JSON.apply(this, arguments);
			}

			JSON.toString = function () {
				return _JSON.toString();
			};

			return JSON;
		}(function (args) {
			var nexpr = args[1];
			var spaces = args[2];
			if (args.length == 2) {
				if (isNaN(nexpr)) {
					spaces = 2;
				} else {
					nexpr = 'this';spaces = args[1];
				}
			} else if (args.length == 1) {
				nexpr = 'this';
				spaces = 2;
			}
			spaces = parseInt(spaces);
			var fnxpr = tokens("${" + nexpr + "}");
			return function (entry) {
				return JSON.stringify(fnxpr(entry), null, spaces);
			};
		}),
		DATE: function DATE(args) {
			args.shift();
			var nexpr = tokens("${" + args.shift() + "}");
			var format = args.join(":").split('|');
			return function (entry) {
				var res = nexpr(entry);
				var dt = dayjs(res, format[0]);
				if (format[1]) {
					return dt.format(format[1]);
				} else {
					return dt.toDate();
				}
			};
		},
		SUBSTR: function SUBSTR(args) {
			args.shift();
			var nexpr = tokens("${" + args.shift() + "}");
			var format = args.join(":").split('|');
			var start = parseInt(format[0]);
			var end = parseInt(format[1]);
			if (isNaN(start)) start = 0;
			if (isNaN(end)) end = undefined;
			return function (entry) {
				var res = nexpr(entry);
				return _typeof(res == 'string') ? res.substring(start, end) : res;
			};
		}
	};

	function fnassign(path) {
		var npath = path.split('.').map(function (t, i) {
			return "['" + t + "']";
		}).join('');

		var fn = '(function(path){\n\t\t\treturn function(obj,val) {\n\t\t\t\ttry {\n\t\t\t\t\t// Ensure path\n\t\t\t\t\tlet root = obj;\n\t\t\t\t\tlet kpath = path.split(\'.\');\n\t\t\t\t\tfor(let i=0; i<kpath.length;i++) {\n\t\t\t\t\t\tlet k = kpath[i];\n\t\t\t\t\t\tif(!root[k]) root[k] = {};\n\t\t\t\t\t\troot = root[k];\n\t\t\t\t\t}\n\t\n\t\t\t\t\treturn obj' + npath + ' = val;\n\t\t\t\t}catch(err) {}\n\t\t\t}\n\t\t})(\'' + path + '\')';

		console.log(fn);
		return eval(fn);
	}

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

		var list = [],
		    len = 0;
		var m = expr.match(RX) || [];
		m.forEach(function (token) {
			var idx = expr.indexOf(token);
			var t = expr.substring(0, idx);
			var rtoken = token.replace(RX_RPL_TOKEN, "");
			expr = expr.substring(idx + token.length);
			list.push(t);

			// Filter
			if (RX_FILTER.test(rtoken)) {
				var args = rtoken.split(":");
				var fn = FILTERS[args[0]](args);
				list.push(fn);
			}
			// Evaluator
			else {
					list.push(function (entry) {
						return method(entry, rtoken);
					});
				}
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
				if (typeof t == 'undefined') return undefined;
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
				var newpath = '' + path + (path ? '.' : '') + k;
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
		} else if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) == "object") {
			var ninput = extend({}, input);
			delete ninput['$'];

			var prfn = input["$"] ? mingotokens(input, replace) : function (input) {
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

	function filter(name, fncallback) {
		FILTERS[name] = fncallback;
	}

	return {
		fn: parse,
		eval: parse,
		assign: fnassign,
		expr: exprfn,
		expression: exprfn,
		traverse: traverse,
		filter: filter
	};
}

module.exports = instance;
//# sourceMappingURL=expression.js.map
