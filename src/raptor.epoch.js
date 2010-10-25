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
	var _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	
	_RaptorDate = function(year, month, day) {
		
		// prepare date components
		if (!month) {
			var date = (year) ? api.extract_date(year) : api.extract_date(new Date());
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
		this.value = parseInt((year + '' + month + '' + day), 10);
		this.limited = parseInt((year + '' + this.month), 10);
	}
	
	_RaptorDate.prototype = {
		
		/**
		 *	Steps back by a month, or a number of months
		 *
		 *	@param {Number} value (optional)
		 */
		step_back : function(value) {
			
			var new_value = this.value;
			value = (typeof value === 'undefined') ? 1 : value;
			
			for (var i = 0; i < value; i++) {
				new_value = new_value - 100;
				if ((new_value - this.day) % 10000 === 0) {
					new_value = (new_value - 10000) + 1200;
				}
			}
			
			this.update_components(new_value);
			this.value = new_value;
			this.limited = parseInt(new_value.toString().substr(0, 6));
		},
		
		/**
		 *	Steps forward by a month, or a number of months
		 *
		 *	@param {Number} value (optional)
		 */
		step_forward : function(value) {
		
			var new_value = this.value;
			value = (typeof value === 'undefined') ? 1 : value;
			
			for (var i = 0; i < value; i++) {
				new_value = new_value + 100;
				if (((new_value + 8700) - this.day) % 10000 === 0) {
					new_value = (new_value + 10000) - 1200;
				}
			}
			
			this.update_components(new_value);
			this.value = new_value;
			this.limited = parseInt(new_value.toString().substr(0, 6));
		},
		
		update_components : function(value) {
			var string_value = value.toString();
			this.year = parseInt(string_value.substr(0, 4), 10);
			this.month = parseInt(string_value.substr(4, 2), 10);
			this.day = parseInt(string_value.substr(6, 2), 10);
		},
		
		first_day_of_month : function() {
			return api.get_day_of_week(this.year, this.month, 1);
		}
	}
	
	api = {
		
		/**
		* Allow a user to find a 3 letter representation of a month's name
		* 
		* @param {String|Integer} Numeric representation of a month
		*/
		find_shortened_month : function(month) {
			// If a string was passed in let's turn it into a usable index
			if (typeof month === 'string') month = parseInt(month, 10);
			month = month -1;
			return _short_months[month];
		},
		
		/**
		* Allow a user to find a full month name for a month
		*
		* @param {String|Integer} Numeric Representation of the Month
		*/
		find_full_month : function(month) {
			// If a string was passed in let's turn it into a usable index
			if (typeof month === 'string') month = parseInt(month, 10);
			month = month - 1;
			return _months[month];
		},
		
		get_day_of_week : function(year, month, day) {
			var date_obj = new Date(year, month - 1, day);
			var index = date_obj.getDay();
			return {index : index, name : _days[index]};
		},
		
		get_days_in_month : function(month, year) {
			
			if (!year) {
				var date = api.extract_date(month);
				month = date.month;
				year = date.year;
			}			
			
			month = month - 1;
			var m = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			if (month !== 1) return m[month];
			if (year % 4 !== 0) return m[1];
			if (year % 100 === 0 && year % 400 !== 0) return m[1];
			return m[1] + 1;
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
				if (year.length === 2) year = '20' + year;
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
				if (object instanceof _RaptorDate) {
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