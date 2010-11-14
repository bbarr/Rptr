raptor.require('raptor.epoch', function() {

module('Raptor Epoch - Date Libray');
	
	test('Find Full Month by Numeric', function() {
	
		var full_months = {
			1  : 'January',
			2  : 'February',
			3  : 'March',
			4  : 'April',
			5  : 'May',
			6  : 'June',
			7  : 'July',
			8  : 'August',
			9  : 'September',
			10 : 'October',
			11 : 'November',
			12 : 'December'
		};
		
		for (var i in full_months) {
			i = parseInt(i);
			equals(full_months[i], raptor.find_full_month(i), 'Month found correctly');
		}

	});
	
	test('Find Full Month by String', function() {
		var full_months = {
			1  : 'January',
			2  : 'February',
			3  : 'March',
			4  : 'April',
			5  : 'May',
			6  : 'June',
			7  : 'July',
			8  : 'August',
			9  : 'September',
			10 : 'October',
			11 : 'November',
			12 : 'December'
		};
		
		for (var i in full_months) {
			equals(full_months[i], raptor.find_full_month(i), 'Month found correctly');
		}	
	});
	
	test('Find Shortend Month by Numeric', function() {
		var short_months = {
			1  : 'Jan',
			2  : 'Feb',
			3  : 'Mar',
			4  : 'Apr',
			5  : 'May',
			6  : 'Jun',
			7  : 'Jul',
			8  : 'Aug',
			9  : 'Sep',
			10 : 'Oct',
			11 : 'Nov',
			12 : 'Dec'
		};
		
		for (var i in short_months) {
			equals(short_months[i], raptor.find_shortened_month(i), 'Month found correctly');
		}
	});
	
	test('Find Shortend Month by Numeric', function() {
		var short_months = {
			1  : 'Jan',
			2  : 'Feb',
			3  : 'Mar',
			4  : 'Apr',
			5  : 'May',
			6  : 'Jun',
			7  : 'Jul',
			8  : 'Aug',
			9  : 'Sep',
			10 : 'Oct',
			11 : 'Nov',
			12 : 'Dec'
		};
		
		for (var i in short_months) {
		
			i = parseInt(i);
		
			equals(short_months[i], raptor.find_shortened_month(i), 'Month found correctly');
		}
	});	

});
