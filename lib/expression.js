const 
	EVALS = require('./evals.js'), 
	extend = require("extend"),
	dayjs = require('dayjs'),
	Mingo = require("mingo");

function instance(token) {
	const RX = new RegExp(`\\${token}\\{[^\\}]+\\}`,'g');					// /\$\{[^\}]+\}/g;
	const RX_RPL_PARSE = new RegExp(`\\${token}\\{([^\\}]+)\\}`);	// /\$\{([^\}]+)\}/;
	const RX_RPL_TOKEN = new RegExp(`\\${token}\\{|\\}`,'g');					// /\$\{|\}/g;

	function fnassign(path) {
		return eval(`(function(path){
			return function(obj,val) {
				try {
					// Ensure path
					let root = obj;
					let kpath = path.split('.');
					for(let i=0; i<kpath.length;i++) {
						let k = kpath[i];
						if(!root[k]) root[k] = {};
						root = root[k];
					}
	
					return obj.${path} = val;
				}catch(err) {}
			}
		})('${path}')`);
	}

	function parse(expr,method) {
		method = method || "ceval";
		var m = expr.match(RX);
		if(m) {
			m.forEach(token=>{
				var key = token.replace(RX_RPL_PARSE,"$1").trim().replace(/'/g,"\\'");
				expr = expr.replace(token,"__val(entry,'"+key+"')");
			});
		}
		var fn = new Function("entry","__val","return ("+expr+")");

		return function(entry) {
			return fn(entry,EVALS[method]);
		}
	}

	function tokens(expr,method) {
		method = EVALS[method || "ceval"];

		var list = [], len = 0;
		var m = expr.match(RX)||[];
		m.forEach(token=>{
			var idx = expr.indexOf(token);
			var t = expr.substring(0,idx);
			var rtoken = token.replace(RX_RPL_TOKEN,"");
			expr = expr.substring(idx+token.length);
			list.push(t);

			// JSON Formatter
			if(rtoken.startsWith('JSON:')) {
				let parts = rtoken.split(":");
				let nexpr = parts[1];
				let spaces = parts[2];
				if(parts.length==2) {
					if(isNaN(nexpr)) {spaces = 2;}
					else {nexpr = 'this';	spaces = parts[1];}
				}
				else if(parts.length==1) {
					nexpr = 'this';
					spaces = 2;
				}
				spaces = parseInt(spaces);
				let fnxpr = tokens("${"+nexpr+"}");
				let fn =  function(entry) {
					return JSON.stringify(fnxpr(entry),null,spaces);
				}	
				list.push(fn);
			}
			// Date Formatter
			else if(rtoken.startsWith('DATE:')) {
				let parts = rtoken.split(":");
				parts.shift();
				let nexpr = exprfn("${"+parts.shift()+"}");
				let format = parts.join(":").split('|');
				let fn = function(entry) {
					let res = nexpr(entry);
					let dt = dayjs(res,format[0]);
					if(format[1]) {
						return dt.format(format[1]);
					}
					else {
						return dt.toDate();
					}
				}	
				list.push(fn);
			}
			// Evaluator
			else {
				list.push(function(entry){				
					return method(entry,rtoken);
				});
			}
		});

		list.push(expr);
		list = list.filter(l=>l!="");
		len = list.length;

		if(len>1) {
			return function(entry) {
				let ret = "";
				for(let i=0;i<len;i++) {
					let t = list[i];
					ret += typeof(t)=="string"? t : t(entry);
				}
				return ret;
			}
		}
		else {
			return function(entry) {
				let t = list[0];
				return typeof(t)=="string"? t : t(entry);
			}
		}
	}

	function jsontokens(json) {
		let ops = [], len = 0;

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
		len = ops.length;

		return function(entry) {
			let map = {};
			for(let i=0;i<len;i++) {
				let op = ops[i];
				map[op.path] = op.fn(entry);
			}
			return EVALS.valwalk(extend(true,{},json),map,"");
		}
	}

	function mingotokens(json) {
		let xpr = Array.isArray(json.$)? json.$ : [json.$];
		let aggr = new Mingo.Aggregator(xpr);
		return function(input) {
			let isArray = Array.isArray(input);
			let res = aggr.run(isArray? input : [input]);
			if(!isArray && res.length<=1) return res[0];
			else return res;
		}
	}

	function exprfn(input,replace){
		if(typeof(input)=='number') {
			return function(obj){return input};
		}
		else if(typeof(input)=="object") {
			let ninput = extend({},input);
			delete ninput['$'];

			const prfn = input["$"] ? mingotokens(input, replace) : (input)=>input;
			const nxfn = Object.keys(ninput).length? jsontokens(ninput,replace) : (input)=>input;
			
			return function(obj) {
				let prres = prfn(obj);
				let nxres = nxfn(prres);
				if(typeof(nxres._)!=='undefined' && Object.keys(nxres).length==1) 
					return nxres._;
				else
					return nxres;
			}
		}
		else {
			return tokens(input);
		}
	}

	function traverse(object,callback) {
		for(let key in object) {
			object[key] = callback(object,key,object[key]);
		}

		for(let key in object) {
			if(typeof(object[key])=='object') {
				traverse(object[key],callback);
			}
		}
	}

	return {
		fn : parse,
		eval : parse,
		assign : fnassign,
		expr : exprfn,
		expression : exprfn,
		traverse : traverse
	}
}

module.exports = instance;
