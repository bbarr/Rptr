## Methods

### rptr.extend

#### Definition:
``rptr.extend(destination, source, by_value)``

#### Parameters:
* destination - {Object}  the object to extend
* source - {Object} the object to extend from
* by_value - {Boolean} should it extend by value or by reference (defaults false)

#### Usage:
<br />
    var dest = {};
    var src = {
        'a' : {
            'b' : 'c'
        }
    }
    rptr.extend(dest, src);
    => dest = {
        'a' : {


    }
    