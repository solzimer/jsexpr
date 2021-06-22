const CACHE = {}

function fneval(obj, key) {
    try {
        return eval("this." + key);
    } catch (err) {
        return undefined;
    }
}

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

module.exports = EVALS;
