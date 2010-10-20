raptor.require('raptor.pack', function() {
	
	var el;
	
	// DOM Element Factory / Tear Down methods
	var el_factory = function() { el = document.createElement('div'); }
	var el_teardown = function () { delete el; }
	
	module('Add class to empty class string', {
		setup : el_factory,
		teardown : el_teardown
	});
			
		test('Add single class to empty class string', function() {		
			// Ensure clean class string
			same('', el.className, 'El should have no class on it');
	
			raptor.add_class('my-class', el);
	
			// Test application of single class name
			same('my-class', el.className, 'El should have single class on it, no spaces');
		});
	
		test('Add multiple classes to empty class string', function() {		
			// Ensure clean class string
			same('', el.className, 'El should have no class on it');
		
			raptor.add_class('my-class', el);
			raptor.add_class('class-two', el);
			raptor.add_class('class-three', el);
		
			same('my-class class-two class-three', el.className, 'El should have 3 classes on it, correctly formatted.');
		});
	
	module('Add class to existing class string', {
		setup : function () {
			el_factory();
			el.className = 'original-class';
		},
		teardown : el_teardown
	});
	
		test('Add single class to existing single class string', function() {
			same('original-class', el.className, 'El should have a class predefined');
			raptor.add_class('new-class', el);
			same('original-class new-class', el.className, 'El should have original AND new class');
		});
	
		test('Add single class to existing, multi-class string', function() {
			// Add one more class to the string
			el.className += ' original-two';
			same('original-class original-two', el.className, 'El should have 2 classes predefined');
		
			raptor.add_class('new-class', el);
			same('original-class original-two new-class', el.className, 'El should have original 2 classes PLUS new class name');
		});
	
		test('Add multiple classes to single, existing class string', function() {	
			same('original-class', el.className, 'El has single, pre-existing class');
			raptor.add_class('new-class', el);
			same('original-class new-class', el.className, 'El should have original class and new one');
		});
	
		test('Add multiple classes to an existing multi-class string', function() {
			el.className += ' original-two';
			raptor.add_class('new-class-one', el);
			raptor.add_class('new-class-two', el);
			same('original-class original-two new-class-one new-class-two', el.className, 'El should have original classes plus the 2 new ones');
		});
	
});