# jsexpr
JSON Expressions!

[![Build Status](https://travis-ci.org/solzimer/jsexpr.svg?branch=master)](https://travis-ci.org/solzimer/jsexpr)

String and JSON expression interpolator and evaluator. Interpolates or evaluates a string against a json object, or transforms an object into another based on a json template.

## Installation
```
npm install jsexpr
```

## String Evaluation
```javascript
const expression = require("jsexpr");

var fn = expression.fn("(${host}=='mymachine' || ${host}=='yourmachine') && ${appName}=='su'");

// Result: false
var result = fn({host:"mymachine",appName:23});
```

## String Interpolation
```javascript
const expression = require("jsexpr");

var expr = expression.expr("/var/${date}/${client.address}/file.log");

// Result: /var/2017-01-01/localhost/file.log
var result = expr({date:"2017-01-01",client:{address:"localhost"}});
```

## Object Interpolation
```javascript
const expression = require("jsexpr");

var jsexpr = expression.expr({
	time : "${client}/${address.host}:${address.port}",
	data : {
		request : {
			headers : "${headers}"
		}
	}
});

var result = jsexpr({
	client : "HOST001",
	address : {
		host : "localhost",
		port : 8080
	},
	headers : "Content-Type: application/json"
});
```

### Object Interpolation Result
```javascript
{
	time: 'HOST001/localhost:8080',
	data: {
		request: {
			headers: 'Content-Type: application/json'
		}
	}
}
```

### JSON Stringify
```javascript
var input1 = {client : "HOST001", address : {host : "localhost", port : 8080}, headers : "Content-Type: application/json"};

let jxpr1 = expr.expr("${JSON}");
let jxpr2 = expr.expr("${JSON:address}");
let jxpr3 = expr.expr("${JSON:address:0}");
let jxpr4 = expr.expr("${JSON:0}");

// =>

{
  "client": "HOST001",
  "address": {
    "host": "localhost",
    "port": 8080
  },
  "headers": "Content-Type: application/json"
}

{
  "host": "localhost",
  "port": 8080
}

{"host":"localhost","port":8080}

{"client":"HOST001","address":{"host":"localhost","port":8080},"headers":"Content-Type: application/json"}
```
