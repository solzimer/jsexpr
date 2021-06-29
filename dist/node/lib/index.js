'use strict';

var expression = require('./expression'),
    mingo = require('./mingo_ex');

var instance = expression('$');
instance.newInstance = function (token) {
	return expression(token);
};

instance.filter = function (name, fncallback) {
	instance.FILTERS[name] = fncallback;
};

module.exports = instance;
//# sourceMappingURL=index.js.map
