const expression = require('../../dist/node');

var fn = expression.fn("(${host}=='mymachine' || ${host}=='yourmachine') && ${appName}=='su'");
var expr = expression.expr("/var/${date}/${client.address}/file.log");
var jsexpr = expression.expr({
	time : "${client}/${address.host}:${address.port}",
	data : {
		request : {
			headers : "${headers}"
		}
	}
});

console.log(fn({host:"mymachine",appName:23}));
console.log(expr({date:"2017-01-01",client:{address:"localhost"}}));
console.log(jsexpr({
	client : "HOST001",
	address : {
		host : "localhost",
		port : 8080
	},
	headers : "Content-Type: application/json"
}));
