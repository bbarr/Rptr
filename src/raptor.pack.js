// Silently create raptor namespace
if(typeof raptor === 'undefined') var raptor = {};

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
			if (raptor.util.type(['String', 'Number'], contents)) {
				util.insertText(el, contents);
			}
			else if (raptor.util.type('Array', contents)){
				for (var i = 0; i < contents.length; i++) {
					if (raptor.util.type(['String', 'Number'], contents[i])) {
						util.insertText(el, contents[i], true);
					}
					else if (raptor.util.type('Function', contents[i])) {
						contents[i](el); 
					}
					else {
						el.appendChild(contents[i]);
					}
				}
			}
			else if (raptor.util.type(['Function'], contents)) contents(el);
			
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
		},
		
		/**
		 * Checks for "persistent" events to apply
		 * to the element before appending.
		 * 
		 */
		autoAppendChild : function(el, parent) {
			if (typeof raptor.events === 'undefined') return false;
			
			 
			parent.appendChild(el);
		}
	}
})();