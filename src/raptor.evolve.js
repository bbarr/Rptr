/**
* Raptor Evolve - Because raptors need to fly too!
*
*
* @author Damian Galarza (dglrza@gmail.com)
*/

// Silently create raptor namespace
if(typeof raptor === 'undefined') {
	var raptor = {};
}

raptor.evolve = (function () {
	
	var evolve = {
		
		/**
		* Start a parse of an xml doc
		*
		* @param {Object} XML Doc Object
		*/
		readXML : function(xmlDoc) {		
			
			// Find the root of the XML file	
			var root = xmlDoc.childNodes[0];
			
			evolve.nodeParse(root);	
		},
		
		/**
		* Takes a node and parses it recursively
		*
		* @param {Element} Node
		*/
		nodeParse : function(node) {
			
			var jsonNode;
			
			// Check to see if it has child nodes
			if(node.childNodes.length > 0) {
				var length = node.childNodes.length,
					_thisNode;
				
				// Loop through child nodes
				for(var i=0; i<length; i++) {																		
					_thisNode = node.childNodes[i];
					
					if(_thisNode.tagName !== undefined) {
						if(evolve.isArray(_thisNode.tagName, node)) {
							jsonNode = new Array();
						}
					}
					
				}
			}			
		},
		
		/**
		* Check to see if there are multiple nodes with the same name in
		* parent
		*
		* @param {String} Tag Name
		* @param {Object} Parent node
		*/
		isArray : function(tagName, parent) {
			return parent.getElementsByTagName(tagName).length > 1;
		}	
	};
	
	return {
				
		'readXML' : evolve.readXML
		
	};
	
})();