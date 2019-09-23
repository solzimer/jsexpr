'use strict';

var expression = require('./expression');

var instance = expression('$');
instance.newInstance = function (token) {
	return expression(token);
};

module.exports = instance;
//# sourceMappingURL=index.js.map
