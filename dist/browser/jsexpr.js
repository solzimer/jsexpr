"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
				}var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
					var n = e[i][1][r];return o(n || r);
				}, p, p.exports, r, e, n, t);
			}return n[i].exports;
		}for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
			o(t[i]);
		}return o;
	}return r;
})()({ 1: [function (require, module, exports) {
		"use strict";

		(function () {
			var root = this;
			var previous_jsexpr = root.jsexpr;
			var jsexpr = require('./index.js');

			if (typeof exports !== 'undefined') {
				if (typeof module !== 'undefined' && module.exports) {
					exports = module.exports = jsexpr;
				}
				exports.jsexpr = jsexpr;
			}

			if (typeof window !== 'undefined') {
				window.jsexpr = jsexpr;
			}
		}).call(this);
	}, { "./index.js": 2 }], 2: [function (require, module, exports) {
		/*jshint esversion: 6 */

		var expr = require('./lib/expression');

		module.exports = expr;
	}, { "./lib/expression": 3 }], 3: [function (require, module, exports) {
		var extend = require("extend");
		var RX = /\$\{[^\}]+\}/g;

		function _val(obj, key) {
			var arr = key.split(".");
			arr.forEach(function (key) {
				if (obj == null || obj == undefined) return;else obj = obj[key];
			});

			return obj || undefined;
		}

		function val(obj, key) {
			var v = _val(obj, key);
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
			expr: function expr(input) {
				if ((typeof input === "undefined" ? "undefined" : _typeof(input)) == "object") return jsontokens(input);else return tokens(input);
			}
		};
	}, { "extend": 4 }], 4: [function (require, module, exports) {
		'use strict';

		var hasOwn = Object.prototype.hasOwnProperty;
		var toStr = Object.prototype.toString;

		var isArray = function isArray(arr) {
			if (typeof Array.isArray === 'function') {
				return Array.isArray(arr);
			}

			return toStr.call(arr) === '[object Array]';
		};

		var isPlainObject = function isPlainObject(obj) {
			if (!obj || toStr.call(obj) !== '[object Object]') {
				return false;
			}

			var hasOwnConstructor = hasOwn.call(obj, 'constructor');
			var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
			// Not own constructor property must be Object
			if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
				return false;
			}

			// Own properties are enumerated firstly, so to speed up,
			// if last one is own, then all properties are own.
			var key;
			for (key in obj) {/**/}

			return typeof key === 'undefined' || hasOwn.call(obj, key);
		};

		module.exports = function extend() {
			var options, name, src, copy, copyIsArray, clone;
			var target = arguments[0];
			var i = 1;
			var length = arguments.length;
			var deep = false;

			// Handle a deep copy situation
			if (typeof target === 'boolean') {
				deep = target;
				target = arguments[1] || {};
				// skip the boolean and the target
				i = 2;
			}
			if (target == null || (typeof target === "undefined" ? "undefined" : _typeof(target)) !== 'object' && typeof target !== 'function') {
				target = {};
			}

			for (; i < length; ++i) {
				options = arguments[i];
				// Only deal with non-null/undefined values
				if (options != null) {
					// Extend the base object
					for (name in options) {
						src = target[name];
						copy = options[name];

						// Prevent never-ending loop
						if (target !== copy) {
							// Recurse if we're merging plain objects or arrays
							if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
								if (copyIsArray) {
									copyIsArray = false;
									clone = src && isArray(src) ? src : [];
								} else {
									clone = src && isPlainObject(src) ? src : {};
								}

								// Never move original objects, clone them
								target[name] = extend(deep, clone, copy);

								// Don't bring in undefined values
							} else if (typeof copy !== 'undefined') {
								target[name] = copy;
							}
						}
					}
				}
			}

			// Return the modified object
			return target;
		};
	}, {}] }, {}, [1]);
//# sourceMappingURL=jsexpr.js.map
