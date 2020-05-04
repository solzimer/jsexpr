const extend = require("extend");

function instance(token) {
	const RX = new RegExp(`\\${token}\\{[^\\}]+\\}`,'g');					// /\$\{[^\}]+\}/g;
	const RX_RPL_PARSE = new RegExp(`\\${token}\\{([^\\}]+)\\}`);	// /\$\{([^\}]+)\}/;
	const RX_RPL_TOKEN = new RegExp(`\\${token}\\{|\\}`,'g');					// /\$\{|\}/g;
	const RX_JSON_TOKEN = new RegExp(`^\\${token}\\{JSON(:(\\d+|([^:]+(:(\\d+))?)))?\\}$`);
	const CACHE = {}

	function cacheeval(obj,key) {
		if(!CACHE[key]) {
			let rkey = key.replace(/'/g,"\\'");
			let rx = /^[a-zA-Z$_@]/;
			let fn = eval(`(function(){
				let rx = /^[a-zA-Z$_]/;
				return '${rkey}'.startsWith('this.') || '${rkey}'=='this' || !rx.test('${rkey}')?
					function() {
						let r = undefined;
						try {r=${key};}
						catch(err){}
						return r;
					} :
					function() {
						let r = undefined;
						try {r=this.${rx.test(key)? key:'$___$'};}
						catch(err){try{r=${key};}catch(err){}}
						return r;
					}
			})()`);
			CACHE[key] = fn;
		}
		return CACHE[key].call(obj);
	}

	function fneval(obj, key) {
		try {
			return eval("this." + key);
		} catch (err) {
			return undefined;
		}
	}

	function fnassign(path) {
		return eval(`(function(){
			return function(obj,val) {
				try {
					return obj.${path} = val;
				}catch(err) {}
			}
		})()`);
	}

	const EVALS = {
		eval(obj,key) {
			let v = fneval.call(obj,obj,key);
			return v===undefined? "" : v;
		},
		iteval(obj,key) {
			var arr = key.split(".");
			arr.forEach(key=>{
				if(obj==null || obj==undefined) return;
				else obj = obj[key];
			});

			let v = obj || undefined;
			return v===undefined? "" : v;
		},
		ceval(obj,key) {
			let v = cacheeval(obj,key);
			return v===undefined? "" : v;
		},
		valwalk(src,ops,path) {
			if(!src) return src;
			for(let k in src) {
				let newpath = `${path}${path?'.':''}${k}`;
				let rop = ops[newpath];
				if(rop!==undefined)
					src[k] = rop;
				else if(typeof(src[k])=="object")
					EVALS.valwalk(src[k],ops,newpath);
			};
			return src;
		}
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

		// JSON stringify
		if(RX_JSON_TOKEN.test(expr)) {
			let parts = expr.replace(RX_RPL_TOKEN,"").split(":");
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
			return function(entry) {
				return JSON.stringify(fnxpr(entry),null,spaces);
			}
		}

		var list = [], len = 0;
		var m = expr.match(RX)||[];
		m.forEach(token=>{
			var idx = expr.indexOf(token);
			var t = expr.substring(0,idx);
			var rtoken = token.replace(RX_RPL_TOKEN,"");
			expr = expr.substring(idx+token.length);
			list.push(t);
			list.push(function(entry){
				return method(entry,rtoken);
			});
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

	function exprfn(input,replace){
		if(typeof(input)=='number') {
			return function(obj){return input};
		}
		else if(typeof(input)=="object") {
			return jsontokens(input,replace);
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
