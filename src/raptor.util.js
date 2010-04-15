/**
* Temporary place to hold some utility functions
* which should be used througout Raptor JS
*
* This will need to be refactored
*/

if(typeof raptor === 'undefined') {
	var raptor = {};
}

raptor.util = (function () {
	
	var indexOf = function (needle) {
		var length = this.length;
		
		for(var i=0; i<length; i++) {
			if(this[i] === needle) return i;
		}
		
		return -1;
	}
	
	// Let's prototype the indexOf for arrays
	if(typeof Array.indexOf !== 'function') {
		Array.prototype.indexOf = indexOf; 
	}

	// Let's prototype the indexOf for HTMLCollections
	if(typeof HTMLCollection.indexOf !== 'function') {
		HTMLCollection.prototype.indexOf = indexOf;
	}
	
	// Prototype the remove function for Arrays
	if(typeof Array.remove !== 'function') {
		
		/*
		* @param {Int} Index
		*/
		Array.prototype.remove = function(index) {
			
			if(index + 1 > this.length || index < 0) return this;
			
			var left, right;
			
			if(index > 0) left = this.slice(0, index);
			else return this.slice(1, this.length);				
			
			if(index < this.length) right = this.slice(index+1, this.length) 
			else return left;
															
			return left.concat(right);										
			
		}
	}
	
	return {
		
		/**
		 * Tests for data type by constructor name
		 * 
		 * @param {Array|String} types
		 * @param {Array|Boolean|Date|Math|Number|String|RegExp|Object|HTMLElement} data
		 */
		type : function(types, data) {
			var match = false;
			var test = function(type) {
				switch(type) {
					case 'Object':
						if (typeof data === 'object' && data.length == undefined && data != null) match = true;
					case 'HTMLElement':
						if (data.tagName) match = true;
					default:
						if (data.constructor && data.constructor.toString().indexOf(type) !== -1) match = true;		
				}
			}
			if (typeof types === 'string') test(types);
			else for (var i = 0; i < types.length && !match; i++) test(types[i]);
			return match;
		}
	}
})();