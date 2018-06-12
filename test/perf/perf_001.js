const
	expression = require("../../lib/expression"),
	Benchmark = require('benchmark');

var suite = new Benchmark.Suite;

// add tests
suite.
	add('eval', function() {
		let fn = expression.eval("(${a} + ${b.c}) / ${d.e}","eval")
	  fn({a:20,b:{c:15},d:{e:50}});
	}).
	add('itval', function() {
		let fn = expression.eval("(${a} + ${b.c}) / ${d.e}","itval")
	  fn({a:20,b:{c:15},d:{e:50}});
	}).
	on('cycle', function(event) {
	  console.log(String(event.target));
	}).
	on('complete', function() {
	  console.log('Fastest is ' + this.filter('fastest').map('name'));
	}).
	run({
		'async': true
	});
