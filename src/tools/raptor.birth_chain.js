raptor.BirthChain = function() {
	this.storage = document.createDocumentFragment();
	this.current = [];
}

raptor.BirthChain.prototype = {
	_add_element : function(el, has_children) {
		var current = this.current, current_length = current.length;
		if (has_children) current.push(el);
		else if (current_length) current[current_length - 1].appendChild(el);
		else this.storage.appendChild(el);
	},
	t : function(text) {
		var current = this.current;
		current[current.length - 1].innerHTML += text;
		return this;
	},
	c : function(quantity) {
		quantity = quantity || 1;
		var current = this.current, current_length = current.length;
		while (quantity) {
			if (current_length > 1) current[current_length - 2].appendChild(current.pop());
			else this.storage.appendChild(current.pop());
			quantity--;
		}
		return this;
	}
};

// populate custom tag methods
(function() {
	
	var tags = ['div','p','a', 'ul', 'li'], proto = raptor.BirthChain.prototype;
		
	var build_element_method = function(tag) {
		return function(data) {
			this._add_element(raptor.birth(tag, data));
			return this;
		}
	}
	
	var build_container_element_method = function(tag) {
		return function(data) {
			this._add_element(raptor.birth(tag, data), true);
			return this;
		}
	}
	
	for (var i = 0, len = tags.length; i < len; i++) {
		var tag = tags[i];
		proto[tag] = build_element_method(tag);
		proto[tag + '_'] = build_container_element_method(tag);
	}
	
})();

/*

(function() {
		
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

*/