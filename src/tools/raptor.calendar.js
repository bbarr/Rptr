
raptor.Calendar = function(id, config) {
	
	config = config || {};
	this.template = config.template;
	this.current_date = new raptor.Date();
	this.active_date = new raptor.Date(this.current_date);
}

raptor.Calendar.prototype = {
	
	_get_days : function() {
		
		var days = [], active_date = this.active_date;
		
		// current month props
		var curr_total = raptor.get_days_in_month(this.active_date.month, this.active_date.year);
		var curr_start = this.active_date.first_day_of_month().index;
		
		// previous month props
		var pre_month = new raptor.Date(this.active_date.year, this.active_date.month - 1, this.active_date.day);
		var pre_total = raptor.get_days_in_month(pre_month.month, pre_month.year);
		
		// build pre-days
		for (var i = pre_total - curr_start; i <= pre_total; i++) days.push({ date : i, out_of_range : true , date_combine : active_date.year + active_date.month + (i < 10) ? '0' + i : i });
		
		// build days
		for (i = 1; i <= curr_total; i++) days.push({ date : i, date_combine : active_date.year + active_date.month + (i < 10) ? '0' + i : i });
		
		// build post-days
		for (i = 1; days.length < 42; i++) days.push({ date : i, out_of_range : true, date_combine : active_date.year + active_date.month + (i < 10) ? '0' + i : i });

		return days;
	},
	
	build : function() {
		var days = this._get_days();
		if (this.template) return this.template(days, this);
		else return days;
	},
	
	step_back : function(steps) {
		this.active_date.step_back(steps);
	},
	
	step_forward : function(steps) {
		this.active_date.step_forward(steps);
	},
	
	set_date : function(date) {
		this.active_date = new raptor.Date(date);
	}
}