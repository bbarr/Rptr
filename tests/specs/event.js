describe('RptrJS Events', function() {
	
	var div;
	
	beforeEach(function() {
		div = document.createElement('div');
		rptr.unsubscribe('an-event');
	});
	
	describe('Custom Events', function() {
		
		describe('add', function() {
			
			it('should fire event when published', function() {
				
				var fired = false;
				
				rptr.subscribe('an-event', function() {
					fired = true;
				});
				
				expect(fired).toEqual(false);
				
				rptr.publish('an-event');
				
				expect(fired).toEqual(true);
			});
			
			it('should fire event with optional minimum publish requirement', function() {
				
				var fired = false;
				
				rptr.subscribe('an-event', function() {
					fired = true;
				}, 2);
				
				expect(fired).toEqual(false);
				
				rptr.publish('an-event');
				
				// should still be false after one publish
				expect(fired).toEqual(false);
				
				rptr.publish('an-event');
				
				expect(fired).toEqual(true);
			});
			
			it('should pass custom data to subscribers', function() {
				
				var data;
				
				rptr.subscribe('an-event', function(_data) {
					data = _data;
				});
				
				rptr.publish('an-event', {'message' : 'blah'});
				
				expect(data.message).toEqual('blah');
			});
			
			it('should parse regular expressions', function() {
				
				var fired = false;
				
				rptr.subscribe('.', function() {
					fired = true;
				});
				
				expect(fired).toEqual(false);
				
				rptr.publish('a');
				
				expect(fired).toEqual(true);
				
			});
		});
	});
	
	describe('DOM Events', function() {
		
		var div;
		
		beforeEach(function() {
			div = document.createElement();
		});
		
		it('should add an event handler', function() {
			
			rptr.subscribe(div, 'click', function(e) {
				
			});
			
		});
	});
	
    describe('Delegate Events', function() {
		
	
	});

});
