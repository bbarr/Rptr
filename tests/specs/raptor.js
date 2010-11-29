(function() {
	
	var testee;
	
	module('Array Prototypes', {
		setup: function() {
			testee = ['one', 'two', 'three', 'four', 'five'];
		},
		teardown: function () { delete testee; }
	});
	
	test('Should return the index of the item in an array', function() {
		var index = testee.indexOf('one');
		same(index, 0, 'Found index 0 for one');
		
		index = testee.indexOf('two');
		same(index, 1, 'Found index 1 for two');
		
		index = testee.indexOf('three');
		same(index, 2, 'Found index 2 for three');
		
		index = testee.indexOf('four');
		same(index, 3, 'Found index 3 for four');
		
		index = testee.indexOf('five');
		same(index, 4, 'Found index 4 for five');
	});
	
	test('Should return -1 when an item is not found', function() {
		var index = testee.indexOf('eleven');
		same(index, -1, 'Item not found');
	});
	
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
	});
	
})();