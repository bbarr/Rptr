rptr.Data = function(obj) {
	this.object = obj || {};
	this.active_requests = 0;
};

rptr.Data.prototype = {
	
	trace : function(arr, data) {
		var current, store = {};
		for (var i = 0, len = arr.length; i < len; i++) {
			current = (current) ? current[arr[i]] : this.object[arr[i]];
			if (!current) {
				if (data) {
					for (var x = i, limit = len - 1; x < len; x++) {
						store = store[arr[x]] = (x === limit) ? data : {};
						if (!current) current = this.object[arr[i]] = store;
		  			}
		  			return true;
		  		}
		  		else return false;
		  	}
		  	else store = current;
		}
		return true;
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
