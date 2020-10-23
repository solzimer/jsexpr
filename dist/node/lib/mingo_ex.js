'use strict';

var mingo = require('mingo'),
    jsexpr = require('./expression')('$');

var EV_CACHE = {};
var EX_CACHE = {};

mingo.addOperators(mingo.OP_QUERY, function (_) {
	return {
		$starts: function $starts(selector, value, args) {
			args = Array.isArray(args) ? args : [args];
			return (value || "").startsWith(args[0]);
		},
		$startsWith: function $startsWith(selector, value, args) {
			args = Array.isArray(args) ? args : [args];
			return (value || "").startsWith(args[0]);
		},
		$ends: function $ends(selector, value, args) {
			args = Array.isArray(args) ? args : [args];
			return (value || "").endsWith(args[0]);
		},
		$endsWith: function $endsWith(selector, value, args) {
			args = Array.isArray(args) ? args : [args];
			return (value || "").endsWith(args[0]);
		},
		$contains: function $contains(selector, value, args) {
			args = Array.isArray(args) ? args : [args];
			return (value || "").indexOf(args[0]) >= 0;
		}
	};
});

mingo.addOperators(mingo.OP_EXPRESSION, function (_) {
	return {
		$eval: function $eval(selector, value, args) {
			if (!EV_CACHE[value]) {
				EV_CACHE[value] = jsexpr.eval(value);
			}
			return EV_CACHE[value](selector);
		},
		$expr: function $expr(selector, value, args) {
			if (!EX_CACHE[value]) {
				EX_CACHE[value] = jsexpr.expr(value);
			}
			return EX_CACHE[value](selector);
		},
		$keyval: function $keyval(selector, value, args) {
			var val = _.computeValue(selector, value);
			return val.reduce(function (map, item) {
				map[item[0]] = item[1] || "_";
				return map;
			}, {});
		},
		$trim: function $trim(selector, value, args) {
			var chars = new Set((value.chars || '').split(''));
			var val = _.computeValue(selector, value.input).split('');
			while (chars.has(val[0])) {
				val.shift();
			}while (chars.has(val[val.length - 1])) {
				val.pop();
			}return val.join('');
		},
		$starts: function $starts(selector, value, args) {
			var val = _.computeValue(selector, value[0]);
			return (val || "").startsWith(value[1]);
		},
		$startsWidth: function $startsWidth(selector, value, args) {
			var val = _.computeValue(selector, value[0]);
			return (val || "").startsWith(value[1]);
		},
		$ends: function $ends(selector, value, args) {
			var val = _.computeValue(selector, value[0]);
			return (val || "").endsWith(value[1]);
		},
		$endsWith: function $endsWith(selector, value, args) {
			var val = _.computeValue(selector, value[0]);
			return (val || "").endsWith(value[1]);
		},
		$contains: function $contains(selector, value, args) {
			var val = _.computeValue(selector, value[0]);
			return (val || "").indexOf(value[1]) >= 0;
		}
	};
});

module.exports = mingo;
//# sourceMappingURL=mingo_ex.js.map
