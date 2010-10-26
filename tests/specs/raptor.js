(function() {
	
	var testee;
	
	module('Clean Array', {
		setup: function() {
			testee = ['one', '', 'two', 'three', '', 'four', 'five'];
		},
		teardown: function() {
			delete testee;
		}
	});
	
	test('Should remove blanks by default', function() {
		raptor.clean_array(testee);
		same(testee, ['one', 'two', 'three', 'four', 'five'], 'Blanks removed');
	});
	
	test('Should remove custom value', function() {
		raptor.clean_array(testee, 'three');
		same(testee, ['one', '', 'two', '', 'four', 'five'], 'three removed');
	});
	
	test('Should return original array', function() {
		testee = ['one', 'two', 'three', 'four'];
		raptor.clean_array(testee);
		same(testee, ['one', 'two', 'three', 'four'], 'Array unchanged');
	})
	
})();