const
	expression = require("../dist/node"),
	assert = require('assert');

describe('Expression parser', function() {
	it('Should parse expression', function() {
		try {
			let fn1 = expression.fn('(${a} + ${b}) / ${c} + ${d.e}');
			assert.ok("Expression parsed");
		}catch(err) {
			assert.fail("Error thrown");
		}
	});

	it('Should throw error', function() {
		try {
			var error = null;
			let fn2 = expression.fn('(${a} < ${d.e}');
		}catch(err) {
			error = err;
		}
		assert(error!=null,);
	});
});

describe('String evaluation', function() {
	let fn1 = expression.fn('(${a} + ${b}) / ${c} + ${d.e}');
	let fn2 = expression.fn('${a} < ${d.e}');

	it('Should perform operation', function() {
		let res = fn1({a:5,b:10,c:3,d:{e:30}});
		assert.equal(35,res);
	});
	it('Should perform operation with missing value', function() {
		let res = fn1({b:10,c:2,d:{e:30}});
		assert.equal(35,res);
	});
	it('Should fail operation with missing values', function() {
		let res = fn1({d:{e:30}});
		assert(isNaN(res));
	});
	it('Should evaluate condition (true)', function() {
		let res = fn2({a:5,d:{e:30}});
		assert.equal(true,res);
	});
	it('Should evaluate condition (false)', function() {
		let res = fn2({a:30,d:{e:30}});
		assert.equal(false,res);
	});
});

describe('String interpolation', function() {
	let fn1 = expression.expr('(${a} + ${b}) / ${c} + ${d.e}');
	let fn2 = expression.expr('${a} < ${d.e}');

	it('Should interpolate operation', function() {
		let res = fn1({a:5,b:10,c:3,d:{e:30}});
		assert.equal('(5 + 10) / 3 + 30',res);
	});
	it('Should interpolate with missing values', function() {
		let res = fn1({b:10,c:2,d:{e:30}});
		assert.equal('( + 10) / 2 + 30',res);
	});
});
