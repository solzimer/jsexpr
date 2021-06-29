let expression = require('./expression'),
	mingo = require('./mingo_ex');

let instance = expression('$');
instance.newInstance = function(token) {
	return expression(token);
}

instance.filter = function(name,fncallback) {
	instance.FILTERS[name] = fncallback;
}

module.exports = instance;
