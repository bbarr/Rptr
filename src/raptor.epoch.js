/**
* Raptor Epoch - Date Library
*/
(function () {
	
	// private
	var _util, _months, _short_months;
	
	// public
	var api;
	
	var _months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var _short_months ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
	util = {
	
	}
	
	api = {
		
		/**
		* Allow a user to find a 3 letter representation of a month's name
		* 
		* @param {String|Integer} Numeric representation of a month
		*/
		find_shortened_month : function (month) {
			
			// If a string was passed in let's turn it into a usable index
			if (typeof month === 'String') month = parseInt(month, 10) - 1;
			return _short_months[month];
		}
		
	}
	
	if (raptor) raptor.extend(api);
	
})();