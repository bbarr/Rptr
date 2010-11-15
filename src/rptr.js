/*

	Copyright (c) 2010 Brendan Barr, Damian Galarza, http://www.raptorjs.com

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

var rptr = (function() {
	
	var config, api, core, dom, events, ajax;
	
	config = (function() {
		
		var api = {
			version : '1.0',
			scripts : {
				loaded : [],
				rptr_path : '',
				base_path : '',
				set_base_path : function(path) { api.scripts.base_path = path }
			}
		}
		
		//  Determine where the core file is located, and store the URI prefix
		var scripts = document.getElementsByTagName("script");

		for (var i = 0, len = scripts.length, rptr_path, src; i < len; i++) {				
			src = scripts[i].src;
			if (src.match(/rptr\.js/)) {
				rptr_path = src.replace(/rptr\.js$/, '');				
			}
		}

		api.base_path = api.rptr_path = rptr_path;
		
		return api;
	})();
	
	core = {
		
		/**
		 *  Deep extend of destination.
		 *  If no source, destination is added to rptr api.
		 *
		 *  @param {Object} destination
		 *  @param {Object} (optional) source
		 *  @returns the merged destination object
		 */
		extend : function(destination, source) {
			
			if (!source) {
				source = destination;
				destination = api;
			}
			
			for (var prop in source) {
				var curr = source[prop];
				if (core.type('Object', curr)) {
					core.extend(source[prop], curr);
				}
				else destination[prop] = curr;
			}
			
			return destination;
		},
		
		/**
		 * Tests for data type by constructor name
		 * 
		 * @param {Array|String} types
		 * @param {*} data
		 */
		type : function(types, data) {
			
			var match = false;
			
			var test = function(type) {
				switch(type) {
					case 'Object':
						if (typeof data === 'object' && !data.length && data && data.constructor) match = true;
						break;
					case 'HTMLElement':
						if (data.tagName) match = true;
						break;
					default:
						try { if (data.constructor && data.constructor.toString().indexOf(type) !== -1) match = true }
						catch (e) { new raptor.Error(e) }
				}
			}
			
			if (typeof types === 'string') test(types);
			else for (var i = 0; i < types.length && !match; i++) test(types[i]);
			
			return match;
		},
	
		/**
		 *  Dynamic JavaScript loader
		 *
		 *  @param {Array|String} Scripts to load
		 *  @param {Function} Callback to execute after loading modules
		 */
		require : function(modules, callback) {		
			
			var _cache = {};
			
            var _util = {
                
                /**
                * Create a new script tag for this module
                *
                * @param {String} Module Path
                */
                create_script : function(module) {
                    var load_path = (module.indexOf('rptr.') > -1) ? config.scripts.rptr_path : config.scripts.base_path;
					load_path += (module + 'js');
                    var script = dom.build('script', { type : 'text/javascript', src : load_path });
					config.scripts.loaded.push(module);
                    return script;
                },
                
                /**
                * Monitor load completion of a script
                * attaches either an onreadystatechange or onload method
                * to the script depending on browser support
                *
                * Once a script is loaded the script_loaded method will
                * be called
                *
                * @param {HTMLElement} Script we're loading onto the page
                */
                monitor_completion : function(script) {
                    if (script.readyState) {
                        _util.monitor_completion = function(script) {
                            script.onreadystatechange = function() {
                                if (script.readyState === 'loaded' || script.readyState === 'complete') {
									_util.script_loaded();
                                }
                            }
                        }
					}
					else {
                        _util.monitor_completion = function(script) {
                            script.onload = function() {
								_util.script_loaded();
                            }
                        };
					}
					
					_util.monitor_completion(script);
                },
                
                /**
                * Method called once a script is finished loading to
                * handle callback and queueing if necessary
                */
                script_loaded : function() {
					
                    // If we're loading many scripts we need to fire off the script_loaded method
                    // in order to handle the queue and execute the callback for the queue once
                    // all modules have been loaded
                    if (_cache.loading_many) {
                        _util.script_loaded = function() { raptor.alarm('script_loaded') };
                        _util.script_loaded();
                    }
                    // Otherwise just run the callback now that the single script is ready
                    else if (callback) callback();
                }
                
            };

            /**
            * Load in a single module
            *
            * @param {String} Module Path
            */
		    var _load_single = function(module) {
		        // Check and ensure that a module was not already loaded before
		        // if it was, make sure to run the script_loaded event
		        // to properly continue the queue progress and leave
		        if (_config.loaded_scripts.indexOf(module) > -1) {
                    _util.script_loaded();
		            return;
		        }     
                
                // Create the script for this module
		        var script = _util.create_script(module);
		        
		        // Setup the load monitoring method and append the script to the page
                _util.monitor_completion(script);
                
				var head = _cache.head;
				if (!head) head = _cache.head = document.getElementsByTagName('head')[0];
                head.appendChild(script);
		    }
            
            /**
            * Handle loading many modules at once, creating a 
            * queue to run through and load each one individually
            * executing the callback once ALL modules are ready
            *
            * @param {Array} Modules to load
            */
		    var _load_many = function(modules) {
				
		        var loading_many = _cache.loading_many = true;
		        var modules_length = modules.length;
		        
		        // Event to fire the callback once we're sure all
		        // modules in the array have been loaded
		        raptor.lash('script_loaded', function(e) {
					callback();
		            raptor.unlash('script_loaded');
		        }, modules_length);
		        
		        // Loop through and load modules one at a time
		        for(var i=0; i < modules_length; i++) _load_single(modules[i]);
		    }
            
		    if (typeof modules === 'string') _load_single(modules);
		    else {
		        if (!raptor.lash) api.require('raptor.events', function() { api.require(modules, callback)});
		        else _load_many(modules);
		    }
		},
	}
	
	dom = (function() {
		
		
		/*

			INCLUDES SIZZLE SELECTOR ENGINE:

		 	Copyright (c) 2009 John Resig
			Permission is hereby granted, free of charge, to any person obtaining a copy
			of this software and associated documentation files (the "Software"), to deal
			in the Software without restriction, including without limitation the rights
			to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
			copies of the Software, and to permit persons to whom the Software is
			furnished to do so, subject to the following conditions:

			The above copyright notice and this permission notice shall be included in
			all copies or substantial portions of the Software.

			THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
			IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
			FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
			AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
			LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
			OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
			THE SOFTWARE.
		*/

		(function(){var chunker=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,done=0,toString=Object.prototype.toString,hasDuplicate=false,baseHasDuplicate=true;[0,0].sort(function(){baseHasDuplicate=false;return 0;});var Sizzle=function(selector,context,results,seed){results=results||[];context=context||document;var origContext=context;if(context.nodeType!==1&&context.nodeType!==9){return[];}if(!selector||typeof selector!=="string"){return results;}var parts=[],m,set,checkSet,extra,prune=true,contextXML=Sizzle.isXML(context),soFar=selector,ret,cur,pop,i;do{chunker.exec("");m=chunker.exec(soFar);if(m){soFar=m[3];parts.push(m[1]);if(m[2]){extra=m[3];break;}}}while(m);if(parts.length>1&&origPOS.exec(selector)){if(parts.length===2&&Expr.relative[parts[0]]){set=posProcess(parts[0]+parts[1],context);}else{set=Expr.relative[parts[0]]?[context]:Sizzle(parts.shift(),context);while(parts.length){selector=parts.shift();if(Expr.relative[selector]){selector+=parts.shift();}set=posProcess(selector,set);}}}else{if(!seed&&parts.length>1&&context.nodeType===9&&!contextXML&&Expr.match.ID.test(parts[0])&&!Expr.match.ID.test(parts[parts.length-1])){ret=Sizzle.find(parts.shift(),context,contextXML);context=ret.expr?Sizzle.filter(ret.expr,ret.set)[0]:ret.set[0];}if(context){ret=seed?{expr:parts.pop(),set:makeArray(seed)}:Sizzle.find(parts.pop(),parts.length===1&&(parts[0]==="~"||parts[0]==="+")&&context.parentNode?context.parentNode:context,contextXML);set=ret.expr?Sizzle.filter(ret.expr,ret.set):ret.set;if(parts.length>0){checkSet=makeArray(set);}else{prune=false;}while(parts.length){cur=parts.pop();pop=cur;if(!Expr.relative[cur]){cur="";}else{pop=parts.pop();}if(pop==null){pop=context;}Expr.relative[cur](checkSet,pop,contextXML);}}else{checkSet=parts=[];}}if(!checkSet){checkSet=set;}if(!checkSet){Sizzle.error(cur||selector);}if(toString.call(checkSet)==="[object Array]"){if(!prune){results.push.apply(results,checkSet);}else if(context&&context.nodeType===1){for(i=0;checkSet[i]!=null;i++){if(checkSet[i]&&(checkSet[i]===true||checkSet[i].nodeType===1&&Sizzle.contains(context,checkSet[i]))){results.push(set[i]);}}}else{for(i=0;checkSet[i]!=null;i++){if(checkSet[i]&&checkSet[i].nodeType===1){results.push(set[i]);}}}}else{makeArray(checkSet,results);}if(extra){Sizzle(extra,origContext,results,seed);Sizzle.uniqueSort(results);}return results;};Sizzle.uniqueSort=function(results){if(sortOrder){hasDuplicate=baseHasDuplicate;results.sort(sortOrder);if(hasDuplicate){for(var i=1;i<results.length;i++){if(results[i]===results[i-1]){results.splice(i--,1);}}}}return results;};Sizzle.matches=function(expr,set){return Sizzle(expr,null,null,set);};Sizzle.find=function(expr,context,isXML){var set;if(!expr){return[];}for(var i=0,l=Expr.order.length;i<l;i++){var type=Expr.order[i],match;if((match=Expr.leftMatch[type].exec(expr))){var left=match[1];match.splice(1,1);if(left.substr(left.length-1)!=="\\"){match[1]=(match[1]||"").replace(/\\/g,"");set=Expr.find[type](match,context,isXML);if(set!=null){expr=expr.replace(Expr.match[type],"");break;}}}}if(!set){set=context.getElementsByTagName("*");}return{set:set,expr:expr};};Sizzle.filter=function(expr,set,inplace,not){var old=expr,result=[],curLoop=set,match,anyFound,isXMLFilter=set&&set[0]&&Sizzle.isXML(set[0]);while(expr&&set.length){for(var type in Expr.filter){if((match=Expr.leftMatch[type].exec(expr))!=null&&match[2]){var filter=Expr.filter[type],found,item,left=match[1];anyFound=false;match.splice(1,1);if(left.substr(left.length-1)==="\\"){continue;}if(curLoop===result){result=[];}if(Expr.preFilter[type]){match=Expr.preFilter[type](match,curLoop,inplace,result,not,isXMLFilter);if(!match){anyFound=found=true;}else if(match===true){continue;}}if(match){for(var i=0;(item=curLoop[i])!=null;i++){if(item){found=filter(item,match,i,curLoop);var pass=not^!!found;if(inplace&&found!=null){if(pass){anyFound=true;}else{curLoop[i]=false;}}else if(pass){result.push(item);anyFound=true;}}}}if(found!==undefined){if(!inplace){curLoop=result;}expr=expr.replace(Expr.match[type],"");if(!anyFound){return[];}break;}}}if(expr===old){if(anyFound==null){Sizzle.error(expr);}else{break;}}old=expr;}return curLoop;};Sizzle.error=function(msg){throw"Syntax error, unrecognized expression: "+msg;};var Expr=Sizzle.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+\-]*)\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(elem){return elem.getAttribute("href");}},relative:{"+":function(checkSet,part){var isPartStr=typeof part==="string",isTag=isPartStr&&!/\W/.test(part),isPartStrNotTag=isPartStr&&!isTag;if(isTag){part=part.toLowerCase();}for(var i=0,l=checkSet.length,elem;i<l;i++){if((elem=checkSet[i])){while((elem=elem.previousSibling)&&elem.nodeType!==1){}checkSet[i]=isPartStrNotTag||elem&&elem.nodeName.toLowerCase()===part?elem||false:elem===part;}}if(isPartStrNotTag){Sizzle.filter(part,checkSet,true);}},">":function(checkSet,part){var isPartStr=typeof part==="string",elem,i=0,l=checkSet.length;if(isPartStr&&!/\W/.test(part)){part=part.toLowerCase();for(;i<l;i++){elem=checkSet[i];if(elem){var parent=elem.parentNode;checkSet[i]=parent.nodeName.toLowerCase()===part?parent:false;}}}else{for(;i<l;i++){elem=checkSet[i];if(elem){checkSet[i]=isPartStr?elem.parentNode:elem.parentNode===part;}}if(isPartStr){Sizzle.filter(part,checkSet,true);}}},"":function(checkSet,part,isXML){var doneName=done++,checkFn=dirCheck,nodeCheck;if(typeof part==="string"&&!/\W/.test(part)){part=part.toLowerCase();nodeCheck=part;checkFn=dirNodeCheck;}checkFn("parentNode",part,doneName,checkSet,nodeCheck,isXML);},"~":function(checkSet,part,isXML){var doneName=done++,checkFn=dirCheck,nodeCheck;if(typeof part==="string"&&!/\W/.test(part)){part=part.toLowerCase();nodeCheck=part;checkFn=dirNodeCheck;}checkFn("previousSibling",part,doneName,checkSet,nodeCheck,isXML);}},find:{ID:function(match,context,isXML){if(typeof context.getElementById!=="undefined"&&!isXML){var m=context.getElementById(match[1]);return m?[m]:[];}},NAME:function(match,context){if(typeof context.getElementsByName!=="undefined"){var ret=[],results=context.getElementsByName(match[1]);for(var i=0,l=results.length;i<l;i++){if(results[i].getAttribute("name")===match[1]){ret.push(results[i]);}}return ret.length===0?null:ret;}},TAG:function(match,context){return context.getElementsByTagName(match[1]);}},preFilter:{CLASS:function(match,curLoop,inplace,result,not,isXML){match=" "+match[1].replace(/\\/g,"")+" ";if(isXML){return match;}for(var i=0,elem;(elem=curLoop[i])!=null;i++){if(elem){if(not^(elem.className&&(" "+elem.className+" ").replace(/[\t\n]/g," ").indexOf(match)>=0)){if(!inplace){result.push(elem);}}else if(inplace){curLoop[i]=false;}}}return false;},ID:function(match){return match[1].replace(/\\/g,"");},TAG:function(match,curLoop){return match[1].toLowerCase();},CHILD:function(match){if(match[1]==="nth"){var test=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(match[2]==="even"&&"2n"||match[2]==="odd"&&"2n+1"||!/\D/.test(match[2])&&"0n+"+match[2]||match[2]);match[2]=(test[1]+(test[2]||1))-0;match[3]=test[3]-0;}match[0]=done++;return match;},ATTR:function(match,curLoop,inplace,result,not,isXML){var name=match[1].replace(/\\/g,"");if(!isXML&&Expr.attrMap[name]){match[1]=Expr.attrMap[name];}if(match[2]==="~="){match[4]=" "+match[4]+" ";}return match;},PSEUDO:function(match,curLoop,inplace,result,not){if(match[1]==="not"){if((chunker.exec(match[3])||"").length>1||/^\w/.test(match[3])){match[3]=Sizzle(match[3],null,null,curLoop);}else{var ret=Sizzle.filter(match[3],curLoop,inplace,true^not);if(!inplace){result.push.apply(result,ret);}return false;}}else if(Expr.match.POS.test(match[0])||Expr.match.CHILD.test(match[0])){return true;}return match;},POS:function(match){match.unshift(true);return match;}},filters:{enabled:function(elem){return elem.disabled===false&&elem.type!=="hidden";},disabled:function(elem){return elem.disabled===true;},checked:function(elem){return elem.checked===true;},selected:function(elem){elem.parentNode.selectedIndex;return elem.selected===true;},parent:function(elem){return!!elem.firstChild;},empty:function(elem){return!elem.firstChild;},has:function(elem,i,match){return!!Sizzle(match[3],elem).length;},header:function(elem){return(/h\d/i).test(elem.nodeName);},text:function(elem){return"text"===elem.type;},radio:function(elem){return"radio"===elem.type;},checkbox:function(elem){return"checkbox"===elem.type;},file:function(elem){return"file"===elem.type;},password:function(elem){return"password"===elem.type;},submit:function(elem){return"submit"===elem.type;},image:function(elem){return"image"===elem.type;},reset:function(elem){return"reset"===elem.type;},button:function(elem){return"button"===elem.type||elem.nodeName.toLowerCase()==="button";},input:function(elem){return(/input|select|textarea|button/i).test(elem.nodeName);}},setFilters:{first:function(elem,i){return i===0;},last:function(elem,i,match,array){return i===array.length-1;},even:function(elem,i){return i%2===0;},odd:function(elem,i){return i%2===1;},lt:function(elem,i,match){return i<match[3]-0;},gt:function(elem,i,match){return i>match[3]-0;},nth:function(elem,i,match){return match[3]-0===i;},eq:function(elem,i,match){return match[3]-0===i;}},filter:{PSEUDO:function(elem,match,i,array){var name=match[1],filter=Expr.filters[name];if(filter){return filter(elem,i,match,array);}else if(name==="contains"){return(elem.textContent||elem.innerText||Sizzle.getText([elem])||"").indexOf(match[3])>=0;}else if(name==="not"){var not=match[3];for(var j=0,l=not.length;j<l;j++){if(not[j]===elem){return false;}}return true;}else{Sizzle.error("Syntax error, unrecognized expression: "+name);}},CHILD:function(elem,match){var type=match[1],node=elem;switch(type){case'only':case'first':while((node=node.previousSibling)){if(node.nodeType===1){return false;}}if(type==="first"){return true;}node=elem;case'last':while((node=node.nextSibling)){if(node.nodeType===1){return false;}}return true;case'nth':var first=match[2],last=match[3];if(first===1&&last===0){return true;}var doneName=match[0],parent=elem.parentNode;if(parent&&(parent.sizcache!==doneName||!elem.nodeIndex)){var count=0;for(node=parent.firstChild;node;node=node.nextSibling){if(node.nodeType===1){node.nodeIndex=++count;}}parent.sizcache=doneName;}var diff=elem.nodeIndex-last;if(first===0){return diff===0;}else{return(diff%first===0&&diff/first>=0);}}},ID:function(elem,match){return elem.nodeType===1&&elem.getAttribute("id")===match;},TAG:function(elem,match){return(match==="*"&&elem.nodeType===1)||elem.nodeName.toLowerCase()===match;},CLASS:function(elem,match){return(" "+(elem.className||elem.getAttribute("class"))+" ").indexOf(match)>-1;},ATTR:function(elem,match){var name=match[1],result=Expr.attrHandle[name]?Expr.attrHandle[name](elem):elem[name]!=null?elem[name]:elem.getAttribute(name),value=result+"",type=match[2],check=match[4];return result==null?type==="!=":type==="="?value===check:type==="*="?value.indexOf(check)>=0:type==="~="?(" "+value+" ").indexOf(check)>=0:!check?value&&result!==false:type==="!="?value!==check:type==="^="?value.indexOf(check)===0:type==="$="?value.substr(value.length-check.length)===check:type==="|="?value===check||value.substr(0,check.length+1)===check+"-":false;},POS:function(elem,match,i,array){var name=match[2],filter=Expr.setFilters[name];if(filter){return filter(elem,i,match,array);}}}};var origPOS=Expr.match.POS,fescape=function(all,num){return"\\"+(num-0+1);};for(var type in Expr.match){Expr.match[type]=new RegExp(Expr.match[type].source+(/(?![^\[]*\])(?![^\(]*\))/.source));Expr.leftMatch[type]=new RegExp(/(^(?:.|\r|\n)*?)/.source+Expr.match[type].source.replace(/\\(\d+)/g,fescape));}var makeArray=function(array,results){array=Array.prototype.slice.call(array,0);if(results){results.push.apply(results,array);return results;}return array;};try{Array.prototype.slice.call(document.documentElement.childNodes,0)[0].nodeType;}catch(e){makeArray=function(array,results){var ret=results||[],i=0;if(toString.call(array)==="[object Array]"){Array.prototype.push.apply(ret,array);}else{if(typeof array.length==="number"){for(var l=array.length;i<l;i++){ret.push(array[i]);}}else{for(;array[i];i++){ret.push(array[i]);}}}return ret;};}var sortOrder;if(document.documentElement.compareDocumentPosition){sortOrder=function(a,b){if(!a.compareDocumentPosition||!b.compareDocumentPosition){if(a==b){hasDuplicate=true;}return a.compareDocumentPosition?-1:1;}var ret=a.compareDocumentPosition(b)&4?-1:a===b?0:1;if(ret===0){hasDuplicate=true;}return ret;};}else if("sourceIndex"in document.documentElement){sortOrder=function(a,b){if(!a.sourceIndex||!b.sourceIndex){if(a==b){hasDuplicate=true;}return a.sourceIndex?-1:1;}var ret=a.sourceIndex-b.sourceIndex;if(ret===0){hasDuplicate=true;}return ret;};}else if(document.createRange){sortOrder=function(a,b){if(!a.ownerDocument||!b.ownerDocument){if(a==b){hasDuplicate=true;}return a.ownerDocument?-1:1;}var aRange=a.ownerDocument.createRange(),bRange=b.ownerDocument.createRange();aRange.setStart(a,0);aRange.setEnd(a,0);bRange.setStart(b,0);bRange.setEnd(b,0);var ret=aRange.compareBoundaryPoints(Range.START_TO_END,bRange);if(ret===0){hasDuplicate=true;}return ret;};}Sizzle.getText=function(elems){var ret="",elem;for(var i=0;elems[i];i++){elem=elems[i];if(elem.nodeType===3||elem.nodeType===4){ret+=elem.nodeValue;}else if(elem.nodeType!==8){ret+=Sizzle.getText(elem.childNodes);}}return ret;};(function(){var form=document.createElement("div"),id="script"+(new Date()).getTime();form.innerHTML="<a name='"+id+"'/>";var root=document.documentElement;root.insertBefore(form,root.firstChild);if(document.getElementById(id)){Expr.find.ID=function(match,context,isXML){if(typeof context.getElementById!=="undefined"&&!isXML){var m=context.getElementById(match[1]);return m?m.id===match[1]||typeof m.getAttributeNode!=="undefined"&&m.getAttributeNode("id").nodeValue===match[1]?[m]:undefined:[];}};Expr.filter.ID=function(elem,match){var node=typeof elem.getAttributeNode!=="undefined"&&elem.getAttributeNode("id");return elem.nodeType===1&&node&&node.nodeValue===match;};}root.removeChild(form);root=form=null;})();(function(){var div=document.createElement("div");div.appendChild(document.createComment(""));if(div.getElementsByTagName("*").length>0){Expr.find.TAG=function(match,context){var results=context.getElementsByTagName(match[1]);if(match[1]==="*"){var tmp=[];for(var i=0;results[i];i++){if(results[i].nodeType===1){tmp.push(results[i]);}}results=tmp;}return results;};}div.innerHTML="<a href='#'></a>";if(div.firstChild&&typeof div.firstChild.getAttribute!=="undefined"&&div.firstChild.getAttribute("href")!=="#"){Expr.attrHandle.href=function(elem){return elem.getAttribute("href",2);};}div=null;})();if(document.querySelectorAll){(function(){var oldSizzle=Sizzle,div=document.createElement("div");div.innerHTML="<p class='TEST'></p>";if(div.querySelectorAll&&div.querySelectorAll(".TEST").length===0){return;}Sizzle=function(query,context,extra,seed){context=context||document;if(!seed&&context.nodeType===9&&!Sizzle.isXML(context)){try{return makeArray(context.querySelectorAll(query),extra);}catch(e){}}return oldSizzle(query,context,extra,seed);};for(var prop in oldSizzle){Sizzle[prop]=oldSizzle[prop];}div=null;})();}(function(){var div=document.createElement("div");div.innerHTML="<div class='test e'></div><div class='test'></div>";if(!div.getElementsByClassName||div.getElementsByClassName("e").length===0){return;}div.lastChild.className="e";if(div.getElementsByClassName("e").length===1){return;}Expr.order.splice(1,0,"CLASS");Expr.find.CLASS=function(match,context,isXML){if(typeof context.getElementsByClassName!=="undefined"&&!isXML){return context.getElementsByClassName(match[1]);}};div=null;})();function dirNodeCheck(dir,cur,doneName,checkSet,nodeCheck,isXML){for(var i=0,l=checkSet.length;i<l;i++){var elem=checkSet[i];if(elem){elem=elem[dir];var match=false;while(elem){if(elem.sizcache===doneName){match=checkSet[elem.sizset];break;}if(elem.nodeType===1&&!isXML){elem.sizcache=doneName;elem.sizset=i;}if(elem.nodeName.toLowerCase()===cur){match=elem;break;}elem=elem[dir];}checkSet[i]=match;}}}function dirCheck(dir,cur,doneName,checkSet,nodeCheck,isXML){for(var i=0,l=checkSet.length;i<l;i++){var elem=checkSet[i];if(elem){elem=elem[dir];var match=false;while(elem){if(elem.sizcache===doneName){match=checkSet[elem.sizset];break;}if(elem.nodeType===1){if(!isXML){elem.sizcache=doneName;elem.sizset=i;}if(typeof cur!=="string"){if(elem===cur){match=true;break;}}else if(Sizzle.filter(cur,[elem]).length>0){match=elem;break;}}elem=elem[dir];}checkSet[i]=match;}}}Sizzle.contains=document.compareDocumentPosition?function(a,b){return!!(a.compareDocumentPosition(b)&16);}:function(a,b){return a!==b&&(a.contains?a.contains(b):true);};Sizzle.isXML=function(elem){var documentElement=(elem?elem.ownerDocument||elem:0).documentElement;return documentElement?documentElement.nodeName!=="HTML":false;};var posProcess=function(selector,context){var tmpSet=[],later="",match,root=context.nodeType?[context]:context;while((match=Expr.match.PSEUDO.exec(selector))){later+=match[0];selector=selector.replace(Expr.match.PSEUDO,"");}selector=Expr.relative[selector]?selector+"*":selector;for(var i=0,l=root.length;i<l;i++){Sizzle(selector,root[i],tmpSet);}return Sizzle.filter(later,tmpSet);};window.Sizzle=Sizzle;})();

		// private
		var _util, _nodes, _fragments;

		// public
		var api;

		_nodes = {};
		_fragments = {};
		_util = {

			/**
			 * Creates Element and adds to storage or clones existing
			 * 
			 * @param {String} tag
			 */
			new_element : function(tag) {
				if (!_nodes[tag]) _nodes[tag] = document.createElement(tag);
				return _nodes[tag].cloneNode(true);	
			},

			/**
			 * Adds text to element
			 * 
			 * - auto-detects HTML Entities and uses innerHTML
			 * 
			 * @param {HTMLElement} el
			 * @param {String} string
			 */
			insert_text : function(el, text) {
				if (/\&\S+;/.test(text)) el.innerHTML += text;
				else el.appendChild(document.createTextNode(text));
			}
		}

		api = {

			/**
			 * Creates DOMElements
			 * 
			 * - Contents can contain array of strings, numbers, or other DOMElements created by this method
			 * - Fragment is the name of the fragment to append the birthed DOMElement to
			 * 
			 * @param {String} tag
			 * @param {Object} attrs
			 * @param {String|Number|Array|HTMLElement} contents
			 * @param {String} fragment (optional)
			 */
			build : function(tag, attrs, contents, fragment) {

				// creates new element, or clones existing
				var el = _util.new_element(tag);

				// set attributes
				if (attrs && core.type('Object', attrs)) {
					for (var attr in attrs) {

						if (attr == 'style') api.set_style(attrs[attr], el);

						// Properly handle classes attributes
						else if( attr === 'class') el.className = attrs[attr];
						else {								
							if (el[attr]) el[attr] = attrs[attr];
							else el.setAttribute(attr, attrs[attr]);	
						}
					}
				}
				else fragment = contents, contents = attrs;

				// parse content
				if (contents) {
					if (core.type(['String', 'Number'], contents)) {
						_util.insert_text(el, contents);
					}
					else if (core.type(['HTMLElement', 'DocumentFragment'], contents)) {
						el.appendChild(contents);
					}
					else if (core.type('Array', contents)){
						for (var i = 0; i < contents.length; i++) {
							if (core.type(['String', 'Number'], contents[i])) {
								_util.insert_text(el, contents[i], true);
							}
							else if (typeof contents[i] === 'function') {
								contents[i](el); 
							}
							else {
								el.appendChild(contents[i]);
							}
						}
					}
					else if (typeof contents === 'function') contents(el);
				}
				// if fragment referenced, create and/or add to existing
				if (fragment) {
					if (!_fragments[fragment]) _fragments[fragment] = document.createDocumentFragment();
					_fragments[fragment].appendChild(el);
				}

				return el;
			},

			/**
			 * Returns the stored fragment if unique is true,
			 * otherwise returns a clone of the fragment
			 * 
			 * @param {String} name
			 * @param {Bool} is this a unique usage
			 */
			get_fragment : function(name, unique) {

				var frag = _fragments[name];

	            if (unique) {
					delete _fragments[name];
				}
	            else frag = frag.cloneNode(true);

				return frag || false;
			},

			/**
			 * hunt is sizzling!
			 */
			query : window.Sizzle,

			has_class : function(class_name, el) {
				return el.className.split(' ').indexOf(class_name) > -1;
			},

			add_class : function(class_name, el) {

				var _add_class = function(el) {
					var classes = el.className.split(' ');

					if (classes[0] === '') classes = [];
					if (classes.indexOf(class_name) < 0) classes.push(class_name);
					el.className = classes.join(' ');
				}

				if (raptor.type('Array', el)) {
					for (var i = 0, len = el.length; i < len; i++) _add_class(el[i]);
				}
				else _add_class(el);
			},

			remove_class : function(class_name, el) {

				var _remove_class = function(el) {
					var classes = el.className.split(' ');
					if (classes === '') classes = [];
					var i = classes.indexOf(class_name)
					if (i > -1) classes.splice(i, 1);
					el.className = classes.join(' ');
				}

				if (raptor.type('Array', el)) {
					for (var i = 0, len = el.length; i < len; i++) _remove_class(el[i]);
				}
				else _remove_class(el);
			},

			set_style : function(styles, el) {
				var style_text = "";
				for (var prop in styles) style_text += prop + ":" + styles[prop] + ";";
				el.style.cssText = style_text;
			},

			set_html : function(html, el) {
				el.innerHTML = html;
				raptor.scan_for_life(el);
			},

			/**
			 * Checks for "persistent" events to apply
			 * to the element before appending.
			 * 
			 */
			append : function(el, existing, means) {

				means = means || '';

				// if fragment
				if (el.nodeType === 11) {
					var nodes = el.childNodes;
					var children = [];
					for (var i = 0, len = nodes.length; i < len; i++) children.push(nodes[i]);
				}

				switch(means) {
					case 'replace' : existing.parentNode.replaceChild(el, existing);
						break;
					case 'replace_contents' :
						existing.innerHTML = '';
						existing.appendChild(el);
						break;
					case 'before' : existing.parentNode.insertBefore(el, existing);
						break;
					default : existing.appendChild(el);
				}

				if (children) el = children;

				// Make sure the DOM has caught up before trying to scan for life
				setTimeout(function() {raptor.scan_for_life(el)}, 20);
			}
		};
		
		return api;
	})();
	
	events = (function() {

		// private
		var _dom, _persistant, _custom , _util;

		// public
		var api;

		// utility functions for event management
		_util = {    		    
			format_type : function(type) {
				if (!type) return false;
	 			return (type === 'DOMContentLoaded' || /^on/.test(type)) ? type : 'on' + type;
			}
		};

		_dom = {
			collection : [],
			add : function(target, type, cb) {

				type = _util.format_type(type);

				var target_events = this.find_events_by_target(target);
				if (target_events) {
					(target_events.types[type]) ? target_events.types[type].push(cb) : target_events.types[type] = [cb]; 
				}
				else {
					var new_target_event = { 'target' : target, 'types' : {} };
					new_target_event.types[type] = [cb];
					this.collection.push(new_target_event);
				}

				target[type] = api.alarm;
			},
			fire : function(event, ie_current_target) {

				event = event || window.event;
				var data = _dom.generate_data(event);						
				var target_events = _dom.find_events_by_target(event.currentTarget || ie_current_target);

				if (!target_events) return false;

				var callbacks = target_events.types[data.type];
				if (!callbacks) return false;

				for (var i = 0, len = callbacks.length; i < len; i++) callbacks[i](data);
			},
			remove : function(target, type, cb) {
				type = _util.format_type(type);
				var collection = this.collection;
				var match = true;
				if (!type) {
					for (var i = 0, len = collection.length; i < len; i++) {
						if (collection[i].target === target) {
							this.collection.remove(collection[i]);
							match = true;
						}
					}
				}
				else if (!cb) {
					for (var i = 0, len = collection.length; i < len; i++) {
						if (collection[i].target === target) {
							if (collection[i].types[type]) {
								delete collection[i].types[type];
								match = true;
							}
						}	
					}
				}
				else {
					for (var i = 0, len = collection.length; i < len; i++) {
						if (collection[i].target === target) {
							if (collection[i].types[type].indexOf(cb) > -1) {
								collection[i].types[type].remove(cb); 
								match = true;
							}
						}	
					}
				}
				return match;
			},
			generate_data : function(event) {
				var custom_event = { 'dom' : event };
				custom_event['target'] = event.target || event.srcElement;
				custom_event['type'] = _util.format_type(event.type);			
				custom_event['preventDefault'] = (event.preventDefault) ? function() { event.preventDefault(); } : function() { event.returnValue = false };
	   			custom_event['x'] = event.pageX || event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	    	    custom_event['y'] = event.pageY || event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
				return custom_event;
			},
			find_events_by_target : function(target) {
				var collection = this.collection;
				for (var i = 0, len = collection.length; i < len; i++) {
	    			var set = collection[i];
	    			if (set.target === target) return set;
				}
			}
		}

		_persistent = {
			collection : [],
			add : function(query, type, cb) {

				type = _util.format_type(type);

				var existing_query = this.collection[query];
				if (existing_query) {
					(existing_query[type]) ? existing_query[type].push(cb) : existing_query.types[type] = [cb];
				}
				else {
					var new_persistent_event = { 'query' : query, 'types' : {} }
					new_persistent_event.types[type] = [cb];
					this.collection.push(new_persistent_event);
				}

				var current_set = raptor.hunt(query);
				api.lash(current_set, type, cb);
			},
			remove : function(query, type, cb) {
				var collection = this.collection;
				var match = false;
				if (!type) {
					for (var i in collection) {
						if (collection[i].query === query) {
							this.collection.remove(i);
							match = true;
						}
					}
				}
				else if (!cb) {
					for (var i in collection) {
						if (collection[i].query === query) {
							if (collection[i].types[type]) {
								delete collection[i].types[type];
								match = true;
							}
						}	
					}
				}
				else {
					for (var i in collection) {
						if (collection[i].query === query) {
							if (collection[i].types[type].indexOf(cb) > -1) {
								collection[i].types[type].remove(cb);
								match = true;
							}
						}
					}
				}
				return match;
			}
		}

		_custom = {
			collection : {},

			/**
	        * @param {String} Name of custom event
	        * @param {Function} Callback to run
	        * @param {Integer} Number of fires required to execute cb
	        */
			add : function(name, cb, count) {
				var collection = this.collection;
				var match = false;

				if (count) {
				    var old_cb = cb;

				    cb = function(e) {
	                    this.fire_count = this.fire_count || 0;
	                    this.fire_count++;

	                    if (this.fire_count === count) old_cb(e);
				    }
				}

				for (var i in collection) {
					if (i === name) {
						match = true;
						this.collection[name].push(cb);
					}
				}
				if (!match) this.collection[name] = [cb];
			},
			fire : function(name, data) {
				var collection = this.collection;
				for (var i in collection) {
					if (i === name) {
						var events = collection[i];
						for (var i = 0, len = events.length; i < len; i++) events[i](data);
					}
				}
			},
			remove : function(name, cb) {
				if (!this.collection[name]) return false;
				if (!cb) delete this.collection[name];
				else this.collection[name].remove(cb);
				return true;
			}
		}

		api = {

	        /**
			* Queue up methods to run when the document is ready
			*
			* @param {Function} Callback
			*/
			ready : function (fn) {										

				if (api.loaded) {
					fn();
					return;
				}

				raptor.lash(document, 'DOMContentLoaded', fn);

				if (document.readyState) {
					if (!timer) {
						var timer = setInterval(function() {
							if (document.readyState === 'complete') {
								if (!api.loaded) {
									api.loaded = true;
									clearInterval(timer);
									timer = null;
									api.alarm({'currentTarget' : document, 'type' : 'DOMContentLoaded'});
								}
							}
						}, 10);
					}
				}
			},	

			add : function(target, type, cb) {
				if (cb) {
					if (typeof target === 'string') {
						if (typeof cb === 'function') _persistent.add(target, type, cb);
						else _custom.add(target, type, cb);
					}
					else {
						if (raptor.type('Array', target)) {
							for (var i = 0, len = target.length; i < len; i++) _dom.add(target[i], type, cb);
						}
						else _dom.add(target, type, cb);
					}
				}
				else _custom.add(target, type);
			},

			remove : function(target, type, cb) {
				if (cb) {
					(typeof target === 'string') ? _persistent.remove(target, type, cb) : _dom.remove(target, type, cb);
				}
				else {
					if (_custom.remove(target, type)) return;
					if (_persistent.remove(target, type)) return;
					if (_dom.remove(target, type)) return;
				}
			},

			fire : function(target, data) {
				if (typeof target === 'string') _custom.fire(target, data);
				else _dom.fire(target, this);
			},

			apply_persistence : function(el) {

				var sandbox = document.createElement('div');
				var _get_sandbox = function() {
					sandbox.innerHTML = '';
					return sandbox;
				}

				var _apply = function(test_el, persistent_event) {
					var types = persistent_event.types;
					for (var type in types) {
						var callbacks = types[type];
						for (var i = 0, len = callbacks.length; i < len; i++) {
							var callback = callbacks[i];
							if (!test_el.applied) test_el.applied = {};
							if (test_el.applied[type]) {
								if (test_el.applied[type].indexOf(callback) > -1) continue;
								else test_el.applied[type].push(callback);
							}
							else test_el.applied[type] = [callback];
							api.lash(test_el, type, callback);
						}
					}
				}

				var _test = function(test_el) {
					for (var i = 0, len = persistent_events.length; i < len; i++) {

						var persistent_event = persistent_events[i];
						var query = persistent_event.query;

						var parts = query.split(' ');
						var parts_length = parts.length;
						var prelim;

						var sandbox = _get_sandbox();

						sandbox_test_el = test_el.cloneNode(true);
						sandbox.appendChild(sandbox_test_el);

						// if query string has depth of 1 only test in local sandbox
						if (parts_length === 1) {
							prelim = parts[0];
							if (raptor.hunt(prelim, sandbox).indexOf(sandbox_test_el) > -1) _apply(test_el, persistent_event);	
						}
						else {
							prelim = parts[parts_length - 1];
							if (raptor.hunt(prelim, sandbox).indexOf(sandbox_test_el) > -1) {
								if (raptor.hunt(query).indexOf(test_el) > -1) {
									_apply(test_el, persistent_event);
								}
							}
						}
					}
				}

				var persistent_events = _persistent.collection;

				var children;
				var test_context = false;

				// if el is container element
				if (el.nodeType === 1) {
					_test(el);
					children = el.getElementsByTagName('*');
					for (var i = 0, len = children.length; i < len; i++) _test(children[i], true);
				}
				else {

					// if el is document fragment
					for (var i = 0, len = el.length; i < len; i++) {
						var _el = el[i];
						_test(_el);
						children = _el.getElementsByTagName('*');
						for (var x = 0, x_len = children.length; x < x_len; x++) _test(children[x], true);
					}
				}	
			}
		}

		return api;
	})();
	
	
	ajax = (function () {

		var xhr = null;

		// Hold our status here (are we currently sending any requests already?)
		var inProgress = false;

		// Store the current request that's being sent out
		var currentRequest = null;

		// Hold our queue
		var requestQueue = new Array();

		// Hold a timeout
		var queueTimeout = null;

		var cache = {};

		/**
		* Create a jetpack request object which we can popuplate
		* for queueing requests
		*
		* @param {Object} Configuration
		*
		* uri : Request URI
		* method (Optional) : GET|POST (Defaults to get)
		* data (Optional) : Object or array of data to send with the request
		* errorHandler (Optional) : Callback for errors
		* preFire (Optional) : Function to run before running AJAX request
		* success (Optional) : Callback for successful transmission
		* cache (Optional) : Cache GET requests, defaults to true
		* async (Optional) : {Bool}
		* json {Optional} : {Bool} Should we parse the data as JSON
		*  
		*/
		var JetpackRequest = function (cfg) {

			// Set the URI for our ajax request; this is required
			try {
				if(cfg.uri) {
					this.uri = cfg.uri;
				}
				else {
					throw 'No URI Specified for the AJAX Request';
					return;
				}
			}
			catch(ex) {};

			this.method = cfg.method || 'GET';

			// If we're given some data to send; prepare it
			if(cfg.data) {
				this.data = '?' + jetpack.prepareQueryString(cfg.data);
			} else {
				this.data = '';
			}

			// Set up method specific values
			if(this.method === 'GET') {
				this.uri += this.data;

				this.cache = cfg.cache !== false;

			//	if(cfg.cache !== false) this.cache = true;			
			}		
			else {									
				this.cache = cfg.cache || false;
			}

			this.errorHandler = cfg.errorHandler || null;
			this.preFire = cfg.preFire || null;
			this.success = cfg.success || null;
			this.async = cfg.async || true;
			this.json = cfg.json || false;
			this.contentType = cfg.contentType || 'application/x-www-form-urlencoded';

			/**
			* Now that we have our configuration set up, we can send this now; or push it to the queue
			*/
			if(!inProgress) {
				inProgress = true;

				currentRequest = this;
				jetpack.send(this);
			}
			else {
				requestQueue.push(this);
			}

		};

		var jetpack = {

			/**
			* Internal method for creating an XHR object
			*/
			_createXHR : function () {
				if(window.XMLHttpRequest) {
					xhr = new XMLHttpRequest;
				}
				else if(window.ActiveXObject) {
					var _xhr, axo, ex, objects, success = false;
					objects = ['Microsoft', 'Msxml2', 'Msxml3'];

					for(var i=0; i<objects.length; i++) {
						axo = objects[i] + '.XMLHTTP';

						try {
							_xhr = new ActiveXObject(axo);
							xhr = _xhr;
							success = true;
						}

						catch(ex) {};
					}

					if(!success) {
						throw 'Unable to create XHR object.';
						return;
					}
				}
				else {
					throw "XMLHttp is not supported.";
					return;
				}

				xhr.onreadystatechange = jetpack._onreadystatechange;
			},

			/**
			* Internal method for handling XHR ready state change
			*/
			_onreadystatechange : function () {
				if(xhr.readyState == 4) {
					// Finished request		
					if(xhr.status === 200) {
						if(currentRequest.success) {
							// Execute user provided callback for successful transmission
							var response = xhr.responseXML || xhr.responseText;																		

							// Handle a 'receiveAs' parameter, converting the data received as needed
							if(currentRequest.json) {							
								if(xhr.responseXML) response = parsers.xml(response);
								else response = parsers.json.read(response);					
							}

							// Cache the response if we are supposed to
							if(currentRequest.cache) cache[currentRequest.uri] = response;	

							currentRequest.success(response);
						}

						jetpack.finishRequest();
					}
					// Error
					else {
						if(currentRequest.errorHandler) {
							// Execute user provided callback for error
							currentRequest.errorHandler();
						}

						jetpack.finishRequest();
					}
				}
			},

			/**
			* Takes data  and generates a query string to send in our
			* Ajax request
			*
			* @param {Object}
			*/
			prepareQueryString : function (data) {
				var qString = '', i=0;
				for(var name in data) {								

					if(i>0) qString += '&'

					qString += name + '=' + data[name];

					i++;
				}

				return qString;
			},

			/**
			* Send out a request with the provided
			* Jetpack Request object
			*
			* @param {Object} Jetpack Request
			*/
			send : function (jetpackRequest) {
				jetpack._createXHR();

				xhr.open(jetpackRequest.method, jetpackRequest.uri, jetpackRequest.async);
				xhr.setRequestHeader('Content-Type', jetpackRequest.contentType);

				// Run the user specified throbber function
				if(jetpackRequest.preFire) {
					jetpackRequest.preFire(xhr);
				}

				var cachedResponse;

				// Check if cache is set to true and a cache exists for this URI
				if( jetpackRequest.cache && (cachedResponse = cache[jetpackRequest.uri]) ) {
					if(jetpackRequest.success) {
						jetpackRequest.success(cachedResponse);
						jetpack.finishRequest();
					}
				} 
				// Otherwise we should go ahead and send the request
				else {
					if(jetpackRequest.method === 'POST') {
						data = jetpackRequest.data;
					}
					else {
						data = '';
					}										

					xhr.send(data);
				}

			},


			/**
			* Finish up the request
			*/
			finishRequest : function () {
				// Reset the current Request
				currentRequest = null;

				//If we have another request queued up, fire it
				if(requestQueue.length > 0) {
					currentRequest = requestQueue[0];
					requestQueue = requestQueue.slice(1);

					// Force a delay before executing the next request in queue
					setTimeout(function() { jetpack.send(currentRequest); }, 500);
				}
				else {
					// Reset the in progress flag if we're done
					inProgress = false;
				}
			}
		};

		// XML Parser Module
		var xmlParser = {

				/**
				* Start a parse of an xml doc
				*
				* @param {Object} XML Doc Object
				*/
	            read : function(xmlDoc) {		
					/*
					* Find a valid start of an XML document in case a comment
					* is the first node found
					*/
					var root;

					var len = xmlDoc.childNodes.length;				
					var node;
					for(var i=0; i<len; i++) {
						node = xmlDoc.childNodes[i];
						if (node.nodeName === 'xml' || node.nodeName === '#comment') continue;
						if(!raptor.type('Comment', node)) {						
							root = node;
							break;
						}
					}																

					if(root) return xmlParser.nodeParse(root);
					else return false;
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
					if(node.attributes && node.attributes.length > 0) {
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
								if(xmlParser.isArray(_thisTagName, node)) {
									jsonNode[_thisTagName] = xmlParser.childArrParse(_thisTagName, node);
									blackList.push(_thisTagName);
								}
								// Otherwise, just populate it normally
								else {
									jsonNode[_thisTagName] = xmlParser.nodeParse(_thisNode);
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
							jsonNode['$t'] = node.childNodes[0].textContent;
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
						arr.push(xmlParser.nodeParse(_thisChild));
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

		/**
		* JSON Parser module for non-xml data
		*
		* Attempts to use a browser's native JSON parsing abilities
		* if it exists, otherwise degrades down to use of new Function()
		* 
		* TODO: JSON Stringify
		*
		*/
		var jsonParser = {

			read : function (data) {
				if(JSON && JSON.parse) { return JSON.parse(data); }
				else return new Function( 'return ' + data )();
			},

			stringify : function () {}
		
		};

		// Registry of parsers
		var parsers = {
			'xml' : xmlParser.read,
			'json' : jsonParser
		};

		var api = {

			/**
			* Enage the jetpack!
			* Send out a request
			* 
			* @param {Object} Configuration for the request 
			* See jetpackRequest
			*/
			request : function (cfg) {
				var _request = new JetpackRequest(cfg);
			},

			// Make parsers publicly available
			parseXML : parsers.xml,		
			parseJSON : parsers.json
		};

		return api;
	})();
		
	api = {
		events : events,
		config : config,
		dom : dom,
		ajax : ajax
	}
	
	// merge into API
	core.extend(core);
	
	return api;
})();

console.log(rptr)