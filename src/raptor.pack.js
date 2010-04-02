// Silently create raptor namespace
if(typeof raptor === 'undefined') {
	var raptor = {};
}

raptor.pack = (function() {
	
	var nodeStorage = {};
	var fragmentStorage = {};
	
	var util = {
		
		/**
		 * Creates Element and adds to storage or clones existing
		 * 
		 * @param {String} tag
		 */
		newElement : function(tag) {
			if (!nodeStorage[tag]) nodeStorage[tag] = document.createElement(tag);
			return nodeStorage[tag].cloneNode(true);	
		},
		
		/**
		 * Adds text to element
		 * 
		 * - auto-detects HTML Entities and uses innerHTML
		 * 
		 * @param {HTMLElement} el
		 * @param {String} string
		 */
		insertText : function(el, text) {
			if (/\&\S+;/.test(text)) el.innerHTML += text;
			else el.appendChild(document.createTextNode(text));
		},
		
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
						break;
					case 'HTMLElement':
						if (data.tagName) match = true;
						break;
					default:
						if (data.constructor && data.constructor.toString().indexOf(type) !== -1) match = true;		
				}
			}
			if (typeof types === 'string') test(types);
			else for (var i = 0; i < types.length && !match; i++) test(types[i]);
			return match;
		}
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
		 * @param {String|Number|Array|HTMLElement} contents
		 * @param {String} fragment (optional)
		 */
		birth : function(tag, attrs, contents, fragment) {
			
			// creates new element, or clones existing
			var el = util.newElement(tag);
			
			// set attributes
			if (attrs == '') attrs = {};
			for (var attr in attrs) {
				
				if (attr == 'style') {
					
					var styles = attrs[attr];	
					for (var prop in styles) {
						el.style[prop] = styles[prop];
					}
				}
				else {
					if (el[attr]) el[attr] = attrs[attr];
					else el.setAttribute(attr, attrs[attr]);
				}
			}
			
			// parse content
			if (util.type(['String', 'Number'], contents)) {
				util.insertText(el, contents);
			}
			else if (util.type('Array', contents)){
				for (var i = 0; i < contents.length; i++) {
					if (util.type(['String', 'Number'], contents[i])) {
						util.insertText(el, contents[i], true);
					}
					else if (util.type('Function', contents[i])) {
						contents[i](el); 
					}
					else {
						el.appendChild(contents[i]);
					}
				}
			}
			else if (util.type(['Function'], contents)) contents(el);
			
			// if fragment referenced, create and/or add to existing
			if (fragment) {
				if (!fragmentStorage[fragment]) fragmentStorage[fragment] = document.createDocumentFragment();
				fragmentStorage[fragment].appendChild(el);
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