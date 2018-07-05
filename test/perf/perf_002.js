const
	expression = require("../../lib/expression"),
	Benchmark = require('benchmark');

var suite = new Benchmark.Suite;

var expr1 = expression.expr({time : "${client}/${address.host}:${address.port}", data : {request : {headers : "${headers}"}}});

// add tests
suite.
	add('jsontokens', function() {
		var entry = {client : "HOST001",	address : {host : "localhost", port : 8080}, headers : "Content-Type: application/json"}
	  expr1(entry);
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
