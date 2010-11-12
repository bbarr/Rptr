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
		
		test('Do nothing if class is already applied', function() {
			el.className = 'class-one';
			same('class-one', el.className, 'Class applied');
			
			raptor.add_class('class-one', el);
			same(el.className, 'class-one', 'Nothing changed');
		});
		
	module('Add class to existing class string', {
		setup : function() {
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
		
	module('Has Class checks', {
		setup : function() {
			el_factory();
			el.className = 'class-one';
		},
		teardown : el_teardown
	});
	
		test('Check for class against single class string', function() {
			same('class-one', el.className, 'Has class applied');
			same(true, raptor.has_class('class-one', el), 'raptor found class');
		});
		
		test('Check for class against multi-class string', function() {
			el.className += ' class-two';
			same('class-one class-two', el.className, 'Has classes applied');
			same(true, raptor.has_class('class-two', el), 'raptor found class');
			same(true, raptor.has_class('class-one', el), 'raptor found class');
		});
		
		test('Return false when class is not existant and class string is empty', function() {
			delete el;
			el_factory();
			
			same(el.className, '', 'No classes applied');
			same(raptor.has_class('class-one', el), false, 'has_class returned false');
		});
		
		test('Return false when class is not existant but classes are found', function() {
			same('class-one', el.className, 'Only class-one applied');
			same(false, raptor.has_class('class-two', el), 'has_class returned false');
		});
		
	module('Remove class', {
		setup : function() {
			el_factory();
			el.className = 'class-one';
		},
		teardown : el_teardown
	});
	
		test('Remove a class from single class string', function() {
			raptor.remove_class('class-one', el);
			same('', el.className, 'Removed class');
		});
		
		test('Remove a class from a string with multiple classes', function() {
			el.className = 'class-one class-two class-three';
			same('class-one class-two class-three', el.className, 'Has 3 setup classes');
			
			raptor.remove_class('class-two', el);
			same('class-one class-three', el.className, 'Removed class-one');
			
			raptor.remove_class('class-one', el);
			same('class-three', el.className, 'Removed class-three');
		});
		
		test('Do nothing if class does not exist', function() {
			raptor.remove_class('class-two', el);
			same('class-one', el.className, 'Nothing removed');
		});
		
		test('Fail gracefully if no classes are applied', function() {
			delete el;
			el_factory();
			
			same(el.className, '', 'No classes applied');
			
			raptor.remove_class('class-one', el);
			same(el.className, '', 'Nothing done');
		});
});