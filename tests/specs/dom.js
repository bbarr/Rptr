describe('RptrJS DOM methods', function() {
    
    describe('build', function() {
       
        it('should return a simple element, without content or attributes', function() {
            expect(rptr.build('div').tagName).toEqual('DIV');
        });
        
        it('should return an element with attributes', function() {
            var id = 'an_id';
            var div = rptr.build('div', {'id' : id});
            expect(div.getAttribute('id')).toBe(id);
        });
        
        it('should return an element with one child', function() {
            var p = rptr.build('p');
            var div = rptr.build('div', p);
            expect(div.getElementsByTagName('p')[0]).toEqual(p);
        });
        
        it('should return an element with multiple children and strings', function() {
            
            var p = rptr.build('p', {'class' : 'content'}, 'this and that');
            var div = rptr.build('div', {'id' : 'wrapper'}, [
                p,
                4,
                'blah'
            ]);
            
            expect(div.getElementsByTagName('p')[0]).toBe(p);
            expect(div.innerHTML.indexOf('4blah')).toBeGreaterThan(-1);
        });
        
        it('should populate a docfrag when fourth argument is string', function() {
           var div = rptr.build('div', {'id' : 'blah'}, 'a div', 'doc-frag');
           expect(rptr.fragment('doc-frag')).toBeTruthy();
        });
        
        it('should properly handle encoded strings', function() {
           var string = 'an HTML Entity &amp; such';
           var div = rptr.build('div', string);
           expect(div.innerHTML).toEqual(string);
        });
    });
    
    describe('manage classes', function() {
       
        var div = document.createElement('div');
        var container = document.createElement('div');
        var child_a = document.createElement('p');
        var child_b = document.createElement('p');
        container.appendChild(child_a);
        container.appendChild(child_b);
        var div_set = container.getElementsByTagName('p');
       
        beforeEach(function() {
            div.className = '';
            div_set[0].className = '';
            div_set[1].className = '';
        });
       
        describe('add_class', function() {
            
            it('should add a class to one or many elements', function() {
                   // single
                rptr.add_class('a-class', div);
                expect(div.className).toEqual('a-class');
                rptr.add_class('b-class', div);
                expect(div.className).toEqual('a-class b-class');
                
                // array
                rptr.add_class('a-class', div_set);
                expect(div_set[0].className).toEqual('a-class');
                expect(div_set[1].className).toEqual('a-class');
                rptr.add_class('b-class', div_set);
                expect(div_set[0].className).toEqual('a-class b-class');
                expect(div_set[1].className).toEqual('a-class b-class'); 
            });
        });
        
        describe('has_class', function() {

            it('should confirm class on one or many elements', function() {
                rptr.add_class('a-class', div);
                rptr.add_class('b-class', div_set);
                expect(rptr.has_class('a-class', div)).toEqual(true);
                expect(rptr.has_class('b-class', div)).toEqual(false);
                expect(rptr.has_class('a-class', div_set)).toEqual(false);
                expect(rptr.has_class('b-class', div_set)).toEqual(true);    
            });
        });
		
        describe('remove_class', function() {

            it('should remove class on one or many elements', function() {
                
                // add prelim
                rptr.add_class('a-class', div);
                rptr.add_class('another-a-class', div);
                rptr.add_class('b-class', div_set);
                
                // confirm prelim
                expect(div.className).toEqual('a-class another-a-class');
                expect(div_set[0].className).toEqual('b-class');
                expect(div_set[1].className).toEqual('b-class');
                
                //
                rptr.remove_class('a-class', div);
                rptr.remove_class('b-class', div_set);
                
                expect(div.className).toEqual('another-a-class');
                expect(div_set[0].className).toEqual('');
                expect(div_set[1].className).toEqual('');
            });
        });
        
        describe('style', function() {
           
            it('should set inline styles on an element', function() {
                rptr.style({
                    'height' : '300px',
                    'position' : 'absolute'
                }, div);
                expect(div.style.height).toEqual('300px');
                expect(div.style.position).toEqual('absolute');
            });
        });
    });
});