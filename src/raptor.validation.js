raptor.validation = (function() {
	
	var Validation = function(config) {
		
		var name = this.name = config.name;
		
		if (name.charAt(name.length - 1) === '-') {
			var inputs = [];
			for (var i = 1; i == i; i++) {
				var input = raptor.pack.hunt('*[name=' + name + i + ']')[0];
				if (input) inputs.push(input);
			}
			this.inputs = inputs;
		}
		else this.input = raptor.pack.hunt('*[name=' +  config.);
		
		
		
		
	};
	
	return api = {
		init : function(config) {
			
			var validations = {};
			
			for (var i in config) {
				var rules = config[i];
				rules.name = i;
				validations[i] = new Validation(rules);
			}
		
			return validations;
		}
	}
})();






raptor.validation.init({
	'test-text-' : {
		'action' : 'blur',
		'error' : 'this is the master error handler',
		'tests' : [
			{
				'test' : 'required',
				'error' : 'this is error text'
			},
			{
				'test' : 'numeric'
				// because this excludes an error property, it will use the master error on failure
			},
			{
				'test' : function(input) {
					//this can test the thing
				},
				'error' : 'this is other text'
			},
			{
				'test' : ['numeric_range=1..3', 'length=1..10'],
				'error' : function() {
					// this can do some sort of craziness on failure
				}
			}
		]
	}
});