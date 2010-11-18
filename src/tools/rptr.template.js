rptr.Template = function() {
	this.storage = document.createDocumentFragment();
	this.current = [];
}

rptr.Template.prototype = {
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
		var current = this.current, current_length;
		while (quantity) {
			current_length = current.length;
			if (current_length > 1) current[current_length - 2].appendChild(current.pop());
			else this.storage.appendChild(current[0]);
			quantity--;
		}
		this.current = current;
		return this;
	},
	fn : function(fn) {
		fn(this);
		return this;
	},
	dump : function() {
		var html = this.storage;
		this.storage = document.createDocumentFragment();
		this.current = [];
		return html;
	},
	embed : function(html) {
		var current = this.current, current_length = current.length;
		if (current_length > 0) current[current_length -1].appendChild(html);
		else this.storage.appendChild(html);
		return this;		
	}
};

// populate custom tag methods
(function() {
	
	var tags = [
		
		// text
		'p','h1','h2','h3','h4','h5','h6','strong','em','abbr','address','bdo','blockquote','cite','q','code','ins','del','dfn','kbd','pre','samp','var','br',
		
		// structure
		'div', 'span',
		
		// links
		'a', 'base',
		
		// images and objects
		'img','area','map','object','param',
		
		// lists
		'ul','ol','li','dl','dt','dd',
		
		// tables
		'table','tr','td','th','tbody','thead','tfoot','col','colgroup','caption',
		
		// forms
		'form','input','textarea','select','option','optgroup','button','label','fieldset','legend'
		
	], 
	proto = rptr.Template.prototype;
		
	var build_element_method = function(tag) {
		return function(data) {
			this._add_element(rptr.dom.build(tag, data));
			return this;
		}
	}
	
	var build_container_element_method = function(tag) {
		return function(data) {
			this._add_element(rptr.dom.build(tag, data), true);
			return this;
		}
	}
	
	var build_post_close_element = function(tag) {
		return function(data) {
			this.c();
			this._add_element(rptr.dom.build(tag, data));
			return this;
		}
	}
	
	var build_post_close_container_element = function(tag) {
		return function(data) {
			this.c();
			this._add_element(rptr.dom.build(tag, data), true);
			return this;
		}
	}
	
	for (var i = 0, len = tags.length; i < len; i++) {
		var tag = tags[i];
		proto[tag] = build_element_method(tag);
		proto[tag + '_'] = build_container_element_method(tag);
		proto['_' + tag] = build_post_close_element(tag);
		proto['_' + tag + '_'] = build_post_close_container_element(tag);
	}
	
})();