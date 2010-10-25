(function() {
	
	// private
	var _dom, _persistant, _custom , _util;
	
	// public
	var api;
		
	// utility functions for event management
	_util = {    		    
		format_type : function(type) {
			if (!type) return false;
 			return (type === 'DOMContentLoaded' || /^on/.test(type)) ? type : 'on' + type;
		}
	};
	
	_dom = {
		collection : [],
		add : function(target, type, cb) {

			type = _util.format_type(type);
			
			var target_events = this.find_events_by_target(target);
			if (target_events) {
				(target_events.types[type]) ? target_events.types[type].push(cb) : target_events.types[type] = [cb]; 
			}
			else {
				var new_target_event = { 'target' : target, 'types' : {} };
				new_target_event.types[type] = [cb];
				this.collection.push(new_target_event);
			}

			target[type] = api.alarm;
		},
		fire : function(event, ie_current_target) {

			event = event || window.event;
			var data = _dom.generate_data(event);						
			var target_events = _dom.find_events_by_target(event.currentTarget || ie_current_target);

			if (!target_events) return false;

			var callbacks = target_events.types[data.type];
			if (!callbacks) return false;

			for (var i = 0, len = callbacks.length; i < len; i++) callbacks[i](data);
		},
		remove : function(target, type, cb) {
			type = _util.format_type(type);
			var collection = this.collection;
			var match = true;
			if (!type) {
				for (var i = 0, len = collection.length; i < len; i++) {
					if (collection[i].target === target) {
						this.collection.remove(collection[i]);
						match = true;
					}
				}
			}
			else if (!cb) {
				for (var i = 0, len = collection.length; i < len; i++) {
					if (collection[i].target === target) {
						if (collection[i].types[type]) {
							delete collection[i].types[type];
							match = true;
						}
					}	
				}
			}
			else {
				for (var i = 0, len = collection.length; i < len; i++) {
					if (collection[i].target === target) {
						if (collection[i].types[type].indexOf(cb) > -1) {
							collection[i].types[type].remove(cb); 
							match = true;
						}
					}	
				}
			}
			return match;
		},
		generate_data : function(event) {
			var custom_event = { 'dom' : event };
			custom_event['target'] = event.target || event.srcElement;
			custom_event['type'] = _util.format_type(event.type);			
			custom_event['preventDefault'] = (event.preventDefault) ? function() { event.preventDefault(); } : function() { event.returnValue = false };
   			custom_event['x'] = event.pageX || event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    	    custom_event['y'] = event.pageY || event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			return custom_event;
		},
		find_events_by_target : function(target) {
			var collection = this.collection;
			for (var i = 0, len = collection.length; i < len; i++) {
    			var set = collection[i];
    			if (set.target === target) return set;
			}
		}
	}
	
	_persistent = {
		collection : [],
		add : function(query, type, cb) {
			
			type = _util.format_type(type);
			
			var existing_query = this.collection[query];
			if (existing_query) {
				(existing_query[type]) ? existing_query[type].push(cb) : existing_query.types[type] = [cb];
			}
			else {
				var new_persistent_event = { 'query' : query, 'types' : {} }
				new_persistent_event.types[type] = [cb];
				this.collection.push(new_persistent_event);
			}
			
			var current_set = raptor.hunt(query);
			api.lash(current_set, type, cb);
		},
		remove : function(query, type, cb) {
			var collection = this.collection;
			var match = false;
			if (!type) {
				for (var i in collection) {
					if (collection[i].query === query) {
						this.collection.remove(i);
						match = true;
					}
				}
			}
			else if (!cb) {
				for (var i in collection) {
					if (collection[i].query === query) {
						if (collection[i].types[type]) {
							delete collection[i].types[type];
							match = true;
						}
					}	
				}
			}
			else {
				for (var i in collection) {
					if (collection[i].query === query) {
						if (collection[i].types[type].indexOf(cb) > -1) {
							collection[i].types[type].remove(cb);
							match = true;
						}
					}
				}
			}
			return match;
		}
	}
	
	_custom = {
		collection : {},
		
		/**
        * @param {String} Name of custom event
        * @param {Function} Callback to run
        * @param {Integer} Number of fires required to execute cb
        */
		add : function(name, cb, count) {
			var collection = this.collection;
			var match = false;
            
			if (count) {
			    var old_cb = cb;
			    
			    cb = function(e) {
                    this.fire_count = this.fire_count || 0;
                    this.fire_count++;
                    
                    if (this.fire_count === count) old_cb(e);
			    }
			}
			
			for (var i in collection) {
				if (i === name) {
					match = true;
					this.collection[name].push(cb);
				}
			}
			if (!match) this.collection[name] = [cb];
		},
		fire : function(name, data) {
			var collection = this.collection;
			for (var i in collection) {
				if (i === name) {
					var events = collection[i];
					for (var i = 0, len = events.length; i < len; i++) events[i](data);
				}
			}
		},
		remove : function(name, cb) {
			if (!this.collection[name]) return false;
			if (!cb) delete this.collection[name];
			else this.collection[name].remove(cb);
			return true;
		}
	}
	
	api = {

        /**
		* Queue up methods to run when the document is ready
		*
		* @param {Function} Callback
		*/
		ready : function (fn) {										
						
			if (api.loaded) {
				fn();
				return;
			}
			
			raptor.lash(document, 'DOMContentLoaded', fn);
			
			if (document.readyState) {
				if (!timer) {
					var timer = setInterval(function() {
						if (document.readyState === 'complete') {
							if (!api.loaded) {
								api.loaded = true;
								clearInterval(timer);
								timer = null;
								api.alarm({'currentTarget' : document, 'type' : 'DOMContentLoaded'});
							}
						}
					}, 10);
				}
			}
		},	
	
		lash : function(target, type, cb) {
			if (cb) {
				if (typeof target === 'string') {
					if (typeof cb === 'function') _persistent.add(target, type, cb);
					else _custom.add(target, type, cb);
				}
				else {
					if (raptor.type('Array', target)) {
						for (var i = 0, len = target.length; i < len; i++) _dom.add(target[i], type, cb);
					}
					else _dom.add(target, type, cb);
				}
			}
			else _custom.add(target, type);
		},
		
		unlash : function(target, type, cb) {
			if (cb) {
				(typeof target === 'string') ? _persistent.remove(target, type, cb) : _dom.remove(target, type, cb);
			}
			else {
				if (_custom.remove(target, type)) return;
				if (_persistent.remove(target, type)) return;
				if (_dom.remove(target, type)) return;
			}
		},
		
		alarm : function(target, data) {
			if (typeof target === 'string') _custom.fire(target, data);
			else _dom.fire(target, this);
		},
		
		scan_for_life : function(el) {

			var _apply = function(test_el, persistent_event) {
				var types = persistent_event.types;
				for (var type in types) {
					var callbacks = types[type];
					for (var i = 0, len = callbacks.length; i < len; i++) {
						var callback = callbacks[i];
						if (!test_el.applied) test_el.applied = {};
						if (test_el.applied[type]) {
							if (test_el.applied[type].indexOf(callback) > -1) continue;
							else test_el.applied[type].push(callback);
						}
						else test_el.applied[type] = [callback];
						console.log(test_el, test_el.applied);
						api.lash(test_el, type, callback);
					}
				}
			}
		
			var _test = function(test_el) {
				for (var i = 0, len = persistent_events.length; i < len; i++) {
					var persistent_event = persistent_events[i];
					if (raptor.hunt(persistent_event.query).indexOf(test_el) > -1) _apply(test_el, persistent_event);
				}
			}
			
			var persistent_events = _persistent.collection;
			
			var children;
			
			if (el.nodeType === 1) {
				_test(el);
				children = el.getElementsByTagName('*');
				for (var i = 0, len = children.length; i < len; i++) _test(children[i]);
			}
			else {
				for (var i = 0, len = el.length; i < len; i++) {
					var _el = el[i];
					_test(_el);
					children = _el.getElementsByTagName('*');
					for (var x = 0, x_len = children.length; x < x_len; x++) _test(children[x]);
				}
			}	
		}
	}

	if (raptor) raptor.extend(api);
})();
