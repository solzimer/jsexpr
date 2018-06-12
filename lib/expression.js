const extend = require("extend");
const RX = /\$\{[^\}]+\}/g;

function fneval(obj, key) {
	try {
		return eval("this." + key);
	} catch (err) {
		return undefined;
	}
}

const EVALS = {
	itval(obj,key) {
		var arr = key.split(".");
		arr.forEach(key=>{
			if(obj==null || obj==undefined) return;
			else obj = obj[key];
		});

		let v = obj || undefined;
		return v===undefined? "" : v;
	},
	eval(obj,key) {
		let v = fneval.call(obj,obj,key);
		return v===undefined? "" : v;
	},
	valwalk(src,ops,path) {
		if(!src) return src;
		Object.keys(src).forEach(k=>{
			let newpath = `${path}${path?'.':''}${k}`;
			if(ops[newpath])
			src[k] = ops[newpath];
			if(typeof(src[k])=="object")
			EVALS.valwalk(src[k],ops,newpath);
		});
		return src;
	}
}

function parse(expr,method) {
	method = method || "eval";
	var m = expr.match(RX);
	if(m) {
		m.forEach(token=>{
			var key = token.replace(/[\$\{\}]/g,"").trim();
			expr = expr.replace(token,"__val(entry,'"+key+"')");
		});
	}
	var fn = new Function("entry","__val","return ("+expr+")");

	return function(entry) {
		return fn(entry,EVALS[method]);
	}
}

function tokens(expr,method) {
	method = method || "eval";
	if(expr=="${JSON}") return function(entry) {return JSON.stringify(entry,null,2)};

	var list = [];
	var m = expr.match(RX)||[];
	m.forEach(token=>{
		var idx = expr.indexOf(token);
		var t = expr.substring(0,idx);
		expr = expr.substring(idx+token.length);
		list.push(t);
		list.push(function(entry){
			return EVALS[method](entry,token.replace(/\$|\{|\}/g,""))
		});
	});
	list.push(expr);

	return function(entry) {
		return list.map(t=>typeof(t)=="string"? t : t(entry)).join("");
	}
}

function jsontokens(json) {
	let ops = [];

	function walk(json,path) {
		if(!json) return;
		Object.keys(json).forEach(k=>{
			let newpath = `${path}${path?'.':''}${k}`;
			let t = json[k];
			if(typeof(t)=="string") {
				ops.push({path:newpath,fn:tokens(t)});
			}
			else {
				walk(t,newpath);
			}
		});
	}

	walk(json,"");

	return function(entry) {
		let map = ops.map(op=>{
			return {path:op.path, value:op.fn(entry)}
		}).reduce((map,op)=>{
			map[op.path] = op.value;
			return map;
		},{});

		return EVALS.valwalk(extend(true,{},json),map,"");
	}
}

module.exports = {
	fn : parse,
	eval : parse,
	expr(input){
		if(typeof(input)=="object")
			return jsontokens(input);
		else
			return tokens(input);
	}
}
