'use strict';

var expression = require('./expression'),
    mingo = require('./mingo_ex');

var instance = expression('$');
instance.newInstance = function (token) {
	return expression(token);
};

module.exports = instance;
//# sourceMappingURL=index.js.map
