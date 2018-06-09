const expression = require('../');

var fn = expression.fn("(${host}=='mymachine' || ${host}=='yourmachine') && ${appName}=='su'");
var expr = expression.expr("/var/${date}/${client.address}/file.log");
var jsexpr = expression.expr({
	time : "${caca}/${de.vaca}",
	data : {
		tengo : {
			una : "${motocicleta}"
		}
	}
});

console.log(fn({host:"mymachine",appName:23}));
console.log(expr({date:"2017-01-01",client:{address:"localhost"}}));
console.log(jsexpr({
	caca : "soy caca",
	de : {
		vaca : true
	},
	motocicleta : 514
}));
