(function() {
	
	var Tree = function(obj) {
		this.object = obj || {};
	};

	Tree.prototype = {

		branch : function(arr, data) {
			
			var live_link, key, current;

			key = arr[0];

			live_link = current = this.object[key];
			if (!current) {
				if (!data) return false;
				this.object[key] = {};
				current = this.object[key];
				live_link = this.object[key];
			}

			for (var i = 1, len = arr.length; i < len; i++) {

				key = arr[i];

				current = current[key];
				if (!current) {
					if (!data) return false;
					live_link[key] = {};
					current = live_link[key];
				}

				if (i === (len - 1)) {
					if (data) {
						live_link[key] = data;
					}
					return live_link[key];
				}
				else live_link = live_link[key];
			}
			
			return live_link;
		},
		
		add : function() {
			return this.branch.apply(this, arguments);
		},
		
		find : function() {
			var found = this.branch.apply(this, arguments);
			if (found) this.found = found;
			return found;
		}
	}
	
	if (typeof rptr === 'undefined') {
		new Error('RptrJS is required');
	}
	else {
		rptr.tool('Tree', Tree);
	}
})();
