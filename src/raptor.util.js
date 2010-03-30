/**
* Temporary place to hold some utility functions
* which should be used througout Raptor JS
*
* This will need to be refactored
*/

if(typeof raptor === 'undefined') {
	var raptor = {};
}

(function () {
	
	// Let's prototyp the indexOf for arrays
	if(typeof Array.indexOf !== 'function') {
		
		Array.prototype.indexOf = function (needle) {
			var length = this.length;
			
			for(var i=0; i<length; i++) {
				if(this[i] === needle) return i;
			}
			
			return -1;
		}
	}
	
})();