const jsexpr = require('./index.js');

const xpr = jsexpr.expr({$:[{$set:{str:{$expr:"${res}:${sev}"}}}]});

let res = xpr({sev:1,res:"UX"});
console.log(res);

const xpr2 = jsexpr.expr({
	$ : [
		{
			$set : {
				str :  {
					$switch : {
						branches : [
							{case : {$eval:"${sev}>1"}, then: "SEV>1"}
						],
						default : "SAFE"
					}		
				}
			}
		}
	],
	_ : "${str}"
});

res = xpr2({sev:1,res:"UX"});
console.log(res);
res = xpr2({sev:4,res:"UX"});
console.log(res);
