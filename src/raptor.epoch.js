/**
* Raptor Epoch - Date Library
*/
(function () {
	
	// private
	var _util, _months, _short_months;
	
	// public
	var api;
	
	var _months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var _short_months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
	_util = {
		
		days_in_month : function(month, year) {
			month = month - 1;
			var m = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			if (month != 1) return m[month];
			if (year % 4 != 0) return m[1];
			if (year % 100 == 0 && year%400 != 0) return m[1];
			return m[1] + 1;
		},
		
		parse_string : function(string) {
			var parts = string.split((string.indexOf('-') > -1) ? '-' : '/');
			month = parts[0];
			
			if (parts.length === 2) year = parts[1];
			else {
				day = parts[1];
				year = parts[2];
			}
			
			if (typeof day === 'undefined') day = 1;
			
			return {
				day : parseInt(day),
				month : parseInt(month),
				year : parseInt(year)
			}
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
			if (typeof month === 'string') {
				var date = _util.parse_string(month);
				month = date.month;
				year = date.year;
			}			
			return _util.days_in_month(month, year);
		},
		
		string_to_date : function(string) {
			return _util.parse_string(string);
		}
		
	};
	
	if (raptor) raptor.extend(api);
	
})();