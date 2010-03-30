// Silently create raptor namespace
if(typeof raptor === 'undefined') {
	var raptor = {};
}

raptor.pack = (function() {
	
	var nodeStorage = {};
	var fragmentStorage = {};
	
	var newElement = function(tag) {
		if (!nodeStorage[tag]) nodeStorage[tag] = document.createElement(tag);
		return nodeStorage[tag].cloneNode(true);
	}
	
	var insertText = function(el, string, needWrap) {
		if (/\&\S+;/.test(string)) el.innerHTML += string;
		else el.appendChild(document.createTextNode(string));
	}
	
	var type = function(types, data) {
		for (var i = 0; i < types.length; i++) {
			if (data.constructor.toString().indexOf(types[i]) !== -1) return true;
		}
		return false;
	}
	
	return {
		
		/**
		 * Creates DOMElements
		 * 
		 * - Contents can contain array of strings, numbers, or other DOMElements created by this method
		 * - Fragment is the name of the fragment to append the birthed DOMElement to
		 * 
		 * @param {String} tag
		 * @param {Object} attrs
		 * @param {String|Number|Array} contents
		 * @param {String} fragment (optional)
		 */
		birth : function(tag, attrs, contents, fragment) {

			// creates new element, or clones existing
			var el = newElement(tag);
			
			// set attributes
			for (var attr in attrs) {
				if (el[attr]) el[attr] = attrs[attr];
				else el.setAttribute(attr, attrs[attr]);
			}
			
			// parse content
			if (type(['String', 'Number'], contents)) {
				insertText(el, contents);
			}
			else if (type(['Array'], contents)){
				for (var i = 0; i < contents.length; i++) {
					if (type(['String', 'Number'], contents[i])) {
						insertText(el, contents[i], true);
					}
					else {
						el.appendChild(contents[i]);
					}
				}
			}
			
			// if fragment referenced, create and/or add to fragment
			if (fragment) {
				if (!fragmentStorage[fragment]) {
					fragmentStorage[fragment] = document.createDocumentFragment();
					fragmentStorage[fragment].appendChild(el);
				}
				else fragmentStorage[fragment].appendChild(el);
			}

			return el;
		},
		
		/**
		 * Returns stored documentFragment clone
		 * 
		 * @param {String} name
		 */
		nursery : function(name) {
			return fragmentStorage[name].cloneNode(true);
		}
	}
})();