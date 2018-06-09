"use strict";

(function() {
  var root = this
  var previous_jsexpr = root.jsexpr;
	var jsexpr = require('./index.js');

	if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = jsexpr;
    }
    exports.jsexpr = jsexpr;
  }

	if(typeof window !== 'undefined') {
    window.jsexpr = jsexpr;
  }

}).call(this);
