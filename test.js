const expr = require('./index.js');

function runTest(test) {
	test.xps.forEach(t=>{
		let xp = expr[t.type](t.xp);
		console.log(xp(test.obj));
	});
}

let fn1 = expr.eval('(${a} + ${b}) / ${this.c} + ${d.e}');
console.log(fn1({a:4,b:6,c:10,d:{e:4}}));

var expr1 = expr.expr({time : "${client}/${address.host}:${address.port}", data : {request : {headers : "${headers}"}}});

var input1 = {client : "HOST001", address : {host : "localhost", port : 8080}, headers : "Content-Type: application/json"}
var output1 = {time: 'HOST001/localhost:8080',	data: {request: {headers: 'Content-Type: application/json'}}}

var input2 = {client : "HOST002", address : {host : "localhost", port : 8443}, headers : "Content-Type: text/html"}
var output2 = {time: 'HOST002/localhost:8443',	data: {request: {headers: 'Content-Type: text/html'}}}

console.log(JSON.stringify(output1,null,2));
console.log(JSON.stringify(expr1(input1),null,2));

console.log(JSON.stringify(output2,null,2));
console.log(JSON.stringify(expr1(input2),null,2));

var assign = expr.assign("a.b.c[0]");
var input3 = {a:{b:{c:[1,2,3,4,5]}}};
assign(input3,"10");
console.log(JSON.stringify(input3,null,2));

let nexpr = expr.newInstance('@');
fn1 = nexpr.eval('(@{a} + @{b}) / @{c} + @{d.e}');
console.log(fn1({a:4,b:6,c:10,d:{e:4}}));


let test04 = {
	obj : {client : "HOST001", address : {host : "localhost", port : 8080}, headers : "Content-Type: application/json"},
	xps : [
		{type:"expr", xp:"${JSON}"},
		{type:"expr", xp:"${JSON:address}"},
		{type:"expr", xp:"${JSON:address:0}"},
		{type:"expr", xp:"${JSON:0}"}
	]
}

let test05 = {
	obj : {test:false},
	xps : [
		{type:'expr', xp:"${!this.test}"},
		{type:'expr', xp:"${this.test}"},
		{type:'expr', xp:"${test}"},
		{type:'expr', xp:"${!test}"},
		{type:'expr', xp:"${this}"}
	]
}

let test06 = {
	obj : {a:{b:{c:"hi"}}},
	xps : [
		{type:'expr', xp:"${a['b']['c']}"},
		{type:'expr', xp:'${a["b"]["c"]}'},
		{type:'eval', xp:"${a['b']['c']}=='hi'"},
		{type:'eval', xp:'${a["b"]["c"]}=="hi"'}
	]
};

let test07 = {
	obj : {a:new Date()},
	xps : [
		{type:'expr', xp:"${a.toLocaleTimeString('en')}"},
	]
};

runTest(test04);
runTest(test05);
runTest(test06);
runTest(test07);

expr.traverse({
	a: {
		b: 1,
		c: [1,2,3],
		d: {
			e : "f"
		}
	}
},(obj,key,val)=>{
	console.log(key,val);
	return val;
});
