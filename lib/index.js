let expression = require('./expression');

let instance = expression('$');
instance.newInstance = function(token) {
	return expression(token);
}

module.exports = instance;
