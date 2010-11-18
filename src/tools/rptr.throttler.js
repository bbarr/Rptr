rptr.Throttle = function(time) {
	this.time = time || 0;
	this.timer;
}

rptr.Throttle.prototype = {
	
	run : function() {
		
		this.timer = setTimeout(function() {
			
		}, this.time);
	}
}