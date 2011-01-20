/*

	Copyright (c) 2010 Brendan Barr, Damian Galarza, http://www.rptrjs.com

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
	
	var config, api, core, dom, events, ajax, overlays;
	
	config = (function() {
		
		var api = {
			version : '1.0',
			scripts : {
				loaded : [],
				rptr_path : '',
				base_path : '',
				set_base_path : function(path) { api.scripts.base_path = path; }
			}
		};
		
		//  Determine where the core file is located, and store the URI prefix
		var scripts = document.getElementsByTagName("script");

		for (var i = 0, len = scripts.length, rptr_path, src; i < len; i++) {				
			src = scripts[i].src;
			if (src.match(/rptr\.js/)) {
				rptr_path = src.replace(/rptr\.js$/, '');				
			}
		}

		api.scripts.base_path = api.scripts.rptr_path = rptr_path;
		
		return api;
	})();
	
	core = {
		
		/**
		 *
		 *
		 *
		 */
		_augment_object : function(destination, source, by_value, force) {
			for (var prop in source) {
				var curr = source[prop];
				if (by_value) {
					if (core.type('Object', curr)) {
						if (!force) {
							if (destination[prop]) continue;
						}
						destination[prop] = {};
						core._augment_object(destination[prop], curr, true, force);
					}
					else {
						destination[prop] = (force) ? curr : destination[prop] || curr;
					}
				}
				else {
					destination[prop] = (force) ? curr : destination[prop] || curr;
				}
			}
		},
		
		/**
		 *  Deep extend of destination.
		 *  If no source, destination is added to rptr api.
		 *
		 *  @param {Object} destination
		 *  @param {Object} (optional) source
		 *  @returns the merged destination object
		 */
		extend : function(destination, source, by_value) {
			
			if (!source) {
				source = destination;
				destination = api;
				by_value = true;
			}
			
			core._augment_object(destination, source, by_value, true);
			
			return destination;
		},
		
		merge : function(destination, source, by_value) {
			
			if (!source) {
				source = destination;
				destination = api;
				by_value = true;
			}
			
			core._augment_object(destination, source, by_value, false);
			
			return destination;
		},
		
		branch : function(destination, path, data) {
			
			var current, previous, property, last_property;
			
			// if path only has 1 element
			if (path.length === 1) {
				last_property = path[0];
				if (data) {
					destination[last_property] = data;
					return destination;
				}
				else {
					return (destination[last_property]) ? destination[last_property] : false;
				}
			}
			
			// if more than 1 element
			previous = destination;
			property = path.shift();
			current = destination[property];
			if (!current) current = previous[property] = {};
			
			while (path[1]) {
				property = path.shift();
				previous = current;
				current = current[property];
				if (!current) current = previous[property] = {};
			}
						
			previous = current;
			last_property = path[0];
			
			if (data) {
				current[last_property] = data;
				return destination;
			}
			else {
				return (current[last_property]) ? current[last_property] : false;
			}
		},
		
		/**
		 *  Fetches some content using an AJAX request and assigns the response
		 *  or the return value of the callback (which will be passed the response)
		 *  to the destination[key]
		 *
		 */
		remote_extend : function(config) {
			
            var id = config.id || config.url;
            
            var cache = this.remote_extend[id];
            if (!cache) {
                cache = this.remote_extend[id] = {
                    count : 1,
                    ready : config.ready || function() {}
                };
            }
            else cache.count++;
            
            api.ajax({
                uri : config.url,
				cache : false,
                success : function(data) {
                    
                    if (cache.count > 1) {
                        cache.count--;
                        return;
                    }
                    
					cache.count = 0;
                    data = (config.process) ? config.process(data) : data;
                    config.destination[config.name] = data;
                    config.ready(data);
                }
            });
		},
		
		/**
		 *  Limits a function to being called only once during a specified time.
		 *
		 *  @param {String} unique id
		 *  @param {Number} how often can it run (milliseconds)
		 *  @param {Function} the function to limit
		 */
		throttle : function(id, interval, fn) {
			
			var _this = core.throttle;
			if (_this[id]) return;
			else {
				fn();
				_this[id] = setTimeout(function() {
					delete _this[id];
				}, interval);
			}
		},
		
		for_any : function(subject, fn) {
			if (rptr.type('Array', subject)) {
				for (var i = 0, len = subject.length; i < len; i++) {
					fn(subject);	
				}
			}
			else {
				fn(subject);
			}
		},
		
		/**
		 * Tests for data type by constructor name
		 * 
		 * @param {Array|String} types
		 * @param {*} data
		 */
		type : function(types, data) {
			
			var match = false;
			
			var test = function(type, data) {
				switch(type) {
					case 'Object':
						if (typeof data === 'object' && data && !data.length && !data.tagName) match = true;
						break;
					case 'HTMLElement':
						if (data.tagName) match = true;
						break;
                    case 'HTMLCollection':
                        if (data.length && !data.push) match = true;
                        break;
					default:
						try { if (data.constructor && data.constructor.toString().indexOf(type) !== -1) match = true }
						catch (e) { new Error(e) }
				}
			}
			
			if (typeof types === 'string') test(types, data);
			else for (var i = 0; i < types.length && !match; i++) test(types[i], data);
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
					load_path += (module + '.js');
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
                        _util.script_loaded = function() { rptr.publish('script_loaded') };
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
		        if (config.scripts.loaded.indexOf(module) > -1) {
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
		        rptr.subscribe('script_loaded', function(e) {
					if (callback) callback();
		            rptr.unsubscribe('script_loaded');
		        }, modules_length);
		        
		        // Loop through and load modules one at a time
		        for(var i=0; i < modules_length; i++) _load_single(modules[i]);
		    }
            
			if (typeof modules === 'string') _load_single(modules);
		    else _load_many(modules);
		},
		
		tool : function(name, constructor) {
			if (!api.tools) api.tools = {};
			else if (api.tools[name]) {
				new Error('rptr.tool of that name already exists');
			}
			api.tools[name] = constructor;
		},
	
		object_empty : function(obj) {
		    for (var prop in obj) {
		        if (obj.hasOwnProperty(prop)) return false;
		    }
		    return true;
		},
		
		object_length : function(obj) {
			var length = 0;
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) length++;
			}
			return length;
		}
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

						if (attr == 'style') api.style(attrs[attr], el);

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

			query : window.Sizzle,

			/**
			 * Returns the stored fragment if unique is true,
			 * otherwise returns a clone of the fragment
			 * 
			 * @param {String} name
			 * @param {Bool} is this a unique usage
			 */
			fragment : function(name, unique) {

				var frag = _fragments[name];

	            if (unique) {
					delete _fragments[name];
				}
	            else frag = frag.cloneNode(true);

				return frag || false;
			},

			has_class : function(class_name, el) {
                
                var _has_class = function(el) {
                    return el.className.split(' ').indexOf(class_name) > -1;    
                }
				
                if (core.type(['Array', 'HTMLCollection'], el)) {
					for (var i = 0, len = el.length; i < len; i++) {
                        if (_has_class(el[i])) return true;
                    }
				}
				else return _has_class(el);
                
                return false;
			},

			add_class : function(class_name, el) {

				var _add_class = function(el) {
					var classes = el.className.split(' ');
					if (classes[0] === '') classes = [];
					if (classes.indexOf(class_name) < 0) classes.push(class_name);
					el.className = classes.join(' ');
				}

				if (core.type(['Array', 'HTMLCollection'], el)) {
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

				if (core.type(['Array', 'HTMLCollection'], el)) {
					for (var i = 0, len = el.length; i < len; i++) _remove_class(el[i]);
				}
				else _remove_class(el);
			},

			style : function(styles, el) {
				var style_text = "";
				for (var prop in styles) style_text += prop + ":" + styles[prop] + ";";
				el.style.cssText += style_text;
			},

			html : function(html, el) {
				el.innerHTML = html;
				rptr.apply_subscriptions(el);
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
				setTimeout(function() {rptr.apply_subscriptions(el)}, 20);
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

				target[type] = api.publish;
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
				custom_event['preventDefault'] = (event.preventDefault) ? function() { event.preventDefault(); } : function() { event.returnValue = false; };
				custom_event['stopPropagation'] = (event.stopPropagation) ? function() { event.stopPropagation(); } : function() { event.cancelBubble = true; };
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

				var current_set = rptr.query(query);
				api.subscribe(current_set, type, cb);
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
					var re = new RegExp(i);
					if (re.test(name)) {
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

				api.subscribe(document, 'DOMContentLoaded', fn);

				if (document.readyState) {
					if (!timer) {
						var timer = setInterval(function() {
							if (document.readyState === 'complete') {
								if (!api.loaded) {
									api.loaded = true;
									clearInterval(timer);
									timer = null;
									api.publish({'currentTarget' : document, 'type' : 'DOMContentLoaded'});
								}
							}
						}, 10);
					}
				}
			},	

			subscribe : function(target, type, cb) {
				if (cb) {
					if (typeof target === 'string') {
						if (typeof cb === 'function') _persistent.add(target, type, cb);
						else _custom.add(target, type, cb);
					}
					else {
						if (core.type('Array', target)) {
							for (var i = 0, len = target.length; i < len; i++) _dom.add(target[i], type, cb);
						}
						else _dom.add(target, type, cb);
					}
				}
				else _custom.add(target, type);
			},

			unsubscribe : function(target, type, cb) {
				if (cb) {
					(typeof target === 'string') ? _persistent.remove(target, type, cb) : _dom.remove(target, type, cb);
				}
				else {
					if (_custom.remove(target, type)) return;
					if (_persistent.remove(target, type)) return;
					if (_dom.remove(target, type)) return;
				}
			},

			publish : function(target, data) {
				if (typeof target === 'string') _custom.fire(target, data);
				else _dom.fire(target, this);
			},

			apply_subscriptions : function() {

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
							api.subscribe(test_el, type, callback);
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
							if (rptr.query(prelim, sandbox).indexOf(sandbox_test_el) > -1) _apply(test_el, persistent_event);	
						}
						else {
							prelim = parts[parts_length - 1];
							if (rptr.query(prelim, sandbox).indexOf(sandbox_test_el) > -1) {
								if (rptr.query(query).indexOf(test_el) > -1) {
									_apply(test_el, persistent_event);
								}
							}
						}
					}
				}
	
				var persistent_events = _persistent.collection;

				var children;
				var test_context = false;

				return function(el) {
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
			}()
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
		var requestQueue = [];

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
			catch (ex) {};

			this.method = cfg.method || 'GET';

			// If we're given some data to send; prepare it
			if (cfg.data) {
				this.data = jetpack.prepareQueryString(cfg.data);
			} 
			else {
				this.data = '';
			}

			// Set up method specific values
			if (this.method === 'GET') {
				this.uri += (this.data) ? '?' + this.data : '';
				this.cache = cfg.cache !== false;
			}
			else {
				this.cache = cfg.cache || false;
			}

			this.errorHandler = cfg.errorHandler || null;
			this.preFire = cfg.preFire || null;
			this.success = cfg.success || null;
			this.callback = cfg.callback || null;
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
					if(xhr.status) {
						
						if (currentRequest.callback) {
							
							var response;
							
							if (xhr.responseXML) {
								response = parsers.xml(xhr.responseXML);
							}
							else {
								response = xhr.responseText;
								if ((response.charAt(0) === '{' && response.charAt(response.length - 1) === '}') || (response.charAt(0) === '[' && response.charAt(response.length - 1) === ']')) {
									response = parsers.json.read(response);
								}
							}
							
							currentRequest.callback(response, xhr.status);
						}
						
						jetpack.finishRequest();
					}
					/*	
						if(currentRequest.success) {
							
							var response;
							
							if (xhr.responseXML) {
								response = parsers.xml(response);
							}
							else {
								var text = response = xhr.responseText;
								
								// try to detect json string
								if ((text.charAt(0) === '{' && text.charAt(text.length - 1) === '}') || (text.charAt(0) === '[' && text.charAt(text.length - 1) === ']')) {
									response = parsers.json.read(text);
								}
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
					
				*/

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
					if(jetpackRequest.method !== 'GET') {
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
						if(!core.type('Comment', node)) {						
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
			'xml' : xmlParser,
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
			ajax : function (cfg) {
				var _request = new JetpackRequest(cfg);
			},

			// Make parsers publicly available
			xml : parsers.xml,		
			json : parsers.json
		};

		return api;
	})();
	
	overlays = (function() {
		
		var _overlays = {};

		var _html = {	
			'templates' : {
				'standard' : function () {
				    return rptr.build('div', {'class' : 'overlay standard-overlay hide'},
					    [
						    rptr.build('a', {'href' : '#', 'class' : 'close-overlay'}, 'close'),
	    					rptr.build('div', {'class' : 'content loading'}, 'loading..')
		    			]
	                )
	    		}
			}
		};

		var _util = {

			toggleObtrusive : function() {

				var body = document.body;

				if (!document.getElementById('obtrusive-backdrop')) {
					var backdrop = rptr.build('div', {'id' : 'obtrusive-backdrop'});
					body.appendChild(backdrop);
				}

				if (rptr.has_class('obtrusive', body)) rptr.remove_class('obtrusive', body);
				else rptr.add_class('obtrusive', body);
			},

			buildFrame : function(overlay) {
				overlay.el = (overlay.template) ? _html.templates[overlay.template]().cloneNode(true) : _html.templates.standard().cloneNode(true);
				overlay.el.setAttribute('id', overlay.id);
				rptr.append(overlay.el, document.body);
			}
		}

		var Overlay = function(config) {

			this.id = config.id;
			this.type = config.type || 'unobtrusive';
			this.el = document.getElementById(this.id);

			// Are we following the mouse around on move
			this.follow = config.follow;

			// Offset for positioning
			this.offset = config.offset || { x: 0, y:0 };

			this.template = config.template;

			// if overlay doens't exist in the document, generate from collection of templates
			if (!this.el) _util.buildFrame(this);

			var content = rptr.query('.content', this.el);
			this.contentArea = (content[0]) ? content[0] : this.el;

			if (config.callback) this.callback = config.callback;
			this.cache = (config.cache == false) ? false : true;
		}

		Overlay.prototype = {

			show : function(e) {

				// if element exists and is showing, don't try show/build it again
				if (this.el && !rptr.has_class('hide', this.el)) return false;

				// preserve event if there is one
				this.triggerEvent = e || {};

				// show backdrop for obtrusive overlays
				if (this.type === 'obtrusive') _util.toggleObtrusive();

				rptr.remove_class('hide', this.el);	

				// if there is a callback, execute it, so it can populate the overlay or whatever else it wants to do
				if (this.callback) {
					this.callback(this, e);

					// finally, if cache is set to true, destroy the callback as it won't be used again
					if (this.cache) this.callback = null;
				}

				// position it dynamically based on content size, or click location for tooltips
				this.position();

				if (this.follow) {
					this.el.style.left = '-999em';
					this.start_following();
				}
			},

			hide : function() {
				rptr.add_class('hide', this.el);
				if (this.type === 'obtrusive') _util.toggleObtrusive();
				if (this.follow) this.stop_following();
			},

			_following_method : function(e, _this) {
				_this.el.style.left = e.x + _this.offset.x + 'px';
				_this.el.style.top = e.y + _this.offset.y + 'px';
			},

			start_following : function() {
				var _this = this;
				rptr.subscribe(document, 'mousemove', function(e) {
					var	timer = setTimeout(function() {				
						clearTimeout(timer);
						_this._following_method(e, _this);
					}, 20);
				});
			},

			stop_following : function() {
				rptr.unsubscribe(window, 'mousemove', this._following_method);
				this.following = false;
			},

			position : function(event) {

				var el = this.el;
				var event = event || this.triggerEvent;
				var style = {};
				var width = el.scrollWidth;
				var height = el.scrollHeight;
				var clientHeight = document.documentElement.clientHeight;
				var clientWidth = document.documentElement.clientWidth;

				if (this.type === 'tooltip') {
					if (event.x && event.y) {		   
						style.left = (event.x + this.offset.x) + 'px';
						style.top = (event.y + this.offset.y) + 'px';
					}
				}
				else {
					style.left = '50%';
					style['margin-left'] = '-' + Math.floor(width / 2) + 'px';

					if (clientHeight > height) {
						style.top = ((clientHeight - height) / 2) + 'px';
					}
					else {
						style.top = '0px';
					}
				}

				var showing = 1;
				for (var o in _overlays) {
					var overlay = _overlays[o].el;
					if (!rptr.has_class('hide', overlay)) {
						var z = overlay.style.zIndex;
						if (z >= showing) showing = ++z;
					}
				}
				style['z-index'] = showing;

				rptr.style(style, el);
			}
		}

		var init = function() {
			rptr.subscribe('.close-overlay', 'click', function(e) {
				e.preventDefault();
				var parent = e.target.parentNode;

				// Keep going until we find the actual overlay parent
				while (!rptr.has_class('overlay', parent)) { parent = parent.parentNode; }

				var overlayID = parent.getAttribute('id');
				_overlays[overlayID].hide();
			});
		}

		var api = {
			overlay : function(config) {
				return _overlays[config.id] = new Overlay(config);
			},

			/**
			* Provides a public method for adding templates to the canopy
			* templates collection for later use
			*
			* @param {String} Template Name
			* @param {HTMLElement} Element which makes up the template
			*/
			add_overlay_template : function (name, el) {
	            _html.templates[name] = el;
			}
		}

		events.ready(init);
		return api;
	})()
	
	// setup API
	api = {
		config : config
	}
	
	// merge into API
	core.extend(core);
	core.extend(ajax);
	core.extend(dom);
	core.extend(events);
	core.extend(overlays);
		
	return api;
})();