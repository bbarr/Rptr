/**
* Raptor Epoch - Date Library
*/
(function () {
	
	// private
	var _util, _months, _short_months, _RaptorDate;
	
	// public
	var api;
	
	var _months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var _short_months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
	_RaptorDate = function(year, month, day) {
		
		// prepare date components
		if (!month) {
			var date = api.extract_date(year);
			month = date.month;
			year = date.year;
			day = date.day;
		}
		else if (!day) day = 1;
		
		// components
		this.day = day;
		this.year = year;
		this.month = month;
		
		// combines
		if (month < 10) year = year * 10;
		if (day < 10) month = month * 10;
		this.combine = parseInt((year + '' + month + '' + day), 10);
		
		if (month > 12) month = month / 10;
		this.limited_combine = parseInt((year + '' + month), 10);
	}
	
	_RaptorDate.prototype = {
		
		/**
		 *	Steps back by a month, or a number of months
		 *
		 *	@param {Number} value (optional)
		 */
		step_back : function(value) {
			
			var new_value = this.combine;
			value = value || 1;
			
			for (var i = 0; i < value; i++) {
				new_value = new_value - 100;
				if ((new_value - this.day) % 10000 === 0) {
					new_value = (new_value - 10000) + 1200;
				}
			}
			
			this.update_components(new_value);
			this.combine = new_value;
			this.limited_combine = parseInt(new_value.toString().substr(0, 6));
		},
		
		/**
		 *	Steps forward by a month, or a number of months
		 *
		 *	@param {Number} value (optional)
		 */
		step_forward : function(value) {
		
			var new_value = this.combine;
			value = value || 1;
			
			for (var i = 0; i < value; i++) {
				new_value = new_value + 100;
				if (((new_value + 8700) - this.day) % 10000 === 0) {
					new_value = (new_value + 10000) - 1200;
				}
			}
			
			this.update_components(new_value);
			this.combine = new_value;
			this.limited_combine = parseInt(new_value.toString().substr(0, 6));
		},
		
		update_components : function(value) {
			var string_value = value.toString();
			this.year = parseInt(string_value.substr(0, 4), 10);
			this.month = parseInt(string_value.substr(4, 2), 10);
			this.day = parseInt(string_value.substr(6, 2), 10);
		}
	}
	
	_util = {
		
		days_in_month : function(month, year) {
			month = month - 1;
			var m = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			if (month !== 1) return m[month];
			if (year % 4 !== 0) return m[1];
			if (year % 100 === 0 && year % 400 !== 0) return m[1];
			return m[1] + 1;
		}
	};
	
	api = {
		
		/**
		* Allow a user to find a 3 letter representation of a month's name
		* 
		* @param {String|Integer} Numeric representation of a month
		*/
		find_shortened_month : function (month) {
			// If a string was passed in let's turn it into a usable index
			if (typeof month === 'string') month = parseInt(month, 10) - 1;
			return _short_months[month];
		},
		
		get_days_in_month : function(month, year) {
			if (!year) {
				var date = _util.extract_date(month);
				month = date.month;
				year = date.year;
			}			
			return _util.days_in_month(month, year);
		},
		
		extract_date : function(date) {
			
			var month, day, year;
			
			var _handle_string = function(string) {
				var parts = string.split((string.indexOf('-') > -1) ? '-' : '/');
				month = parts[0];
				if (parts.length === 2) year = parts[1];
				else {
					day = parts[1];
					year = parts[2];
				}
			}
			
			var _handle_combine_value = function(number) {
				string = number.toString();
				if (string.length === 6) {
					year = string.substr(0, 4);
					month = string.substr(4, 2);
				}
				else {
					year = string.substr(0, 4);
					month = string.substr(4, 2);
					day = string.substr(6, 2);
				}
			}
			
			var _handle_date_object = function(object) {
				if (object instanceof RaptorDate) {
					year = object.year;
					month = object.month;
					day = object.day;
				}
				else if (object instanceof Date) {
					year = object.getFullYear();
					month = object.getMonth() + 1;
					day = object.getDate();
				}
			}
			
			// detect data format for date argument and call appropriate function
			switch(typeof date) {
				case 'string' : 
					_handle_string(date);
					break;
				case 'number' : 
					_handle_combine_value(date);
					break;
				default : _handle_date_object(date);
			}
			
			// if no month defined, something went horribly awry
			if (typeof month === 'undefined') return false;
			
			// make sure day is defined, defaults to first day of the month
			if (typeof day === 'undefined') day = 1;
			
			// finally, return an object of detected values
			return {
				day : parseInt(day, 10),
				month : parseInt(month, 10),
				year : parseInt(year, 10)
			}
		},
		
		Date : _RaptorDate
		
	};
	
	if (raptor) raptor.extend(api);
	
})();