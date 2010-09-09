raptor.events = (function() {
	
	// private
	var _dom, _persistant, _custom , _util, _loaded;
	
	// public
	var api;
		
	// utility functions for event management
	_util = {    		    
		format_type : function(type) {
 			return (type === 'DOMContentLoaded' || /^on/.test(type)) ? type : 'on' + type;
		}
	};
	
	_dom = {
		collection : [],
		add : function(target, type, cb) {
			
			type = _util.format_type(type);
			
			var target_events = this.find_events_by_target(target);
			if (target_events) {
				(target_events[type]) ? target_events[type].push(cb) : target_events[type] = [cb]; 
			}
			else {
				var new_target_event = { 'target' : target, 'types' : {} };
				new_target_event.types[type] = [cb];
				this.collection.push(new_target_event);
			}
			
			target[type] = this.fire;
		},
		fire : function(event) {

			var data = _dom.generate_data(event);
			
			var target_events = _dom.find_events_by_target(data.target);
			if (!target_events) return false;
			
			var callbacks = target_events.types[data.type];
			if (!callbacks) return false;

			for (var i = 0, len = callbacks.length; i < len; i++) callbacks[i](data);
		},
		generate_data : function(event) {
			var custom_event = { 'dom' : event };
			custom_event['target'] = event.target || event.srcElement;
			custom_event['type'] = _util.format_type(event.type);
			custom_event['preventDefault'] = event.preventDefault || function() { event.cancelBubble = true };
			return custom_event;
		},
		find_events_by_target : function(target) {
			var collection = this.collection;
			for (var i in collection) {
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
			
			var current_set = $p.hunt(query);
			api.add(current_set, type, cb);
		},
		remove : function(query) {
			this.collection.remove(query);
		}
	}
	
	_custom = {
		collection : {},
		add : function(name, cb) {
			var collection = this.collection;
			var match = false;
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
		}
	}
	
	api = {
	
        /**
		* Queue up methods to run when the document is ready
		*
		* @param {Function} Callback
		*/
		ready : function (fn) {										
						
			if (_loaded) {
				fn();
				return;
			}
			
			raptor.events.add(document, 'DOMContentLoaded', fn);
			
			if (document.readyState) {
				if (!timer) {
					var timer = setInterval(function() {
						if (document.readyState === 'complete') {
							if (!_loaded) {
								_loaded = true;
								clearInterval(timer);
								timer = null;
								_dom.fire({'target' : document, 'type' : 'DOMContentLoaded'});
							}
						}
					}, 10);
				}
			}
		},	
	
		add : function(target, type, cb) {
			if (cb) {
				if (typeof target === 'string') {
					if (typeof cb === 'function') _persistent.add(target, type, cb);
					else _custom.add(target, type, cb);
				}
				else {
					if ($u.type('Array', target)) {
						for (var i = 0, len = target.length; i < len; i++) _dom.add(target[i], type, cb);
					}
					else _dom.add(target, type, cb);
				}
			}
			else _custom.add(target, type);
		},
		remove : function(target, type, cb) {},
		fire : function(target, data) {
			if (typeof target === 'string') _custom.fire(target, data);
		},
		apply_persistence : function(el) {

			var _apply = function(test_el, persistent_event) {
				var types = persistent_event.types;
				for (var type in types) {
					var callbacks = types[type];
					for (var i = 0, len = callbacks.length; i < len; i++) {
						api.add(test_el, type, callbacks[i]);
					}
				}
			}
		
			var _test = function(test_el) {
				for (var i = 0, len = persistent_events.length; i < len; i++) {
					var persistent_event = persistent_events[i];
					if ($p.hunt(persistent_event.query).indexOf(test_el) > -1) _apply(test_el, persistent_event);
				}
			}
			
			var persistent_events = _persistent.collection;
			
			_test(el);
			
			var children = el.getElementsByTagName('*');
			for (var i = 0, len = children.length; i < len; i++) _test(children[i]);
		},
		clear_missing : function() {}
	}
	
	return api;
})();

if ($ === raptor) $e = raptor.events;
