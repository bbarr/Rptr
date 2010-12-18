
describe('RptrJS core methods', function() {
    
    describe('object manipulation', function() {
        
        var source, destination;
            
        beforeEach(function() {
            
            source = {
                'a' : {
                    'b' : 'property'
                }
            };
            
            destination = {};
        });
        
        describe('extend', function() {
    
            it('should cause an empty object to be equal to the object that extends it', function() {
                rptr.extend(destination, source);
                expect(destination).toEqual(source);
            });
            
            it('should override properties if they already exist', function() {
                var prop = 'should be overridden';
                destination.a = prop;
                rptr.extend(destination, source);
                expect(destination.a).toEqual(source.a);
            });
            
            it('should pass objects by reference', function() {
                rptr.extend(destination, source);
                var new_prop = 'new property';
                source.a.b = new_prop;
                expect(destination.a.b).toBe(new_prop);
            });
            
            it('should pass objects by value when final argument is true', function() {
                rptr.extend(destination, source, true);
                var new_prop = 'new property';
                source.a.b = new_prop;
                expect(destination.a.b).not.toBe(new_prop);
            });
        });
        
        describe('merge', function() {
            
            it('should not replace values if they already exist', function() {
                var prop = 'should NOT be overriden';
                destination.a = prop;
                rptr.merge(destination, source);
                expect(destination.a).toBe(prop);
            });
        });
        
        describe('branch', function() {
            
            it('should return property if the value exists', function() {
                var result = rptr.branch(source, ['a', 'b']);
                expect(result).toBe(source.a.b);
            });
            
            it('should return false if the value does not exist', function() {
               var result = rptr.branch(destination, ['a', 'b']);
               expect(result).toBe(false);
            });
            
            it('should create branch and insert data, if data is passed as final argument', function() {
                var data = 'this was inserted';
                rptr.branch(source, ['a', 'b'], data);
                expect(source.a.b).toBe(data);
            });
			
			it('should work with array of only 1', function() {
				var result = rptr.branch(destination, ['a']);
				expect(result).toBe(false);
				result = rptr.branch(source, ['a']);
				expect(result).toBe(source.a);
			});
            
        });
        
        describe('remote_extend', function() {
            
            it('should populate property with remote resource', function() {                
                
                var ready = false;
                
                rptr.remote_extend({
                    destination : destination,
                    new_property : 'new_property',
                    url : '/tests/remote/remote_extend.json',
                    callback : function() {
                        ready = true;
                    }
                });
                
                waitsFor(function() {
                    return ready;
                }, 'remote resource never returned', 1000);
                
                runs(function() {
                    expect(destination.new_property).toBeDefined();
                });
            });
        });
    });
    
    describe('type', function() {
        
        it('should detect type passed as string', function() {
            
            expect(rptr.type('Object', {})).toEqual(true);
            expect(rptr.type('Array', [])).toEqual(true);
            expect(rptr.type('String', '')).toEqual(true);
            expect(rptr.type('Number', 5)).toEqual(true);
            expect(rptr.type('Boolean', false)).toEqual(true);
        });
        
        it('should detect types passed as array', function() {
           
            var types = ['Object', 'Array', 'Number'];
           
            expect(rptr.type(types, '')).toEqual(false);
            expect(rptr.type(types, {'a' : 'b'})).toEqual(true);
        });
        
        it('should not pass an HTMLElement as "Object"', function() {
            var div = document.createElement('div');
            expect(rptr.type('Object', div)).toEqual(false);
        });
    });
    
    describe('throttle', function() {
       
        it('should only allow function to be called once per interval', function() {
                
            var i = 0;    
                
            var trigger = function() {
                rptr.throttle('test', 1000, function() {
                    i++;
                });
            };
            
            // try 3 times over the course of 400ms... should only work the first time
            runs(function() {
                trigger();
                expect(i).toEqual(1);
            });
            waits(200);
            runs(function() {
                trigger();
                expect(i).toEqual(1);
            });
            waits(200);
            runs(function() {
                trigger();
                expect(i).toEqual(1);
            });
            
            // now wait a full second and try 3 times again.. should only work the first time again
            waits(1000);
            
            runs(function() {
                trigger();
                expect(i).toEqual(2);
            });
            waits(200);
            runs(function() {
                trigger();
                expect(i).toEqual(2);
            });
            waits(200);
            runs(function() {
                trigger();
                expect(i).toEqual(2);
            });
            
        });
    });
   
    describe('tool', function() {
        
        it('creates an object for holding tools, and adds new tool', function() {
            expect(rptr.tools).not.toBeDefined();
            var new_helper = function() {};
            rptr.tool('example', new_helper);
            expect(rptr.tools).toBeDefined();
            expect(rptr.tools.example).toBeDefined();
            expect(rptr.tools.example).toBe(new_helper);
        });
    });
    
    describe('object_empty', function() {
        
        it('should return true if object is empty and false if not', function() {
            var obj = {};
            expect(rptr.object_empty(obj)).toEqual(true);
            obj.a = {};
            expect(rptr.object_empty(obj)).toEqual(false);
            expect(rptr.object_empty(obj.a)).toEqual(true);
        });
    });
    
    describe('object_length', function() {
       
        it('should return the number of properties at the base level of object', function() {
            var obj = {};
            expect(rptr.object_length(obj)).toEqual(0);
            obj.a = {};
            expect(rptr.object_length(obj)).toEqual(1);
        });
        
        it('should ignore inherited properties in prototype object', function() {
            var parent = {'a' : 'b'}
            var Child = function() { this.prop = 'foo' };
            Child.prototype = parent;
            expect(rptr.object_length(new Child())).toEqual(1);
        });
    });
    
    describe('require', function() {
    
        var ready;
        rptr.config.scripts.set_base_path('/tests/remote/');
        
        beforeEach(function() {
            window.rptr_require_success = 0;
            ready = false;
        });
        
        it('should load a single script', function() {
            
            rptr.require('require', function() {
                ready = true;
            });
            
            waitsFor(function() {
               return ready;
            }, 'waiting for require to work', 1000);
            
            runs(function() {
                expect(window.rptr_require_success).toEqual(1); 
            });
        });
        
        it('should load multiple scripts.. first one is cached already!', function() {
            
            rptr.require(['require', 'require-2'], function() {
                ready = true;
            });
            
            waitsFor(function() {
                return ready;
            }, 'waiting for require x2 to work', 1000);
            
            runs(function() {
               expect(window.rptr_require_success).toEqual(1); 
            });
        });
        
    });
});