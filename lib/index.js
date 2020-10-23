let expression = require('./expression'),
	mingo = require('./mingo_ex');

let instance = expression('$');
instance.newInstance = function(token) {
	return expression(token);
}

module.exports = instance;
