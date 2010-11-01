(function() {
	
	var storage, current = [];
	
	var template = function(tag, attrs) {
		storage = document.createDocumentFragment();
		current[0] = raptor.birth(tag, attrs);
	}
	
	template.prototype = {
		
		b : function(tag, attrs) {
			current[current.length - 1].appendChild(raptor.birth(tag, attrs));
			
			return this;
		},
		
		t : function(text) {
			current[current.length - 1].innerHTML += text;
			
			return this;
		},
		
		bc : function(tag, attrs) {
			current.push(raptor.birth(tag, attrs));
			
			return this;
		},
		
		close : function() {
			if (current.length > 1) {
				current[current.length - 2].appendChild(current.pop());
			}
			else storage.appendChild(current[0])
			
			return this;
		}
	}
	
	var api = {
		birth_chain : function(tag, attrs) {
			return new template(tag, attrs);
		},
		get_birth_chain : function() {
			return storage;
		}
	}
	
	raptor.extend(api);
})();