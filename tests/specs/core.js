
describe('core', function() {
    
    describe('extend', function() {
        
        // source object
        var source;
        
        // object to extend
        var destination;
        
        // setup defaults
        beforeEach(function() {
            
            source = {
                'a' : {
                    'b' : 'property'
                }
            };
            
            destination = {};
        });
        
        /**
         *  DEFAULT USE
         */
        it('should cause an empty object to be equal to the object that extends it', function() {
            rptr.extend(destination, source);
            expect(destination).toEqual(source);
        });
        
        it('should NOT override properties if they already exist', function() {
            var prop = 'should NOT be overridden';
            destination.a = prop;
            rptr.extend(destination, source);
            expect(destination.a).toBe(prop);
        });
        
        it('should pass objects by value, not reference', function() {
            rptr.extend(destination, source);
            var new_prop = 'new property';
            source.a.b = new_prop;
            expect(destination.a.b).not.toBe(new_prop);
        });
        
        /**
         *  WITH 'reference' OPTION
         */
        it('should pass objects by reference when "reference" option is passed', function() {
            rptr.extend(destination, source);
            var new_prop = 'new property';
            source.a.b = new_prop;
            expect(destination.a.b).toBe(new_prop);
        });
    });
   
   
});