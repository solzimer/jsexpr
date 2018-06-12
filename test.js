const expr = require('./index');

let fn1 = expr.eval('(${a} + ${b}) / ${c} + ${d.e}');
console.log(fn1);
