rptr.Data = function(obj) {
	this.object = obj || {};
	this.active_requests = 0;
};

rptr.Data.prototype = {
	
	trace : function(arr, data) {
		
		var live_link, key, current;

		key = arr[0];

		live_link = current = this.object[key];
		if (!current) {
			this.object[key] = {};
			current = this.object[key];
			live_link = this.object[key];
		}

		for (var i = 1, len = arr.length; i < len; i++) {
			
			key = arr[i];
			
			current = current[key];
			if (!current) {
				live_link[key] = {};
				current = live_link[key];
			}
			
			if (i === (len - 1)) {
				if (data) live_link[key] = data;
			}
			else live_link = live_link[key];
		}
	},
	
	remote_extend : function(key, path, callback) {
		
		var _this = this;
		
		this.active_requests++;
		
		rptr.ajax.request({
			uri : path,
			json : true,
			success : function(data) {
				_this.object[key] = (callback) ? callback(data) : data;
				_this.active_requests--;
				if (!_this.active_requests) {
					if (_this.ready) _this.ready();
				}
			}
		})
	}
}
