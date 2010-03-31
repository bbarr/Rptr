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
		
	var xml = {
		
		/**
		* Start a parse of an xml doc
		*
		* @param {Object} XML Doc Object
		*/
		read : function(xmlDoc) {		
			// Find the root of the XML file	
			var root = xmlDoc.childNodes[0];
			var obj = xml.nodeParse(root);	
			
			return obj;
		},
		
		/**
		* Takes a node and parses it recursively
		*
		* @param {Element} Node
		*/
		nodeParse : function(node) {
			
			var jsonNode = {};
			var simpleNode = true;

			// Check to see if there are any attributes we need to parse for the node
			if(node.attributes.length > 0) {
				simpleNode = false;
				
				var attributes = node.attributes,
					length = attributes.length,
					_thisAttr;
		
				for(var i=0; i<length; i++) {
					_thisAttr = attributes[i];
					
					jsonNode[_thisAttr.nodeName] = _thisAttr.nodeValue;
				}				
			}
			
			// Check to see if it has child nodes to parse
			if(node.childNodes.length > 1) {			
				var length = node.childNodes.length,
					_thisNode;

				// Loop through child nodes
				var _thisTagName;
					blackList = new Array();
				
				for(var i=0; i<length; i++) {																		
					_thisNode = node.childNodes[i],
					_thisTagName = _thisNode.tagName;
										
					if(_thisTagName !== undefined) {	
												
						// If this tagName was already processed skip this loop iteration
						if(blackList.indexOf(_thisTagName) !== -1) {
							continue;
						}
						// Check to see if this tagName is an array and populate the array for the json object
						if(xml.isArray(_thisTagName, node)) {
							jsonNode[_thisTagName] = xml.childArrParse(_thisTagName, node);
							blackList.push(_thisTagName);
						}
						// Otherwise, just populate it normally
						else {
							jsonNode[_thisTagName] = xml.nodeParse(_thisNode);
						}
					}
					
				}
			}
			// If length was not > 1 we may have text content to parse
			else if(node.childNodes.length === 1) {
				
				if(simpleNode) {
					jsonNode = node.childNodes[0].textContent;
				}
				else {
					jsonNode['nodeValue'] = node.childNodes[0].textContent;
				}
				
			}
			
			return jsonNode;
		},
		
		/**
		* Send a tag name and parent to parse
		* all of the children of a specified type
		*
		* @param {String} Tag Name
		* @param {Object} Parent
		*/
		childArrParse : function(tagName, parent) {
			var children = parent.getElementsByTagName(tagName);
			var arr = new Array();
			
			var length = children.length,
				_thisChild;
			
			for(var i=0; i<length; i++) {
				_thisChild = children[i];
				arr.push(xml.nodeParse(_thisChild));
			}
			
			return arr;
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
				
		'readXML' : xml.read
		
	};
	
})();