W$LICENSE="Apache License 2.0, Copyright(c)2018-2026, Csaba Veg.\n"+
"Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except in compliance with the License.\n"+
"You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0\n"+
"Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n"+
"See the License for the specific language governing permissions and limitations under the License.";

//#region OBJECT_HANDLING

/** Is the value a non-null, non-array Object. */
function w$isObject(v){ return (typeof(v)=='object' && v!=null && !(Array.isArray(v) || v.$w$isArray)); }
/** Is the value an array, (i.e., not a non-array Object). */
function w$isArray(v){ return (typeof(v)=='object' && v!=null && (Array.isArray(v) || v.$w$isArray)); }

/** Sentinel check: returns `true` only for explicit `undefined`; otherwise returns `undefined`. */
function w$undefined(v){ return arguments.length && typeof(v)=='undefined' ? true : void(0); }

//** Ensures `derivedObject` inherits from `baseObject`/`baseObject.prototype`; keeps existing chain when already compatible. */
//function w$derive(baseObject,derivedObject){ let base;
//  if((base=(baseObject && baseObject.prototype) ? baseObject.prototype : baseObject) && !base.isPrototypeOf(derivedObject))
//    Object.setPrototypeOf(derivedObject,base);
//  return derivedObject;
//}
/** Deletes `element` from `array` (if present) and returns the removed/original element. */
function w$delete(array,element){ let idx;
  return w$isArray(array) && (idx=array.indexOf(element))!=-1 ? array.splice(idx,1)[0] : element;
}

/** Sets field `name` on `object`; dotted names create nested objects; `undefined` is stored as `null`. */
function w$setField(object,name,value){ let i,o,nm;
  if((i=name.indexOf('.'))!=-1){
    if(typeof(o=object[nm=name.substring(0,i)])!='object' || o==null || w$isArray(o)){ object[nm]=o={}; }
    w$setField(o,name.substring(i+1),value);
  }else{
    object[name]=(typeof(value)!='undefined')?value:null;
  }
  return object;
}
/** Deletes field `name` from `object`; dotted names traverse nested plain objects when present. */
function w$deleteField(object,name){ let i,o,nm;
  if((i=name.indexOf('.'))==-1){ delete object[name];
  }else if((o=object[nm=name.substring(0,i)]) && typeof(o)=='object' && !w$isArray(o)){
    w$deleteField(o,name.substring(i+1));
  }
  return object;
}
/** Assigns `source` into `object` (deep for nested plain objects).
 * `fields` may be `skipNull`, a comma list/array, and `target:source` mappings; missing values remove target fields.
 */
function w$assign(object,source,fields,fields2){ let v,idx,skipNull=false;
  if(source==null || typeof(source)!='object') return source; // passthrough for non-objects
  if(typeof(fields)=='boolean'){ skipNull=fields; fields=fields2; } // optional 3rd arg may be skipNull
  if(!!fields){ if(typeof(fields)=='string'){ fields=fields.split(','); } // explicit field list / mappings
    for(let i=0; i<fields.length; ++i){ let nm=fields[i],name=nm;
      if((idx=nm.indexOf(':'))!=-1){ name=nm.substring(0,idx); nm=nm.substring(idx+1); } // target:source
      v=source[nm];
      if(skipNull ? (v!=null) : (typeof(v)!='undefined')) w$setField(object,name,v); else w$deleteField(object,name); // assign or remove
    }
  }else{ let a=Object.keys(source); // copy all own enumerable fields
    for(let i=0,l=a.length; i<l; ++i){ let name=a[i], value=object[name]; v=source[name];
      if(w$isObject(value) && w$isObject(v)){ w$assign(value,v,skipNull); // deep-merge nested plain objects
      }else{
        if(skipNull ? (v!=null) : (typeof(v)!='undefined')) w$setField(object,name,v); else w$deleteField(object,name); // replace or remove leaf value
      }
    }
  }
  return object;
}
/** Converts `v` by `trueish`: returns `1|0`, string/null, or boolean. */
function w$is(v,trueish){ v=v && (typeof(v.length)=='undefined' || v.length>0);
  if(1===trueish){ return v ? 1:0; }
  if(typeof(trueish)=='string'){ return v ? trueish : null; }
  return !!v; // true or false
}

/** Toggle prefix marking a variable that must be switched on/off (e.g., `w:set="+-switch"`). */
var W$TOGGLE='+-';
/** Toggles `v` and converts it by `trueish`; handles '0'/'1'/'true'/'false' strings. */
function w$toggle(v,trueish){
  if(v==='0') v=0; else if(v==='1') v=1;
  else if(v==='true') v=true; else if(v==='false') v=false;
  else if(typeof(v)=='string' && v===trueish) v=true;
  return w$is(!v,trueish);
}

//#endregion
//#region SAY

/** Start marker for a localizable phrase (e.g., "§Hi§", "§Hi|Ciao§"). */
var W$SAY_BEGIN='\u00A7'; // §
/** End code of a localized part of the string. */
var W$SAY_END='\u00A7'; // §
/** Separator that marks the start of the default phrase in a localizable token. */
var W$SAY_CODE='|';

/** Localizes one phrase token; supports `key|default`, dictionary lookup, and fallback to `def`/input. */
function w$say(s,def){ let code,zi,v,undef; if(!!(undef=(typeof(def)=='undefined'))) def=s;
  // Default fallback is the input token when no explicit `def` is given.
  if((zi=s.indexOf(code=W$SAY_CODE))!=-1){
    // `|text` means literal default only, without dictionary lookup.
    if(zi==0){ return s.substring(code.length); }
    // Split `key|default` into lookup key and fallback text.
    def=s.substring(zi+code.length); s=s.substring(0,zi);
  }
  // Dictionary value wins over the fallback/default.
  if(typeof(W$DICTIONARY)!='undefined' &&(v=W$DICTIONARY[s])!=null) def=v;
  // Log only when there was no explicit fallback text.
  else if(undef) DEV&& console.log('SAY:'+s+':');
  return def;
}

/** Localizes all `W$SAY_BEGIN...W$SAY_END` tokens in a string, preserving non-token parts. */
function w$says(s){ let i,j, begin,end;
  // Fast path when there is no localizable token in the string.
  if(!s || (i=s.indexOf(begin=W$SAY_BEGIN))==-1 || (j=s.indexOf(end=W$SAY_END,i+begin.length))==-1) return s;
  // Fast path when there is only one token.
  if(s.indexOf(begin,j+end.length)==-1) return s.substring(0,i)+w$say(s.substring(i+begin.length,j))+s.substring(j+end.length);
  let from=0, a=[];
  for( ; i!=-1 && (j=s.indexOf(end=W$SAY_END,i+begin.length))!=-1; from=j+end.length, i=s.indexOf(begin,from)){
    // Append the non-token prefix plus the localized chunk.
    a.push(s.substring(from,i));
    // Delegate token-localization logic (`key|default`, dictionary, logging) to `w$say`.
    a.push(w$say(s.substring(i+begin.length,j)));
  }
  // Append the remaining tail and join only once.
  a.push(s.substring(from));
  return a.join('');
}
//#endregion
//#region ELEMENT_HANDLING

/** Queries subelements by selector phrase (`;`, `#id`, leading-space CSS, or `=name`).
 * `doc` may be one root or a collection; `fn` may be callback or `true` to return all matches.
 * <li> Normalize selector shorthand and one-or-many roots into a common query path.
 * <li> Collect first-match or all-match results, optionally across multiple selectors.
 * <li> Apply an optional callback after the result shape has been normalized.
 * <li> Support `#id`, `=name`, CSS, and direct-child-chain selector shortcuts.
 * <li> Collapse or preserve array mode according to callback/all-match intent.
 */
function w$query(s,doc,fn){ var dd=doc||document, r, ra=false;
  function w$isElements(v){ return v && (v instanceof HTMLCollection || typeof(NodeList)!='undefined' && v instanceof NodeList || Array.isArray(v)); }
  // Default to the root itself, and pass element-lists through unchanged.
  if(!s){ r=dd;
  }else if(typeof(s)=='object'){
    ra=w$isElements(s); r=s;
  }else{ var sel; if(s.indexOf(';')!=-1){ sel=s.split(';'); r=[]; ra=true; }
    // Multiple selectors, callbacks, or list-roots force array mode.
    if(fn || w$isElements(dd)){ r=[]; ra=true; }
    var aL=Array.isArray(sel) ? sel.length :null;
    for(var aI=0; aL===null ? (aI==0) : (aI<aL); ++aI){ if(aL!==null){ s=sel[aI]; }  var isId=false;
      // Normalize shorthand selector forms before querying each root.
      if(s.startsWith(' ')){ s=s.substring(1);
      }else if(s.startsWith('#')){ isId=true;
        /*for(var i=base; i<s.length; ++i){ var c=s.charAt(i);
          var ok=('a'<=c&&c<='z'||'A'<=c&&c<='Z') || (i>base && ('0'<=c&&c<='9'||c=='_'||c=='-'))
          if(!ok){ isId=false; break; }
        }*/
      }else if(s.startsWith('=')){ s="*[name='"+s.substring(1)+"']";
      }
      var dIsList=w$isElements(dd), dLength=dIsList ? dd.length : 1;
      for(var di=-1; ++di<dLength; ){ var d=dIsList ? dd[di] : dd;
        if(s.indexOf('>')==0){
          // Walk direct-child chains (`>div.row>span`) without delegating to CSS selectors.
          var w$sub=function w$sub(sel,el,r){ var is=sel.indexOf('>');
            var ss=(is!=-1?sel.substring(0,is):sel).split('.');
            L:for(var idx=0; idx<el.children.length; ++idx){ var c=el.children[idx];
              if(ss[0] && ss[0]!='*' && ss[0].toUpperCase()!=c.nodeName) continue;
              for(var j=1; j<ss.length; ++j){
                if(!c.classList.contains(ss[j])) continue L;
              }
              if(is!=-1){ return w$sub(sel.substring(is+1),c,r)
              }else{ if(Array.isArray(r)) r.push(c);
                if(!fn) return c;
              }
            }
            return null;
          }
          var el=w$sub(s.substring(1),d,r); if(el && !ra) r=el;
        }else if(isId){
          var el=document.getElementById(s.substring(1)); if(ra) r.push(el); else r=el;
        }else{
          if(ra){ var els=d.querySelectorAll(s); for(var i=0; i<els.length; ++i) r.push(els[i]);
          }else{ r=d.querySelector(s);
          }
        }
      }
      if(!ra) break;
    }
  }
  // Collapse array mode unless the caller explicitly asked for all matches.
  if(fn){ if(!w$isElements(r)){ r=(r ? [r] : []);  }
  }else if(w$isElements(r)){ r=r.length?r[0]:null;
  }
  // Apply the optional callback after result normalization.
  if(typeof(fn)=='function'){
    for(var i=0; i<r.length; ++i){ fn(r[i]) }
  }
  return r;
}

/** Array-mode wrapper over `w$query`: always returns all matches; optional callback is applied per match. */
function w$queryAll(sel,doc,fn){ return w$query(sel,doc,fn||true); }

/** Gets/sets visibility by `display`; `W$TOGGLE` toggles and `undefined` reads current state. */
function w$show(el,value){ if(value==W$TOGGLE) value=!w$show(el);
  // Read the current visibility when no target value was given.
  if(typeof(value)=='undefined'){ return window.getComputedStyle(el).display!='none';
  }else{
    // Hide while remembering the prior display mode for later restore.
    if(!value){ var s;
      if(!(el.$w ||(el.$w={})).$styleDisplay && (s=window.getComputedStyle(el).display)!='none') el.$w.$styleDisplay=s;
      el.style.display='none'; return false;
    }else{
      // Restore the remembered display, or fall back to a tag-based default.
      if(window.getComputedStyle(el).display!='none'){ // already set
      }else if(el.$w && el.$w.$styleDisplay){ el.style.display=el.$w.$styleDisplay;
      }else{ //el.removeStyle('display');
        var block=/^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes|noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$/i;
        el.style.display=block.test(el.nodeName)?'block':'inline';
      }
      return true;
    }
  }
}
/** Returns attribute value; returns `''` for present empty attrs and `null` when missing. */
function w$attribute(el,nm){ var v=el.getAttribute(nm);
  return v!=null ? v : (el.hasAttribute(nm)?'':null);
}
/** Returns true when `el` is `parent` or a descendant of `parent` (default: `document.body`). */
function w$hasParent(el,parent){ parent ||= document.body;
  for( ; el; el=el.parentElement){ if(el===parent) return true; }
  return false;
}

/** Creates and/or sets features for framework UI elements.
 * `el`: element to update, tag name to create, `''`/`#text` text-node marker, or descriptor array
 * `[tagOrElement, featureObjectOrHtml, optionalChildren]`.
 * `arg`: feature name (then `v` is used), feature object, or child array.
 * Built-ins: `w:text|w$text|''` textContent; `w:html|w$html` innerHTML; `w:add|w$add` append child(ren);
 * `w:set:X|w$set$X` set property `X`; `w:data:X|w$data$X` set/remove `data-X`; `w:style:X|w$style$X` set/clear style `X`;
 * `w:show|w$show` show/hide; `w:attr:X|w$attr$X` set/remove attribute `X`.
 * Other names map to attributes (leading `@`/`$` ignored); null/undefined removes attributes.
 * <li> Create or reuse nodes from shorthand tags, text markers, or descriptor arrays.
 * <li> Apply framework features, direct properties, attributes, and child content in one pass.
 * <li> Recurse into nested descriptors and collections to build complete UI fragments.
 * <li> Batch-apply feature objects across one element or an element collection.
 * <li> Distinguish framework `w:*` features from ordinary attribute assignments.
 */
function w$element(el,arg,v){
  // Create text nodes or new elements from shorthand descriptors.
  if(typeof(el)=='string'){ if(!el || el=='#text') return document.createTextNode(arg);
    el=document.createElement(el);
  }else if(Array.isArray(el)){ var e=el[0],d=el[1];
    // Array descriptors allow `[tag, featureOrHtml, children]`.
    if(typeof(d)=='object' || !e){ e=w$element(e,d)
    }else{ e=document.createElement(e); e.innerHTML=d;
    }
    if(typeof(d=el[2])=='string'){
      e.innerHTML=d;
    }else if(Array.isArray(d)){
      // Convert child descriptors into DOM nodes before appending.
      for(var i=0; i<d.length; ++i){
        e.appendChild(w$element(d[i]));
      }
    }
    return e;
  }
  // Apply feature changes to one element or to each element of a list.
  var a=el, aL=(el && (el instanceof HTMLCollection || typeof(NodeList)!='undefined' && el instanceof NodeList || Array.isArray(el)))?el.length:null;
  if(typeof(arg)=='string'){
    for(var aI=0; aL===null?(aI==0):(aI<aL); ++aI){ var n=arg,k; if(aL!==null){ el=a[aI]; }
      // `w:` / `w$` features map to framework behaviors; others become attributes.
      if(n==""){ el.textContent=(v||'');
      }else if(n.startsWith("w:") || n.startsWith("w$")){
        if(n=="w:text" || n=="w$text"){ el.textContent=(v||'');
        }else if(n=='w:html' || n=='w$html'){ el.innerHTML=(v||'');
        }else if(n=="w:add" || n=="w$add"){
          // Append one child or all children of the given descriptor array.
          if(Array.isArray(v)){
            for(var j=0; j<v.length; ++j){
              el.appendChild(w$element(v[j]));
            }
          }else{ el.appendChild(v);
          }
        }else if(n.startsWith(k="w:set:") || n.startsWith("w$set$")){ el[n.substring(k.length)]=v;
        }else if(n.startsWith(k="w:data:") || n.startsWith("w$data$")){ n='data-'+n.substring(k.length);
          if(v!=null) el.setAttribute(n,v); else el.removeAttribute(n);
        }else if(n.startsWith(k="w:style:") || n.startsWith("w$style$")){ n=n.substring(k.length);
          if(v!=null) el.style[n]=v; else el.style[n]=null;
        }else if(n=="w:show" || n=="w$show"){
          w$show(el,typeof(v)!='undefined'?v:null);
        }else{
          if(n.startsWith(k="w:attr:") || n.startsWith("w$attr$")) n=n.substring(k.length);
          if(v!=null) el.setAttribute(n,v); else el.removeAttribute(n);
        }
      }else{
        if(n.startsWith("@")||n.startsWith("$")) n=n.substring(1);
        if(v!=null) el.setAttribute(n,v); else el.removeAttribute(n);
      }
    }
  }else if(typeof(arg)=='object'){
    if(Array.isArray(arg)){
      // Treat array arguments as children to append.
      for(var j=0; j<arg.length; ++j){
        el.appendChild(w$element(arg[j]));
      }
    }else{
      // Treat object arguments as a batch of feature assignments.
      for(var aI=0; aL===null?(aI==0):(aI<aL); ++aI){ if(aL!==null){ el=a[aI]; }
        for(var n in arg){ w$element(el,n,arg[n]); }
      }
    }
  }
  return el;
}
/** Removes `e` from DOM and returns whether it was removed. */
function w$removeElement(e){
  if(e && e.parentElement){ e.parentElement.removeChild(e); return true; }else{ return false; }
}

/** Converts array/string definitions to `Map`; objects are returned as-is; strings accept `;;`/newline and `key=value`. */
function w$definition(def){ if(!def || w$isObject(def)) return def; var x=new Map();
  // Normalize string definitions to one `key=value` entry per line.
  if(!w$isArray(def)) def=def.replace(/;;/g,'\n').split('\n');
  // Split each line into name/value, using the whole token when `=` is missing.
  for(var i=0, l=def.length; i<l; ++i){ var d, idx; if(!(d=def[i].trim())) continue; var n=d, v=d;
    if((idx=d.indexOf('='))!=-1){ n=d.substring(0,idx); v=d.substring(idx+1); }
    x.set(n,v);
  }
  return x;
}
/** Applies definition entries to `el`; supports `Map`/object/string forms and optional key prefix filtering.
 * <li> Iterate matching entries from maps, objects, or inline `key=value` text blocks.
 * <li> Apply framework-style keys to the element while collecting the filtered result set.
 * <li> Forward non-framework keys to the optional callback for custom handling.
 * <li> Skip internal `@` entries and ignore keys outside the requested prefix scope.
 * <li> Return the matched subset so callers can reuse the normalized definition view.
 */
function w$defineElement(el,def,prefix,fn){ if(!def) return; var x={}, xv; prefix=prefix||'';
  // Apply Map definitions directly, optionally filtered by a prefix.
  if(def instanceof Map){
    for (let [n,v] of def){
      // Skip unrelated keys and internal `@` entries before dispatching.
      if(prefix){ if(!n.startsWith(prefix)){ continue; }else{ n=n.substring(prefix.length)} }else if(n.charAt(0)=='@'){ continue; }
      x[n]=v;
      // Framework keys go to `w$element`; others are exposed through the callback.
      if(n.charAt(0)=='$' || n.startsWith('w:')){
        if(el) w$element(el,n,v);
      }else if(fn){ fn(el,n,v);
      }
    }
  }else if(w$isObject(def)){
    // Plain objects are copied to the return map while applying matching entries.
    for(var n in def){
      if(prefix){ if(!n.startsWith(prefix)){ continue; }else{ n=n.substring(prefix.length)} }else if(n.charAt(0)=='@'){ continue; }
      x[n]=xv=def[n];
      if(n.charAt(0)=='$' || n.startsWith('w:')){
        if(el) w$element(el,n,xv);
      }else if(fn){ fn(el,n,xv);
      }
    }
    return x;
  }else{
    // String and array definitions are parsed line-by-line like `key=value`.
    if(!w$isArray(def)) def=def.replace(/;;/g,'\n').split('\n');
    for(var i=0; i<def.length; ++i){ var d, idx; if(!(d=def[i].trim())) continue; var n=d, v=d;
      if((idx=d.indexOf('='))!=-1){ n=d.substring(0,idx); v=d.substring(idx+1); }
      if(prefix){ if(!n.startsWith(prefix)){ continue; }else{ n=n.substring(prefix.length)} }else if(n.charAt(0)=='@'){ continue; }
      x[n]=v;
      if(n.charAt(0)=='$' || n.startsWith('w:')){
        if(el) w$element(el,n,v);
      }else if(fn){ fn(el,n,v);
      }
    }
  }
  return x;
}
/** Builds `<option>` elements from `def` and applies per-option defs via `@@.` and `@name.` prefixes. */
function w$defineSelect(el,def,val){ def=w$definition(def); el.innerHTML='';
  // Build one option per top-level entry, then apply generic and per-name option defs.
  w$defineElement(el,def,'',function(_el,n,v){ var nn='@'+n+'.';
    var e=el.appendChild(w$element('option',{'w:set:value':n,'w:text':v}));
    if(val==n || val==null && n=='') e.selected=true;
    // `@@.` targets every option, while `@name.` targets only the matching option.
    w$defineElement(e,def,'@@.');
    w$defineElement(e,def,nn);
  });
  return el;
}
/** Click helper for custom checkbox/radio wrappers: forwards clicks and stops bubbling. */
function w$inputClick(event){ var el=event.target;
  if(!(el.nodeName=='INPUT' && (el.type=='radio'||el.type=='checkbox'))){
    w$queryAll("input[type='radio'],input[type='checkbox']",el.parentElement,function(e){ e.click(); });
  }
  event.stopPropagation(); event.cancelBubble=true; return true;
}
/** Creates a styled checkbox wrapper (`span + input + label span`) from element attributes. */
function w$defineCheckbox(el,name,def,val){ el.innerHTML='';
  var ex=el.appendChild(w$element('span',{$class:'wcheckbox',onclick:'return w$inputClick(event,this)'}));
  ex.appendChild(w$element('input',{type:'checkbox', name:name, value:el.getAttribute('value')}));
  ex.appendChild(w$element('span',{'w:text':el.getAttribute('w:title')}));
}
/** Creates styled radio options from `def` and wires checked/value expressions. */
function w$defineRadio(el,name,def,val){ def=w$definition(def); el.innerHTML='';
  // Build each radio wrapper from the definition entries.
  w$defineElement(el,def,'',function(_el,n,v){ var nn='@'+n+'.';
    var ex=el.appendChild(w$element('span',{$class:'wradio',style:'white-space:nowrap;',onclick:'return w$inputClick(event,this)'}));
    var e=ex.appendChild(w$element('input',{type:'radio', name:name, value:n}));
    // Honor the requested selected value before deriving dynamic checked rules.
    if(val==n || val==null && n=='') e.checked=true;
    ex.appendChild(w$element('span',{'w:text':v}));
    // Prefer an existing `w:set` expression for checked-state binding, otherwise derive it from `value`.
    if(e.hasAttribute('w:set') && !e.hasAttribute('w:attr:value') && !e.hasAttribute('w:set:value')){
      v='='+w$attribute(e,'w:set');
    }else{ v=w$attribute(e,'value'); v=v!=null ? '="'+v+'"' : '';
    }
    // Only auto-generate `w:attr:checked` when no explicit checked rule exists yet.
    if(name && !e.hasAttribute('checked') && !e.hasAttribute('w:attr:checked') && !e.hasAttribute('w:set:checked')){
      e.setAttribute('w:attr:checked',name+v+"?'checked':null");
    }
    // Apply `@name.` option-specific defs to the radio input.
    w$defineElement(e,def,nn);
  });
  return el;
}

//#endregion
//#region CHECK_AND_WARNING

/** Returns true when `arg` contains active warning fields (`_w*` or `*warning`). */
function w$hasWarning(arg){
  // Scan own warning slots only; falsy warnings do not count as active.
  if(arg){ var a=Object.getOwnPropertyNames(arg);
    for(var i=0; i<a.length; ++i){ var k=a[i];
      if(k.startsWith('_w_') || k=='_w' || k.endsWith('$warning')){
        if(arg[k]) return true;
      }
    }
  }
  return false;
}

/** Clears warning/message fields on `$this`, or maps `_w_*`/`_m_*` fields from `arg` to `*warning`/`*message`. */
function w$warning($this,arg){ if($this instanceof HTMLElement) $this=w$data($this); if(!$this) return;
  // Without `arg`, clear previously stored warning/message fields.
  if(!arg){ var a=Object.getOwnPropertyNames($this);
    for(var i=0; i<a.length; ++i){ var k=a[i];
      if(k.endsWith('$warning') || k.endsWith('$message'))
        if(!$this.$w$proxy || $this[k]!=null){
            Object.defineProperty($this,k,{ enumerable:DEV, writable:true, value:undefined, })
        }
    }
  // With `arg`, map `_w*` / `_m*` entries to localized `*warning` / `*message` fields.
  }else{ var args=Object.getOwnPropertyNames(arg), was=false;
    for(var i=0; i<args.length; ++i){ var k=args[i],pre;
      if(k.startsWith(pre='_w_') || k==(pre='_w')){ var warn=arg[k]; warn=warn?w$say(warn,warn):undefined;
        was=true; Object.defineProperty($this,k.substring(pre.length)+'$warning',{ enumerable:DEV, writable:true, value:warn, })
      }else if(k.startsWith(pre='_m_') || k==(pre='_m')){ var warn=arg[k]; warn=warn?w$say(warn,warn):undefined;
        was=true; Object.defineProperty($this,k.substring(pre.length)+'$message',{ enumerable:DEV, writable:true, value:warn, })
      }
    }
    return was;
  }
}

/** Runs element-level validation and stores `<name>$warning` on bound data object. */
function w$check(el,value){ if(!el) return; if(el instanceof Event) el=el.target; var name,e,$,msg;
  // Let browser validity update first, then resolve the bound data object.
  if(el.checkValidity) el.checkValidity();
  if(!!(name=el.getAttribute('name')) && !!(e=w$element$(el)) && !!($=w$data(e))){ var fn;
    // Resolve the current value only when the caller did not supply one.
    if(typeof(value)=='undefined') value=w$get(el);
    if(typeof(value)!='undefined'){ var warn=name+'$warning';
      // Prefer element-aware `$check`, then fall back to value-only `$valid`.
      if(typeof(fn=$[name+'$check'])=='function'){
        msg=fn.call($,el,e,value);
      }else if(typeof(fn=$[name+'$valid'])=='function'){
        msg=fn.call($,value);
      }
      // Avoid redundant proxy writes when the warning text did not change.
      if(!$.$w$proxy || $[warn]!=msg){
        Object.defineProperty($,warn,{ enumerable:DEV, writable:true, value:msg||undefined, })
      }
    }
  }
  return msg;
}

/** Runs object/field validators and returns normalized warning object (`_w*`) or null.
 * <li> Resolve the validation host from the element, event target, or bound data object.
 * <li> Execute whole-object checks first unless field-only validation was requested.
 * <li> Normalize validator results into the `_w*` warning-object contract or `null`.
 * <li> Aggregate per-field `...$valid` hooks when a whole-object validator is absent.
 * <li> Treat empty, undefined, and blank-object results as "no warning".
 */
function w$checkArg(el,name,arg,fieldsOnly){ var $=el, fn, r; if(!arg) return null;
  if(el instanceof Event){ el=el.target; }
  // Prefer bound data for validator lookup, but fall back to the original element/object.
  if(el instanceof HTMLElement){ $=w$data(el)||$; }
  // Try whole-object validators before per-field validators unless `fieldsOnly` was requested.
  if(!fieldsOnly && (el instanceof HTMLElement) && typeof(fn=$[(name||'')+'$check'])=='function'){
    r=fn.call($,el,arg);
  }else if(!fieldsOnly && typeof(fn=$[(name||'')+'$valid'])=='function'){
    r=fn.call($,arg);
  }else{ var a=Object.getOwnPropertyNames(arg), r={};
    // Collect per-field warnings from `name$field$valid` or `field$valid`.
    for(var i=0; i<a.length; ++i){ var k=a[i], w;
      if(name && typeof(fn=$[name+'$'+k+'$valid'])=='function'){
        w=fn.call($,arg[k]); r['_w_'+k]=w||undefined;
      }else if(typeof(fn=$[k+'$valid'])=='function'){
        w=fn.call($,arg[k]); r['_w_'+k]=w||undefined;
      }
    }
  }
  // Normalize string and empty-object results to the warning-object contract.
  if(typeof(r)=='string'){
    return r ? {_w:r} : null;
  }else if(!r || typeof(r)!='object' || Object.keys(r).length===0 && r.constructor===Object){
    return null;
  }
  return r;
}

/** Returns true when `a` is an ancestor (or self) of `el`. */
function w$hasAncestor(el,a){
  for( ; el && el!=document; el=el.parentElement){ if(el==a) return true;  }
  return false;
}

/** Finds parent/self by selector spec: `TAG`, `.class`, `TAG.class`, or class-name array. */
function w$parent(el,clazz,up){ if(typeof(el)=='string') el=w$query(el); var idx, nodeName;
  if(!clazz) throw new Error("Missing description parameter!")
  // Parse `TAG.class`, `.class`, `TAG`, or class-array selector forms.
  if(typeof(clazz)=='string'){
    if(clazz.charAt(0)=='.'){ nodeName=null; clazz=clazz.substring(1);
    }else if((idx=clazz.lastIndexOf('.'))==-1){ nodeName=clazz; clazz=null;
    }else if(idx==0){ nodeName=null; clazz=clazz.substring(1);
    }else{ nodeName=clazz.substring(0,idx); clazz=clazz.substring(idx+1);
    }
  }
  if(Array.isArray(clazz) && clazz.length==0) clazz=null;
  // Optionally start above the current element, then walk ancestors until a match is found.
  if(el && up) el=el.parentElement;
  for( ; el && el!=document; el=el.parentElement){ var classes=el.classList;
    if(nodeName && nodeName!=el.nodeName) continue;
    if(!clazz) return el;
    if(classes && classes.length){
      if(typeof(clazz)=='string'){               if(classes.contains(clazz)) return el;
      }else{ for(var i=0; i<clazz.length; ++i){ if(classes.contains(clazz[i])) return el; }
      }
    }
  }
  return null;
}
/** Finds descendant/sibling/child by selector spec (`TAG`, `.class`, `TAG.class`, array), mode, and depth.
 * <li> Parse compact selector forms into node-name and class constraints.
 * <li> Walk siblings, direct children, or descendants according to the requested mode.
 * <li> Return the first match or accumulate matches when an output list is provided.
 * <li> Support recursive selector arrays for chained child lookups.
 * <li> Limit descent by numeric depth while preserving traversal direction rules.
 */
function w$child(el,clazz,mode,lvl){ if(typeof(el)=='string') el=w$query(el); var nodeName;
  if(!clazz) throw new Error("Missing description parameter!")
  // Parse `TAG.class`, `.class`, `TAG`, or class-array selector forms.
  if(typeof(clazz)=='string'){ var idx;
    if(clazz.charAt(0)=='.'){ nodeName=null; clazz=clazz.substring(1);
    }else if((idx=clazz.lastIndexOf('.'))==-1){ nodeName=clazz; clazz=null;
    }else if(idx==0){ nodeName=null; clazz=clazz.substring(1);
    }else{ nodeName=clazz.substring(0,idx); clazz=clazz.substring(idx+1);
    }
  }
  if(Array.isArray(clazz) && clazz.length==0) clazz=null;
  // Apply sibling/child stepping before recursive search when requested by `mode`.
  if(mode==']') el=el.lastElementChild;
  else if(mode=='>') el=el.nextElementSibling;
  else if(mode=='<') el=el.previousElementSibling;
  else if(mode=='[') el=el.firstElementChild;
  var list=Array.isArray(lvl) ? lvl : null;
  if(typeof(lvl)!='number') lvl=999;
  // Search by increasing depth; when `lvl` is an array, collect every match.
  function w$findChild(el,lvl,fw,nodeName,clazz,list){ var r; if(!el) return null;
    if(lvl>1){ --lvl;
      for(el=fw?el.firstElementChild:el.lastElementChild; el; el=fw?el.nextElementSibling:el.previousElementSibling){
        if(!!(r=w$findChild(el,lvl,fw,nodeName,clazz,list))){
          if(!list) return r; else list.push(r);
        }
      }
      if(list && list.length) return list;
    }else if(lvl==1){ var classes=el.classList;
      if(nodeName && nodeName!=el.nodeName) return null;
      // Accept the node when the class filter matches, or when no class filter was given.
      if(!clazz) return el;
      if(classes && classes.length){
        if(typeof(clazz)=='string'){              if(classes.contains(clazz)) return el;
        }else{ for(var i=0; i<clazz.length; ++i){ if(classes.contains(clazz[i])) return el; }
        }
      }
    }
    return null;
  }
  for(var l=0; ++l<lvl; ){ var r;
    if(!!(r=w$findChild(el,l,mode=='[' || mode=='>',nodeName,clazz, list))) return r;
  }
  return null;
}
/** Finds first descendant that is bound to data object `$`; optional `clazz` is resolved via `w$child`. */
function w$child$(el,$,clazz){ if(typeof(el)=='string') el=w$query(el); if(!el) return null;
  // Walk outward by depth until a descendant bound to `$` is found.
  function w$findChild(el,$,lvl){ var r;
    if(lvl>1){ --lvl;
      for(el=el.firstElementChild; el; el=el.nextElementSibling){
        if(!!(r=w$findChild(el,$,lvl))){ return r; }
      }
    }else if(lvl==1){
      if(el && el.$w && ((el.$w.$ && (el.$w.$===$ || el.$w.$.$w$object===$)) || el.$w.$$===$)) return el;
    }
    return null;
  }
  // Optionally refine the found bound element through the normal child selector helper.
  for(var l=0; ++l<999; ){ var r;
    if(!!(r=w$findChild(el,$,l))){
      if(clazz) r=w$child(r,clazz);
      return r;
    }
  }
  return null;
}

/** Selects full content of an element/input, or handles selection on event target and blocks default when needed. */
function w$selectAll(ev,pass){
  // Select everything inside a concrete element immediately.
  if(ev instanceof HTMLElement){ var sel=window.getSelection(); sel.removeAllRanges();
    if(ev.nodeName=='INPUT'){ ev.focus(); ev.setSelectionRange(0,ev.value.length); //ev.select(); NO:Safari
    }else{ var range=document.createRange(); range.selectNodeContents(ev); sel.addRange(range);
    }
  // When called from an event, select the target only if it is not already active/selected.
  }else if(ev instanceof Event){ var el=ev.target;
    var sel,has=document.activeElement==el || (sel=window.getSelection()) && sel.baseNode==el;
    if(!has && el.nodeName=='DIV' && el.getAttribute('contenteditable')!='true') has=true;
    if(!has){ w$selectAll(el); if(!pass) return w$no(ev); }
  }
}

//#endregion
//#region PARAMETERS_AND_COOKIES

/** Parses query params into `arg`; repeated names become arrays; default source is `window.location.search`. */
function w$getParameters(arg,query){ query ??= window.location.search; arg ||= {};
  // Decode form-style query parts, treating `+` as space and tolerating bad escapes.
  function w$decodeQuery(s){ if(s==null) return s; s=s.replace(/\+/g,' ');
    try{ return decodeURIComponent(s); }catch(err){ return s; }
  }
  // Strip hash and leading `?` before splitting the query string.
  var idx; if((idx=query.indexOf('#'))!=-1) query=query.substring(0,idx);
  if(query.startsWith('?')) query=query.substring(1);
  if(query){ var params=query.split("&"), seen=Object.create(null);
    // Decode each pair and promote repeated names to arrays.
    for(var i=0; i<params.length; ++i){ var param=params[i], p;
      if(!param) continue;
      var name=w$decodeQuery((p=param.indexOf('='))==-1 ? param : param.substring(0,p));
      var v, value=p==-1 ? null : w$decodeQuery(param.substring(p+1));
      if(!(name in seen)){ arg[name]=value; seen[name]=1;
      }else{ if(w$isArray(v=arg[name])){ v.push(value); }else{ arg[name]=[v, value]; }
      }
    }
  }
  return arg;
}

/** Merges `arg` into URL query; `undefined` removes params; preserves path and `#hash`. */
function w$setParameters(arg,loc){ loc ??= window.location.href; var idx,search='',hash='';
  // Split the URL into path, query, and hash so we can rebuild only the query part.
  if((idx=loc.indexOf('#'))!=-1){ hash=loc.substring(idx); loc=loc.substring(0,idx); }
  if((idx=loc.indexOf('?'))!=-1){ search=loc.substring(idx); loc=loc.substring(0,idx); }
  // Merge existing params with overrides, then serialize them back to query form.
  var P=w$assign(w$getParameters({},search),arg),s="",sep='?';
  function w$addParam(k,v){ if(typeof(v)=='undefined') return; s+=sep+encodeURIComponent(k);
    if(v!=null) s+='='+encodeURIComponent(v); sep='&';
  }
  // Preserve repeated parameters by emitting one pair per array item.
  for(var i=0,a=Object.keys(P),l=a.length; i<l; ++i){ var k=a[i],v=P[k];
    if(w$isArray(v)){ for(var j=0; j<v.length; ++j){ w$addParam(k,v[j]); }
    }else{ w$addParam(k,v);
    }
  }
  if(search.indexOf('?')!=-1 && s.indexOf('?')==-1) s="?";
  return loc+s+hash;
}
/** Sets cookie; omitted `days` creates a session cookie, positive days persist, non-positive days expire it. */
function w$setCookie(name,value,days){
  // Omitted `days` means session-cookie; non-positive values expire immediately.
  var expires='';
  if(days!=null) expires="; expires="+new Date(days>0 ? Date.now()+(days*24*60*60*1000) : 0).toUTCString();
  document.cookie=name+"="+encodeURIComponent(value==null?'':value)+expires+"; path=/";
}
/** Gets cookie value by name, decoded when possible; returns `def` if missing. */
function w$getCookie(name,def){ var nameEQ=name+"=", c$=document.cookie.split(';');
  // Trim cookie fragments until the requested name matches exactly.
  for(var ci=0; ci<c$.length; ++ci){ var c=c$[ci];
    while(c.startsWith(' ')) c=c.substring(1);
    if(c.startsWith(nameEQ)){ var v=c.substring(nameEQ.length);
      // Decode modern encoded values, but keep legacy raw values readable too.
      try{ return decodeURIComponent(v); }catch(err){ return v; }
    }
  }
  return def;
}

//#endregion
//#region HTML_CONTENT

/** Allowed HTML element names after normalization/sanitization. */
var W$HTMLTAGS=['LI','UL','OL','DL','SPAN','B','STRONG','I','U','STRIKE','BR','TT','CODE','PRE','P','A','IMG'];
/** Allowed HTML attributes after normalization. */
var W$HTMLATTRIBUTES=['style','src','width','height','href','title'];
/** Allowed inline style keys after normalization. */
var W$HTMLSTYLES=['color','backgroundColor'];
/** URL matcher used to convert plain-text links into `<a href>`. */
var W$HTMLURL=/(http[s]?[:]\/\/[^\s"'<>]+)/;

/** Normalizes editable HTML in-place: strips disallowed tags/attrs/styles, fixes links, and flattens unsupported nodes.
 * <li> Traverse the editable fragment and remove unsupported attributes, styles, and tags.
 * <li> Preserve allowed text/link structure while flattening or rewriting invalid markup.
 * <li> Normalize adjacent text and URL fragments after structural edits.
 * <li> Convert plain-text URLs into anchors when link creation is allowed.
 * <li> Remove empty text nodes and normalize the final child-node sequence in place.
 */
function w$normalizeHTML(el,pre,txt){
  try{
    // Walk child nodes in place, sanitizing elements and normalizing text/url fragments.
    for(var i=0; i<el.childNodes.length; ++i){ var e=el.childNodes[i];
      if(e.nodeType==1){
        // Drop disallowed attributes and inline styles before recursing into children.
        for(var ai=e.attributes.length; --ai>=0; ){ var n=e.attributes[ai].name;
          if(!W$HTMLATTRIBUTES.includes(n.toLowerCase())){ e.removeAttribute(n); }
        }
        for(var si=e.style.length; --si>=0; ){ var xs=e.style[si], xn=xs.indexOf('-')!=-1 ? xs.replace(/-([a-z])/g,function(_m,c){ return c.toUpperCase(); }) : xs;
          if(!W$HTMLSTYLES.includes(xs) && !W$HTMLSTYLES.includes(xn)) e.style.removeProperty(xs);
        }
        if(!w$attribute(e,'style')) e.removeAttribute('style');
        w$normalizeHTML(e,pre,txt);
        // Flatten unsupported elements and normalize `<br>` handling for text/preformatted content.
        if(e.nodeName=='BR' && el.nodeName=='DIV' && i==el.childNodes.length-1){
          w$removeElement(e); --i;
        }else if(e.nodeName=='BR' && pre){
          el.insertBefore(document.createTextNode('\n'),e); w$removeElement(e);
        }else if(!W$HTMLTAGS.includes(e.nodeName) || txt){
          if(e.nodeName=='DIV'){
            el.insertBefore(pre ? document.createTextNode('\n') : document.createElement("BR"),e); ++i;
          }
          while(e.childNodes.length){ var x=e.childNodes[0];
            if(x.nodeType==1 || x.nodeType==3){
              el.insertBefore(x,e); ++i;
            }
          }
          w$removeElement(e); --i;
        }else{
          if(e.nodeName=='A'){
            var u; if(!!(u=W$HTMLURL.exec(e.textContent))){
              if(e.getAttribute('href')!=u[1]) e.setAttribute('href',u[1]);
            }
          }
        }
      }else if(e.nodeType==3 || e.nodeType==4){
        // Remove empty text nodes and split plain-text URLs into anchor nodes.
        if((e.textContent||'').length==0){
          el.removeChild(e); --i;
        }else if('A'!=el.nodeName){
          if(!txt && document.activeElement!=el){ var s=(e.textContent||''), u;
            if(!!(u=W$HTMLURL.exec(s))){ var idx=s.indexOf(u[1]);
              var a=document.createElement("a"); a.setAttribute("href", u[1]); a.textContent=u[1];
              e.textContent=s.substring(0,idx);
              el.insertBefore(a,e.nextSibling); ++i;
              if(s.length>idx+u[1].length){
                var t=document.createTextNode(s.substring(idx+u[1].length));
                el.insertBefore(t,a.nextSibling); ++i;
              }
            }
          }
        }
      }
    }
    // Merge adjacent text nodes after structural edits.
    el.normalize();
  }catch(e){ console.log(e); }
  return el;
}

/** Gets framework value from element/selector.
 * Forms return object fields; checks/radios/selects/textareas return control values; DIV may return text or normalized HTML.
 * If `w:as` is present and binding context is provided (`el$`,`$`), conversion is applied.
 * <li> Resolve selectors and collections to the concrete element being read.
 * <li> Extract values by control kind, form structure, or editable display semantics.
 * <li> Apply optional `w:as` conversions inside the current weave context.
 * <li> Aggregate named form and editable-DIV fields into structured object results.
 * <li> Handle custom wrappers such as radio DIV groups and multi-select value collection.
 */
function w$get(el,doc, el$, $){ if(typeof(el)=="string"){ el=w$query(el,doc); } var result,s;
  // Dispatch by element kind: form aggregation, control values, editable HTML, or fallback content.
  if(!el){ result=null;
  }else if(el.nodeName=='FORM'){ var result={}; var elements=el.elements, el$=w$element$(el), $=w$data(el$);
    // Aggregate named form controls into an object, skipping non-value buttons and unchecked radios.
    for(var i=0 ; i<elements.length; i++){ var item=elements.item(i), nm;
      if(item.type=='submit' && !!(nm=item.getAttribute('name'))){
        continue;
      }
      if(item.nodeName=='BUTTON' || item.type=='submit' || item.type=='button' || item.type=='reset') continue;
      if(item.type=='radio' && !item.checked){ continue;
      }else if(item.type=='checkbox' && !item.checked){
        if(item.name) w$setField(result,item.name,undefined);
        continue;
      }
      if(item.name){
        var value=w$get(item,null,el$,$);
        w$setField(result,item.name,value);
      }
    }
    // Include editable DIV fields that behave like named content controls.
    w$queryAll("div[contenteditable='true']",el,function(el){ var n;
      if(!!(n=el.getAttribute('name'))){
        w$setField(result,n,w$get(el,null,el$,$));
      }
    })
  }else if(el.nodeName=='INPUT'){
    if(el.type=='checkbox'||el.type=='radio'){ result = el.checked ? el.value : undefined;
    }else{ result=el.value;
    }
  }else if(el.nodeName=='SELECT' || el.nodeName=='DATALIST'){ var sep=''; result=undefined;
    for(var i=0; i<el.length; ++i){
      if(el.options[i].selected){ result=(result||'')+sep+el.options[i].value; sep=','; }
    }
  }else if(el.nodeName=='TEXTAREA'){
    result=el.value;
  }else if(el.nodeName=='DIV'){ var type=el.getAttribute('type');
    // Editable DIVs can represent custom radio groups, plain text, or sanitized HTML.
    if(type=='radio'){ var e=w$query("input[type=radio]:checked",el);
      result= e ? e.value : null;
    }else{
      var isText='text'==el.getAttribute('type');
      w$normalizeHTML(el,isText,isText);
      result=isText?el.textContent:el.innerHTML;
    }
  }else if((result=el.getAttribute("w:value"))!=null){ // empty
  }else{
    result=el.innerHTML;
  }
  // Apply optional `w:as` conversions to the extracted value within the binding context.
  if(typeof(result)!='undefined' && !!(s=el.getAttribute('w:as')) && el$){
    result=weave$conversion(el$,$,s,result)
  }
  return result;
}

//#endregion
//#region ASYNC

/** Lightweight RAF-based async queue; image tasks lock execution until load/error completes. */
function ASync(){
  this.queue=[]; this.locked=false; this.queueID=null; this.$sync=this.sync.bind(this);
}
ASync.prototype.exec=function(fn,src,img){
  // Treat `src` tasks specially: queue an image load and hold the queue until it settles.
  if(typeof(src)=='string'){ var self=this;
    this.exec(function(){ self.locked=true; var image=img||new Image();
      try{
        image.onload=function(){
          try{ if(fn) fn(image);
          }finally{ self.locked=false;
          }
        }
        image.onerror=function(){ self.locked=false; }
        image.src=src;
      }catch(e){ self.locked=false; throw e;
      }
    });
  }else{
    // Queue ordinary callbacks and start the RAF pump on demand.
    if(typeof(fn)!='function') return;
    this.queue.push(fn);
    if(!this.queueID){ this.queueID=requestAnimationFrame(this.$sync); }
  }
};
ASync.prototype.sync=function(time){ var q=this.queue;
  // Stop scheduling when there is no queued work left.
  if(!q.length){ this.queueID=null; return;
  }else if(!this.locked){ var fn=q.shift();
    // Execute the next callback unless an image task is still in progress.
    if(typeof(fn)=='function'){ try{ fn();
    }catch(e){ console.log('async exception:',e); } }
  }
  if(this.queue.length){ this.queueID=requestAnimationFrame(this.$sync);
  }else{ this.queueID=null;
  }
};

//#endregion
//#region AJAX

/** Global request-blocking overlay element (or null when inactive). */
var w$glass$=null;

/** Shows/hides the global blocking overlay (`wglass`). */
function w$glass(on){ var e;
  // Create or reveal the blocking overlay when a request enters a modal wait state.
  if(on){
    if(!(e=w$glass$)){
      if(document.body){
        w$glass$=w$element('div', '$class','wglass');
        document.body.insertBefore(w$glass$,document.body.firstElementChild);
        //var events=["click","mouseup","mousedown","keydown","keypress","keyup"];
        //for(var i=0; i<events.length; ++i) w$glass$.addEventListener(events[i],w$no,true);
      }
    }else{
      w$show(e,true);
    }
    setTimeout(function(){ var e;
      if(!!(e=w$glass$)){ e.setAttribute('disabled','')}
    },2000);
  }else{
    // Remove the overlay entirely when the request cycle is done.
    if(!!(e=w$glass$)){ w$removeElement(w$glass$); w$glass$=null; }
  }
  return w$glass$;
}

/** Global AJAX error overlay element (or null when inactive). */
var w$error$=null;

/** Shows/hides the error overlay (`werror`); when shown, `html` is injected if provided. */
function w$error(html){ var e;
  // Create or reveal the error overlay when content should be shown.
  if(html!=null){
    if(!(e=w$error$)){
      if(document.body){
        w$error$=w$element('div',{'class':'werror'});
        document.body.insertBefore(w$error$,document.body.firstElementChild);
        //var events=["click","mouseup","mousedown","keydown","keypress","keyup"];
        //for(var i=0; i<events.length; ++i) w$glass$.addEventListener(events[i],w$no,true);
      }
    }else{
      w$show(e,true);
    }
    e ||= w$error$;
    if(e && typeof(html)=='string') e.innerHTML=html;
    setTimeout(function(){ var e;
      if(!!(e=w$error$)){ e.setAttribute('disabled','')}
    },2000);
  }else{
    // Remove the overlay entirely when clearing the error surface.
    if(!!(e=w$error$)){ w$removeElement(w$error$); w$error$=null; }
  }
  return w$error$;
}

/** Default AJAX error renderer; extracts response `<body>` when possible. */
function w$ajax$error(d){
  // Pull a readable HTML body out of server errors when a blocking overlay is active.
  if(w$glass$ && d && typeof(d.responseText)=='string'){ var t=d.responseText, bi, bs, be;
    if((bi=t.toLowerCase().indexOf('<body'))!=-1 && (bs=t.indexOf('>',bi))!=-1 && (be=t.toLowerCase().indexOf('</body',bs))!=-1){
      t=t.substring(bs+1,be);
    }
    var e=w$error('');
    if(e) e.innerHTML=t;
  }
  LOG&&console.log(d);
}
/** Core transport: supports XHR, FETCH, and CEF backends with unified callback contract.
 * <li> Normalize method, body, query, headers, and abort state into one request model.
 * <li> Dispatch through fetch, XHR, or CEF while keeping completion semantics aligned.
 * <li> Parse responses consistently and expose cancellation/promise hooks when possible.
 * <li> Encode objects, form data, raw strings, and binary payloads through one body/query pipeline.
 * <li> Preserve the same success/error/abort callback contract across sync and async transports.
 */
function w$ajax(arg){ var xhr, method=arg.method || 'GET', request={aborted:false,done:false}, signal=arg.signal, controller, abort$listener;
  // Normalize method suffixes and keep JSON parsing opt-in for `.json` methods.
  var expectJSON=false;
  if(method.endsWith(".json")){ method=method.substring(0,method.length-5); expectJSON=true; arg.json=true; }
  // Centralize completion hooks so XHR / fetch / CEF keep the same callback contract.
  if(typeof(AbortController)=='function'){ request.controller=controller=new AbortController(); request.signal=controller.signal;
    if(signal){ if(signal.aborted){ controller.abort(signal.reason);
    }else{ signal.addEventListener('abort',abort$listener=function(){ request.abort(signal.reason); },{once:true}); } }
  }else{ request.signal=signal; }
  arg.request=request;
  function w$ajax$loop(){ if(!request.aborted && arg.loop && !w$sync$end) requestAnimationFrame(arg.loop); }
  function w$ajax$hide(){ if(!arg.async) w$glass(); }
  function w$ajax$off(){ if(signal && abort$listener) signal.removeEventListener('abort',abort$listener); }
  function w$ajax$abortError(reason){
    if(reason && reason.name=='AbortError') return reason;
    try{ if(typeof(DOMException)=='function') return new DOMException(reason || 'Aborted','AbortError');
    }catch(e){ }
    if(reason instanceof Error){ reason.name ||= 'AbortError'; return reason; }
    return {name:'AbortError',message:reason || 'Aborted'};
  }
  function w$ajax$doneSuccess(data){
    if(request.done) return;
    request.done=true; w$ajax$off();
    w$ajax$hide();
    if(arg.success) arg.success(data,arg);
    w$ajax$loop();
  }
  function w$ajax$doneError(err){
    if(request.done) return;
    request.done=true; w$ajax$off();
    w$ajax$hide();
    if(arg.error) arg.error(err,arg);
    w$ajax$loop();
  }
  function w$ajax$doneAbort(reason){
    if(request.done) return;
    request.done=true; request.aborted=true; w$ajax$off();
    w$ajax$hide();
    if(arg.abort) arg.abort(reason=w$ajax$abortError(reason),arg);
    else if(arg.error) arg.error(reason=w$ajax$abortError(reason),arg);
  }
  function w$ajax$parse(text,contentType){
    if(expectJSON || (contentType||'').toLowerCase().startsWith("application/json")) return text ? JSON.parse(text) : null;
    return text;
  }
  function w$ajax$isURLSearchParams(v){ return typeof(URLSearchParams)!='undefined' && v instanceof URLSearchParams; }
  function w$ajax$isFormData(v){ return typeof(FormData)!='undefined' && v instanceof FormData; }
  function w$ajax$isBinary(v){ return !!((typeof(Blob)!='undefined' && v instanceof Blob)
    || (typeof(ArrayBuffer)!='undefined' && (v instanceof ArrayBuffer || ArrayBuffer.isView && ArrayBuffer.isView(v)))); }
  function w$ajax$queryString(v){ var parts=[], p, useURL=typeof(URLSearchParams)!='undefined';
    function w$push(k,v){
      if(typeof(v)=='undefined') return;
      if(w$isArray(v)){ for(var j=0; j<v.length; ++j) w$push(k,v[j]); return; }
      if(v==null){ parts.push(encodeURIComponent(k));
      }else if(useURL){ p=new URLSearchParams(); p.append(k,v); parts.push(p.toString());
      }else{ parts.push(encodeURIComponent(k)+'='+encodeURIComponent(v)); }
    }
    if(v==null) return '';
    if(typeof(v)=='string') return /^[?&]/.test(v) ? v.substring(1) : v;
    if(w$ajax$isURLSearchParams(v)) return v.toString();
    if(w$ajax$isFormData(v)){
      if(typeof(v.forEach)=='function'){ v.forEach(function(v,k){ w$push(k,v); });
      }else if(typeof(v.entries)=='function'){ for(var it=v.entries(), e; !(e=it.next()).done; ) w$push(e.value[0],e.value[1]); }
      return parts.join('&');
    }
    if(typeof(v)=='object'){ for(var i=0,a=Object.keys(v),l=a.length; i<l; ++i){ var k=a[i]; w$push(k,v[k]); } return parts.join('&'); }
    return ''+v;
  }
  function w$ajax$headers(sendBody){ var headers={}, h=arg.headers;
    if(arg.pragma) headers.Pragma=arg.pragma;
    if(h){ for(var n in h){ if(typeof(h[n])!='undefined') headers[n]=h[n]; } }
    if(sendBody && cType!==false && typeof(cType)!='undefined'
       && typeof(headers['Content-Type'])=='undefined' && typeof(headers['Content-type'])=='undefined') headers['Content-Type']=cType;
    return headers;
  }
  request.abort=function(reason){
    if(request.done || request.aborted) return request;
    request.aborted=true;
    if(controller && !controller.signal.aborted){ try{ controller.abort(reason); }catch(e){ } }
    if(request.cancel){ try{ request.cancel(reason); }catch(e){ } }
    if(request.xhr){ try{ request.xhr.abort(); }catch(e){ } }
    w$ajax$doneAbort(reason);
    return request;
  };
  // Normalize query/body once so all transports can reuse the same encoding rules.
  var data=('body' in arg) ? arg.body : ('data' in arg ? arg.data : { }), query="", cType=arg.contentType;
  if(!arg.url && typeof(window.cefQuery)!='undefined') method='CEF';
  var fetchMethod=method=='FETCH' ? (arg.fetchMethod || 'GET') : method;
  if(fetchMethod=="GET" || fetchMethod=="HEAD"){
    if(!!(query=w$ajax$queryString(data))) query=(((arg.url||'').indexOf('?')!=-1) ? '&' : '?')+query;
    data=null;
  }else if(data==null){
    data=null;
  }else if(typeof(data)=='string'){
    if(typeof(cType)=='undefined') cType='text/plain; charset=UTF-8';
  }else if(w$ajax$isURLSearchParams(data)){
    data=data.toString(); cType ??= 'application/x-www-form-urlencoded; charset=UTF-8';
  }else if(w$ajax$isFormData(data)){
    if(method=='CEF'){ data=w$ajax$queryString(data); cType ??= 'application/x-www-form-urlencoded; charset=UTF-8';
    }else{ cType=false;
    }
  }else if(w$ajax$isBinary(data)){
  }else if(typeof(data)=='object'){
    if(fetchMethod=="POST" && !(arg.json || ((cType||'').toLowerCase().startsWith("application/json")))){
      data=w$ajax$queryString(data); cType ??= 'application/x-www-form-urlencoded; charset=UTF-8';
    }else{
      data=JSON.stringify(data); cType ??= 'application/json; charset=UTF-8';
    }
  }else{
    data=''+data; if(typeof(cType)=='undefined') cType='text/plain; charset=UTF-8';
  }
  function w$ajax$fetch(fetchMethod){ var sendBody=fetchMethod!='GET' && fetchMethod!='HEAD', options={ method:fetchMethod, mode:arg.mode || 'cors', headers:w$ajax$headers(sendBody) };
    if(request.signal) options.signal=request.signal;
    if(arg.withCredentials) options.credentials='include';
    if(sendBody && data!=null) options.body=data;
    request.promise=fetch((arg.url||'') + query, options)
      .then(function(response){
        return response.text().then(function(text){ return { response:response, text:text, contentType:response.headers.get('Content-Type')||'' }; });
      })
      .then(function(result){ var s=result.response.status, parsed;
        if(s==200 || s==304 || 400<=s && s<500 || !arg.error){
          try{ parsed=w$ajax$parse(result.text,result.contentType);
          }catch(e){ w$ajax$doneError(e); return; }
          w$ajax$doneSuccess(parsed);
        }else{
          w$ajax$doneError(result.response);
        }
      },function(err){
        if(request.aborted || err && err.name=='AbortError'){ w$ajax$doneAbort(err);
        }else{ w$ajax$doneError(err);
        }
      });
    request.then=request.promise.then.bind(request.promise);
    request.catch=request.promise.catch.bind(request.promise);
    if(typeof(request.promise.finally)=='function') request.finally=request.promise.finally.bind(request.promise);
    return request;
  }
  // Use fetch for explicit modern requests, or as an async fallback when XHR is unavailable.
  if(method=='FETCH'){
    if(typeof(fetch)=='function' && arg.async!==false) return request.signal && request.signal.aborted ? (request.abort(request.signal.reason),request) : w$ajax$fetch(fetchMethod);
    method=fetchMethod;
  }
  if(typeof(XMLHttpRequest)!='undefined'){ xhr=new XMLHttpRequest();
  }else{ var versions=[ "MSXML2.XmlHttp.6.0", "MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0",
                        "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp" ];
    for(var i=0; i<versions.length; i++){ try{ xhr=new ActiveXObject(versions[i]); break; }catch(e){ } }
  }
  if(!xhr && typeof(fetch)=='function' && method!='CEF' && arg.async!==false) return request.signal && request.signal.aborted ? (request.abort(request.signal.reason),request) : w$ajax$fetch(method);
  if(!xhr && method!='CEF'){ w$ajax$doneError(new Error('XMLHttpRequest is not available')); return request; }
  if(request.signal && request.signal.aborted){ request.abort(request.signal.reason); return request; }
  // Keep legacy sync-capable XHR / CEF handling for old code paths that still depend on it.
  if(!arg.async) w$glass(true);
  if(xhr){ request.xhr=arg.xhr=xhr;
    xhr.onreadystatechange=function(){ arg.xhr=request.xhr=xhr;
    // Treat `200`, `304`, and legacy validation-style `4xx` responses as success payloads.
    if(xhr.readyState==4){ var s=xhr.status;
      if(request.aborted || s==0 && request.signal && request.signal.aborted){ w$ajax$doneAbort(request.signal.reason);
      }else if(s==200 || s==304 || 400<=s && s<500 || !arg.error){ var parsed;
        try{ parsed=w$ajax$parse(xhr.responseText,xhr.getResponseHeader("Content-Type")||'');
        }catch(e){ w$ajax$doneError(e); return; }
        w$ajax$doneSuccess(parsed);
      }else{
        w$ajax$doneError(xhr);
      }
    }
  };
  }
  if(xhr && typeof(xhr.onabort)!='undefined') xhr.onabort=function(){ w$ajax$doneAbort(); };
  if(arg.withCredentials && xhr) xhr.withCredentials=true;
  if(method=="GET"){
    xhr.open('GET',(arg.url||'') + query, typeof(arg.async)!='undefined'?arg.async:true)
    var headers, n; for(n in (headers=w$ajax$headers(false))){ xhr.setRequestHeader(n, headers[n]); }
    xhr.send()
  }else if(method=='CEF'){
    var qid=window.cefQuery({ request: 'W$CALL:\n' + (data==null ? '' : data),
      // Parse CEF string responses with the same JSON rules as other transports.
      onSuccess: function(data){ var parsed;
        try{ parsed=w$ajax$parse(data||'','application/json');
        }catch(e){ w$ajax$doneError(e); return; }
        w$ajax$doneSuccess(parsed);
      },
      onFailure: function(error_code, error_message){
        w$ajax$doneError({error_code:error_code,error_message:error_message});
      }
    });
    if(typeof(window.cefQueryCancel)=='function') request.cancel=function(){ window.cefQueryCancel(qid); };
  }else{
    var sendBody=method!='HEAD';
    xhr.open(method,(arg.url||''), typeof(arg.async)!='undefined'?arg.async:true)
    var headers, n; for(n in (headers=w$ajax$headers(method!='HEAD'))){ xhr.setRequestHeader(n, headers[n]); }
    xhr.send(sendBody ? data : null);
  }
  return request;
}

/** Active transport implementation (`w$ajax` by default; can be replaced). */
var w$call=w$ajax;

/** Default `W$CALL` success dispatcher: callback, weave array response, or weave object response. */
function w$receive(data,conf){
  if(conf.callback){
    conf.callback(data,conf);
  }else if(w$isArray(data)){
    w$weave(conf.w$element,data);
  }else if(typeof(data)=='object'){
    w$weave(conf.w$element,conf.w$cmd,data,conf.weave$data);
  }
}

/** High-level remote call helper with flexible args (`cmd`, `data`, `conf`, callbacks, and target element weaving).
 * <li> Accept flexible argument ordering for command, payload, config, callbacks, and target element.
 * <li> Build a `w$ajax(...)` request with sensible defaults for call-style operations.
 * <li> Route successful responses through weaving/callback handling for the chosen target.
 * <li> Support a leading source element and a separate target element for returned weaving.
 * <li> Clear stale warnings before fresh remote data is merged back into the target.
 */
function W$CALL(/*cmd, data, conf, w$cmd, weave$data*/){ var idx=0, data, cmd, conf, firstEl;
  // Accept the optional leading element and command/data/conf tuple in flexible order.
  if(arguments[idx] instanceof HTMLElement){ firstEl=arguments[idx++]; }
  if(typeof(arguments[idx])=='string'){ cmd=arguments[idx++]; }
  if(arguments[idx]==null
      || typeof(arguments[idx])=='object' && !(arguments[idx] instanceof HTMLElement)){ data=arguments[idx++];
    if(typeof(arguments[idx])=='object' && !(arguments[idx] instanceof HTMLElement)){ conf=arguments[idx++]; }
  }
  conf ||= {};
  if(firstEl) conf.w$element=firstEl;
  // Accept the explicit weave target and weave arguments after the request options.
  if(arguments[idx] instanceof HTMLElement){ conf.w$element=arguments[idx++];
    if(typeof(arguments[idx])=='string'){ conf.w$cmd=arguments[idx++]; }
    if(typeof(arguments[idx])=='object' && arguments[idx]){ conf.weave$data=arguments[idx++]; }
  }
  if(typeof(arguments[idx])=='function'){
    conf[conf.success?'callback':'success']=arguments[idx++];
  }
  conf.success ||= w$receive;
  if(typeof(conf.error)=='undefined') conf.error=w$ajax$error;
  if(typeof(conf.pragma)=='undefined') conf.pragma='W$CALL';
  conf.method ||= 'POST.json';
  conf.url ||= location.pathname.substring(0,location.pathname.lastIndexOf('/')+1);
  conf.url ||= ".";
  // Interpret `cmd` either as `METHOD:url` or as the operation name sent in `conf.data`.
  if(typeof(cmd)=='string'){ conf.data={};
    if((idx=cmd.indexOf(':'))!=-1){ conf.method=cmd.substring(0,idx); conf.url=cmd.substring(idx+1);
    }else{ conf.data[cmd]='';
    }
    if(typeof(data)=='object' && data) w$assign(conf.data,data);
  }else if(typeof(data)=='object' && data){ conf.data=data;
  }
  // Clear old warnings before weaving fresh server results back into the target element.
  if(conf.w$element && (!conf.w$cmd || !conf.w$cmd.startsWith('~'))) w$warning(conf.w$element);
  (w$call || w$ajax)(conf)
}

/** Last sync timestamp marker and stop flag for `w$sync` polling. */
var w$sync$time='', w$sync$end=0;

/** Starts long-poll refresh cycle through `.json` endpoint and applies responses via `w$resync`. */
function w$sync(){
  w$ajax({ method:'GET', url:location.pathname+'.json', pragma:'W$CALL', data:{'!?':w$sync$time},
    async:true, success:w$resync, loop:w$sync
  })
}

/** Runtime state for async resync queue and preconditions. */
var w$resync$={ precondition:[], queue:[], locked:false, };

/** Unlock callback used by async resync preconditions. */
function w$resync$done(){
    w$resync$.locked=false;
}
/** Enqueues resync messages and updates sync timestamp from message metadata. */
function w$resync(data){ var $this=w$resync$;
  if(w$isArray(data) && data.length){
    // Update the sync watermark and queue each weave command in arrival order.
    for(var i=0; i<data.length; ++i){ var c=data[i],t; if(!w$isArray(c)) continue;
      t= typeof(c[0])=='string' ? c[2] : c[1];
      if(t && w$sync$time<t)
        w$sync$time=t;
      $this.queue.push(c);
    }
    if(!$this.queueID){ $this.queueID=window.requestAnimationFrame(w$resyncer); }
  }
}
/** Processes resync queue/preconditions within a frame budget and reschedules itself while work remains.
 * <li> Run pending async preconditions before consuming queued resync payloads.
 * <li> Weave eligible updates while respecting the current frame budget and lock state.
 * <li> Reschedule itself until both the precondition list and queue are empty.
 * <li> Requeue payloads whose preconditions defer actual weaving work.
 * <li> Release scheduling state cleanly once no queued or deferred work remains.
 */
function w$resyncer(time){ var $this=w$resync$;
  window.cancelAnimationFrame($this.queueID);
  if(!$this.locked){
    do{
      // Run deferred preconditions first; they may lock resync until async work completes.
      if($this.precondition.length){ var fn=$this.precondition.shift();
        try{ $this.locked=true; fn(w$resync$done);
        }catch(e){ $this.locked=false; console.log('async precondition exception:',e);
        }
        break;
      // Otherwise weave the next queued response into the document.
      }else if($this.queue.length){ var d=$this.queue.shift(), r;
        try{
          //if(cmd==':'||cmd=='['||cmd==']'||cmd=='<'||cmd=='>'||cmd=='#'||cmd=='='||cmd=='.'){
          //  w$weave(el,cmd,d.data);
          //}else{ // var that=w$data(el);
            r=w$weave$data(document.body,d);
          //}
        }catch(e){ console.log('async exception:',e);
        }
        if(typeof(r)=='function'){
          LOG&&console.log('PRE',d);
          $this.queue.unshift(d); $this.precondition.push(r);
          continue;
        }
      }else{
        // Stop scheduling once both queues are empty.
        $this.queueID=null; return;
      }
    }while(performance.now()<time+77);
  }
  $this.queueID=window.requestAnimationFrame(w$resyncer);
}

//#endregion
//#region MENU
/** Stack of currently opened menu/submenu DOM nodes (top = last opened). */
var w$menuStack=[];
/** Default delayed-close timeout for hover menus (ms). */
var W$MENU_OFF_DELAY=333;

/** Closes menus from top until `p`; if `inclusive`, also closes `p` itself. */
function w$menuOff(p,inclusive){ var ne=true;
  while(w$menuStack.length && ne && ((ne=(w$menuStack[w$menuStack.length-1]!=p))||inclusive)){ var e=w$menuStack.pop();
    if(e && e.$w && e.$w.off$timer){ clearTimeout(e.$w.off$timer); e.$w.off$timer=null; }
    w$removeElement(e);
  }
}
/** Renders and positions a menu node, wires hover/click behavior, and recursively opens submenus.
 * <li> Resolve menu content into a live node and assign menu/item semantics.
 * <li> Wire pointer, touch, and keyboard interactions for items and submenus.
 * <li> Position the menu within the viewport and return the active menu node.
 * <li> Manage delayed close/open timers and propagate submenu state across nested menus.
 * <li> Invoke optional click callbacks before the default menu dispatch path.
 */
function w$menuShow(el,M,left,left2,top,top2,init,fn){ var repos;
  // Resolve string menu ids to cloned DOM content before wiring interactive behavior.
  if(typeof(M)== 'string'){ M=document.getElementById(M);
    if(!M) return null;
    M=M.cloneNode(true); M.removeAttribute('id'); //if(!M.$w) M.$w={}; M.$w.parent=el;
  }
  if(!M || !M.classList) return null;
  // Attach menu ownership and let the optional init hook fully handle positioning if it wants to.
  M.$w ||= {}; M.$w.parent=el;
  if(!M.hasAttribute('role')) M.setAttribute('role','menu');
  if(typeof(M.tabIndex)=='undefined' || M.tabIndex<0) M.tabIndex=-1;
  function w$menuTimer(off){ if(M.$w.off$timer){ clearTimeout(M.$w.off$timer); M.$w.off$timer=null; }
    if(off) M.$w.off$timer=setTimeout(function(){ if(M.getAttribute('w:off')) w$menuOff(M,true); },typeof(off)=='number'?off:W$MENU_OFF_DELAY);
  }
  function w$itemHasMenu(x){
    for(var yi=0; yi<x.children.length; ++yi){ if(x.children[yi].classList.contains('wmenu')) return true; }
    return false;
  }
  function w$itemMenu(x,dx){ var r=x.getBoundingClientRect(), y, z;
    for(var yi=0; yi<x.children.length; ++yi){ if(!(y=x.children[yi]).classList.contains('wmenu')) continue;
      z=y.cloneNode(true); z.$w ||= {}; z.$w.menuParentItem=x;
      return w$menuShow(el,z,dx<0?r.left+2:r.right-2,dx<0?r.right:r.left,r.top,r.bottom,null,fn);
    }
    return null;
  }
  function w$itemSelect(x,focus){
    for(var xxi=0; xxi<M.children.length; ++xxi){ var xx=M.children[xxi]; if(!xx.classList.contains('wmenuitem')) continue;
      xx.classList.remove('wmenuitem-selected'); if(typeof(xx.tabIndex)!='undefined') xx.tabIndex=-1;
    }
    if(!x || w$attribute(x,'disabled')!=null) return null;
    x.classList.add('wmenuitem-selected'); x.tabIndex=0; if(focus && x.focus) x.focus(); return x;
  }
  function w$itemNext(x,dir){ var xi=-1, xx;
    if(x){ for(xi=0; xi<M.children.length; ++xi){ if(M.children[xi]==x) break; } }
    else xi=dir<0 ? M.children.length : -1;
    for(var xxi=0; xxi<M.children.length; ++xxi){
      xx=M.children[(xi+=dir)<0 ? xi+M.children.length : xi%M.children.length];
      if(xx && xx.classList.contains('wmenuitem') && w$attribute(xx,'disabled')==null) return xx;
    }
    return null;
  }
  function w$itemArg(E){ var arg={}, s;
    if((s=w$attribute(E,'w:value'))!=null){ arg[w$findName(E)||'value']=s; }
    return arg;
  }
  function w$itemDo(E,e){
    if(w$attribute(E,'disabled')!=null) return false;
    if(w$itemMenu(E,1)) return false;
    var arg=w$itemArg(E);
    if(fn && false===fn(el,E,arg,e)) return false;
    w$menuOff();
    w$on(e,'menu',null,arg);
    return false;
  }
  if(init) repos=init(el,M,left,left2,top,top2); M.classList.remove('w')
  M.addEventListener("mouseover", function(){ w$menuTimer(); w$menuOff(M); M.setAttribute('w:off',''); return false; },true);
  w$menuStack.push(M);
  // Wire each menu item for hover selection, submenu opening, and leaf-item action dispatch.
  for(var xi=0; xi<M.children.length; ++xi){ var x=M.children[xi]; if(!x.classList.contains('wmenuitem')) continue;
    if(!x.hasAttribute('role')) x.setAttribute('role','menuitem');
    if(w$itemHasMenu(x)){ x.setAttribute('aria-haspopup','menu'); }
    if(typeof(x.tabIndex)=='undefined' || x.tabIndex<0) x.tabIndex=-1;
    x.classList.remove('wmenuitem-selected');
    x.onmouseover=function(e){ var x=e.currentTarget; w$no(e); w$menuTimer(); w$itemSelect(x);
      //for(var yi in xx.children){ var y=xx.children[yi]; if(y.nodeName=='UL') y.style.display='none'; }
      w$itemMenu(x,1);
    }
    x.onfocus=function(e){ w$menuTimer(); w$itemSelect(e.currentTarget); }
    x.ontouchstart=function(e){ w$menuTimer(); w$itemSelect(e.currentTarget); }
    x.onclick=function(e){ w$no(e); return w$itemDo(e.currentTarget,e);
    }
    x.onkeydown=function(e){ var x=e.currentTarget, xx;
      // Support keyboard navigation/activation so menus are usable without hover.
      if(e.key=='ArrowDown'){ if(xx=w$itemNext(x,1)) w$itemSelect(xx,true); return w$no(e);
      }else if(e.key=='ArrowUp'){ if(xx=w$itemNext(x,-1)) w$itemSelect(xx,true); return w$no(e);
      }else if(e.key=='ArrowRight'){ if(xx=w$itemMenu(x,1)){ if(xx=xx.querySelector('.wmenuitem:not([disabled])')) xx.focus(); } return w$no(e);
      }else if(e.key=='ArrowLeft'){ if(M.$w.menuParentItem){ xx=M.$w.menuParentItem; w$menuOff(M,true); xx.focus && xx.focus(); w$itemSelect(xx); return w$no(e);
        }else if(el && el.focus){ w$menuOff(); el.focus(); return w$no(e);
        }
      }else if(e.key=='Home'){ if(xx=w$itemNext(null,1)) w$itemSelect(xx,true); return w$no(e);
      }else if(e.key=='End'){ if(xx=w$itemNext(null,-1)) w$itemSelect(xx,true); return w$no(e);
      }else if(e.key=='Enter' || e.key==' '){ return w$no(e),w$itemDo(x,e);
      }else if(e.key=='Escape'){ w$menuOff(); if(el && el.focus) el.focus(); return w$no(e);
      }
    }
  }
  // Close the stack when pointer focus leaves the current menu tree for long enough.
  M.onmouseout=function(e){ w$no(e); var el=e.relatedTarget || document.activeElement;
    if(M.classList.contains('wmenuM')) return false;
    var p=el; while(p!=null && (!p.classList || !p.classList.contains('wmenu'))) p=p.parentElement;
    M.setAttribute('w:off',1);
    if(p!=null){ w$menuOff(p);
    }else{ w$menuTimer(true);
    }
  }
  M.onkeydown=function(e){
    if(e.key=='Escape'){ w$menuOff(); if(el && el.focus) el.focus(); return w$no(e); }
  }
  // Unless init handled placement, append the menu and keep it within the visible page bounds.
  if(typeof(repos)=='undefined'){
    M.style.position='absolute'; M.style.display='inline-block';
    M.style.left=(left+=window.pageXOffset-7)+'px'; M.style.top=(top+=window.pageYOffset-7)+'px';
    document.body.appendChild(M);
    var vw=window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        vh=window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
        r=M.getBoundingClientRect();
    if(r.right>vw){ M.style.left=Math.max(window.pageXOffset,left2-r.width+window.pageXOffset+7)+'px'; }
    if(r.bottom>vh){ M.style.top=Math.max(window.pageYOffset,top2-r.height+window.pageYOffset+7)+'px'; }
    if((r=M.getBoundingClientRect()).left<0){ M.style.left=window.pageXOffset+'px'; }
    if(r.top<0){ M.style.top=window.pageYOffset+'px'; }
  }
  return M;
}

/** Opens menu for element/event target from DOM id (`#id`) or expression/template source.
 * <li> Resolve the source element and anchor rectangle from an event or direct element.
 * <li> Materialize menu content from ids, expressions, or named definitions.
 * <li> Forward the final node to `w$menuShow(...)` for interaction wiring and placement.
 * <li> Support keyboard- and touch-triggered openings without relying on mouse coordinates.
 * <li> Reuse the same opening path for DOM templates and computed menu definitions.
 */
function w$menu(el,M,init,fn){ var ev, r;
  // Resolve event-triggered menus from the target element and cursor position.
  if(el instanceof Event){ ev=el; el=ev.target; w$no(ev);
    if(ev.touches && ev.touches.length){ var t=ev.touches[0];
      r={ left:t.clientX, right:t.clientX, top:t.clientY, bottom:t.clientY }
    }else if(ev.changedTouches && ev.changedTouches.length){ var t=ev.changedTouches[0];
      r={ left:t.clientX, right:t.clientX, top:t.clientY, bottom:t.clientY }
    }else if(ev.type && ev.type.startsWith('key')){ r=el.getBoundingClientRect();
    }else{ r={ left:ev.clientX, right:ev.clientX, top:ev.clientY, bottom:ev.clientY }
    }
    M ||= el.getAttribute('w:on:'+ev.type+':menu') || el.getAttribute('w:menu');
  }else{ r=el.getBoundingClientRect();
    M ||= el.getAttribute('w:menu');
  }
  // Resolve menu definitions from DOM ids or named templates before showing the menu.
  if(typeof(M)=='string'){
    if(M.startsWith('#')){ M=w$query(M);
      if(!M) return null;
      M=M.cloneNode(true); M.removeAttribute('id'); M.$w ||= {}; M.$w.parent=el;
    }else{ var $=w$data(el);
      M=w$use(M,$||{},null,el);
    }
  }
  // Move focus into keyboard-opened menus so arrow navigation works immediately.
  if(!!(M=w$menuShow(el,M,r.left,r.right,r.top,r.bottom,init,fn)) && ev && ev.type && ev.type.startsWith('key')){
    var x; for(var xi=0; xi<M.children.length; ++xi){ if((x=M.children[xi]).classList.contains('wmenuitem') && w$attribute(x,'disabled')==null) break; else x=null; }
    if(x && x.focus) x.focus(); else M.focus && M.focus();
  }
  return M
}

//#endregion
//#region EVENTS

/** Cancels default browser behavior and stops propagation; always returns `false`. */
function w$no(ev){ ev.preventDefault(); ev.stopPropagation(); ev.cancelBubble=true; return false; }

/** Stops propagation but keeps default browser behavior; always returns `false`. */
function w$default(ev){ ev.stopPropagation(); ev.cancelBubble=true; return false; }

/** Applies action pipeline for an element: type-level `$action` handlers, then data-field `*action` handlers. */
function w$action(el,ev,arg,element){
  // Validate direct target input before mutating the working argument object.
  if(ev && ev.target==el && arg && el.name in arg){ w$check(el,arg[el.name]); }
  if(arg==null) arg={}; else arg=w$assign({},arg);
  el=w$element$(el);
  var $=w$data(el), classes; w$assign($,arg);
  L:if(!!(classes=el.classList)){
    // Let type-level `$action` handlers preprocess the event and optionally stop the chain.
    for(var i=0; i<classes.length; ++i){ var type=classes[i],fn,t;
      if(type && (t=W$TYPES[type]) && typeof(fn=t.$action)=='function'){
        var r=fn.call($,el,ev,arg,element);
        if(typeof(r)=='object'){ w$assign($,r); }
        if(r===true){ break L; }
      }
    }
    // Then run element-bound `...$action` callbacks stored in the woven data object.
    for(var k in $){
      if(!(k.length>7 && k.endsWith('$action') && typeof(fn=$[k])=='function')) continue;
      var rr=fn.call($,el,ev,arg,element);
      if(typeof(rr)=='object'){ w$assign($,rr); }
    }
  }
}

/** Builds argument object from mixed inputs (`string` flags, object merges, toggle mode, and element-bound expressions).
 * <li> Collect literal flags, merged objects, and toggle-mode settings from the argument list.
 * <li> Resolve element-bound names, toggles, and expressions into concrete values.
 * <li> Return one merged argument object for events, calls, or conversions.
 * <li> Allow trailing object merges after element-derived values are collected.
 * <li> Interpret toggle markers and inline `name:expr` forms in the same field list.
 */
function w$arg(){ let ai=0, r={}, useToggle=true;
  // Collect literal flags, merged objects, and the toggle-mode switch first.
  for( ; ai<arguments.length; ++ai){ var arg=arguments[ai];
    if(arg==null){ continue;
    }else if(typeof(arg)=='string'){ r[arg]='';
    }else if(typeof(arg)=='object' && !(arg instanceof HTMLElement)){ w$assign(r,arg);
    }else if(typeof(arg)=='boolean'){ useToggle=arg;
    }else{ break;
    }
  }
  let el=arguments[ai], $=w$data(el), a=arguments[ai+1].split(',');
  // Resolve element-bound names, expressions, and toggle requests into the result object.
  for(let i=0; i<a.length; ++i){ let s=a[i].trim(), idx, v, toggle;
    if(useToggle && !!(toggle=s.startsWith(W$TOGGLE))){ s=s.substring(W$TOGGLE.length); }
    if(toggle){ let tv=true;
      if((idx=s.indexOf(':'))!=-1){ tv=weave$evalExpr(el,$,s.substring(idx+1)); s=s.substring(0,idx); }
      v=$[s]; v=w$toggle(v,tv)
    }else if((idx=s.indexOf(':'))!=-1){ v=weave$evalExpr(el,$,s.substring(idx+1)); s=s.substring(0,idx);
    }else{ v=$[s];
    }
    if(typeof(v)!='undefined') r[s]=v;
  }
  for(ai+=2; ai<arguments.length; ++ai){ var arg=arguments[ai];
    if(typeof(arg)=='object' && arg) w$assign(r,arg);
  }
  return r;
}

/** Derives menu anchor bounds from touch/mouse coordinates and falls back to the element box. */
function w$on$eventRect(ev,el){ let x,y,t;
  if(ev && !!(t=(ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]))){ x=t.clientX; y=t.clientY;
  }else if(ev && typeof(ev.clientX)=='number' && typeof(ev.clientY)=='number'){ x=ev.clientX; y=ev.clientY;
  }else{ return el.getBoundingClientRect();
  }
  return {left:x, right:x, top:y, bottom:y};
}

/** Central event dispatcher for `w:on:*` and type handlers, including capture/menu/data/set/action/href flows. */
function w$on(ev,ename,elem,arg,indirect){ var el=elem||ev.target, ell=el, t, r;
  elem ??= ev.target;
  if(!ename){ ename=ev.type; }
  var ename2=indirect?ename:'on'+ename;
  function opFor(el,op,arg){ //if(o.indexOf('{{')!=-1){ o=weave$evalExpr(el,$,o,false); }
    var idx=w$argIndex(op), aOp,xOp, n, o=idx!=-1?op.substring(idx):'';
    if(o.startsWith('(')){ xOp=(el && (el.nodeName=='FORM')) ? w$get(el.form||el) :null;
      if(o!='()'){ if(o.endsWith(')')) o=o.substring(0,o.length-1);
        xOp=w$arg(false,xOp,el,o.substring(1));
      }
    }
    aOp=arg; if(xOp) aOp=aOp?w$assign(aOp,xOp):xOp;
    aOp ||= {}
    if(aOp && ((n=w$attribute(el,'w:named'))!=null || (n=w$attribute(el,'w:name'))!=null || (n=w$attribute(el,'name'))!=null) && n){ var v=undefined;
      if(el.tagName=='DIV' || el.tagName=='INPUT'){ v=w$get(el,null,null,null);
      }else if(el.hasAttribute('w:value')){ v=el.getAttribute('w:value');
      }else if(typeof(v=el.value)!='undefined'){
      }
      aOp[n]=typeof(v)!='undefined' ? v :null;
    }
    return aOp;
  }
  try{
    if(ename.indexOf('mouse')==-1 && ename.indexOf('key')!=-1 && ename!='wheel')
      LOG&&console.log('w$on('+ename,el);
    L:{ var queue=[]; r=false;
      // Collect capture handlers from the outermost matching ancestor back down to the target branch.
      for(var e=el; e && e!=document; e=indirect && e.$w && e.$w.parent ? e.$w.parent : e.parentElement){ var o;
        if((o=w$attribute(e,'w:capture:'+ename))!=null){ queue.push(e); }
      }
      for(var qi=queue.length; --qi>=0; ){ var ee=queue[qi]; var nm=w$attribute(ee,'w:capture:'+ename);
        for(var e=ee; e; e=indirect && e.$w && e.$w.parent ? e.$w.parent : e.parentElement){ var o;
          var classes=e.classList; if(!classes) continue;
          for(var ci=0; ci<classes.length; ++ci){ var type=classes[ci],fn;
            if(type && (t=W$TYPES[type]) && typeof(fn=t[nm])=='function'){ var o=t,$=w$data(e),fnArg;
              if($ && !w$isArray($)) o=w$setPrototypeOf($,t);
              if(!!(fnArg=t[nm+'$arg'])){ arg=w$arg(e,fnArg,arg); }
              var warn=w$checkArg(e,nm,arg);
              LOG&&console.log('w:capture:'+ename+"="+nm,el);
              if(warn){ w$warning(e); w$warning(e,warn); r=undefined;
              }else{ r=t[nm].call(o,e,ev,arg);
              }
              if(r!==null){ break L; }
            }
          }
        }
      }
      // Walk up the normal bubble chain and apply attribute handlers before type handlers.
      for( ; el; el=indirect && el.$w && el.$w.parent ? el.$w.parent : el.parentElement){ var o;
        if(!el.getAttribute) continue;
        if((o=el.getAttribute('w:on:'+ename+':menu'))){ w$no(ev); var aOp=opFor(el,o);
          o=w$argName(o); var $=w$data(el), r=w$on$eventRect(ev,el);
          if($){ if(Object.keys(aOp).length===0) aOp=$; else Object.setPrototypeOf(aOp,$); }
          var M=w$use(o,aOp,null,el);
          w$menuShow(el,M,r.left,r.right,r.top,r.bottom)
          return true;
        }
        if(el.hasAttribute(o='w:on:'+ename+':data')){
          var e=el, aOp=opFor(el,o=el.getAttribute(o));
          if(!!(o=w$argName(o))){ e=w$parent(e,o); }else{ e=w$element$(e); }
          if(!e) continue;
          for(var i in aOp){ var v=aOp[i];
            if(i.startsWith(W$TOGGLE)){ i=i.substring(W$TOGGLE.length); if(e.dataset) v=w$toggle(w$attribute(e,'data-'+i),v); }
            if(v!=null) e.setAttribute('data-'+i,v); else e.removeAttribute('data-'+i);
          }
        }
        if((o=w$attribute(el,'w:on:'+ename+':set'))!=null){ var e=el, aOp=opFor(el,o,arg||{});
          if(!!(o=w$argName(o))){ e=w$parent(e,o); }
          e=w$element$(e);
          if(!e) continue;
          var ew=(e.$w ||= {});
          ew.$ ||= {};
          for(var i in aOp){ var v=aOp[i];
            if(i.startsWith(W$TOGGLE)){ i=i.substring(W$TOGGLE.length); if(e.$w.$) v=w$toggle(e.$w.$[i],v); }
            ew.$[i]=v;
          }
        }
        // Pause proxy feedback while the action mutates woven state from this originating element.
        if((o=w$attribute(el,'w:on:'+ename+':action'))!=null){ var e=el, aOp=opFor(el,o,{});
          if(!!(o=w$argName(o))){ e=w$parent(e,o,true); }
          e=w$element$(e);
          if(!e) continue;
          w$proxy$paused.add(el);
          aOp=w$assign({},aOp);
          w$action(e,ev,aOp,el)
        }
        if((o=w$attribute(el,'w:on:'+ename))!=null){ var oi;
          if(!o){ r=undefined; break L; }else if(o=='default'){ r=true; break L; }
          if((oi=w$argIndex(o))!=-1){ arg=opFor(el,o.substring(oi),arg||{}); o=o.substring(0,oi);
          }
          r=w$on(ev,o,el,arg,1);
          if(r!==null){ break L; }
        }
        if((o=w$attribute(el,'w:on:'+ename+':href'))!=null){ var e=el, aOp=opFor(el,o,{});
          var nm=w$argName(o); if(nm.indexOf('{{')!=-1) nm=weave$evalExprs(el,w$data(el),nm);
          window.open(w$setParameters(aOp,nm),(t=e.getAttribute('target'))?t:'_self');
        }
        var classes=el.classList; if(!classes) continue;
        for(var i=0; i<classes.length; ++i){ var type=classes[i],fn;
          if(type && (t=W$TYPES[type]) && typeof(fn=t[ename2])=='function'){ var o=t,$=w$data(el),fnArg;
            if($ && !w$isArray($)) o=w$setPrototypeOf($,t);
            if(!!(fnArg=t[ename2+'$arg'])){ arg=w$arg(el,fnArg,arg); }
            var warn=w$checkArg(el,ename2,arg);
            LOG&&console.log('w:on:'+ename2,el);
            if(warn){ w$warning(el); w$warning(el,warn); r=undefined;
            }else{ r=t[ename2].call(o,el,ev,arg);
            }
            if(r!==null){  break L; }
          }
        }
      }
    }
    // Fall back to the default type handler when no element-specific handler consumed the event.
    if(r===false && (t=W$TYPES['']) && typeof(t[ename2])=='function'){ var o=t,$=w$element$(el);
      if($ && ($=$.$w) && ($=$.$) && !w$isArray($)) o=w$setPrototypeOf($,t);
      r=t[ename2].call(o,document.body,ev,arg);
    }
    /* returns
     *  undefined: processed
     *  null: unprocessed; continue processing
     *  true: stopPropagation/bubble but perform default
     */
    if(r!==null){
      if(ev){
        if(r===true || ev.type=='dragover'){ ev.stopPropagation(); ev.cancelBubble=true;
        }else if(typeof(r)=='undefined' && ev.type!='dragstart'){ w$no(ev);
        }
      }
      return r;
    }
    if(indirect!==1){
      console.log("Can not find event handler for "+ename,ell); return undefined; }
  }catch(e){
    console.log("Event handling error during `"+ename+"`",e)
  }
  return null;
}
/** Built-in DOM events auto-bound by the framework. */
var W$EVENTS=[
  "keydown", "keyup", "keypress",
  "click", "dblclick", "wheel", "touchstart", "touchmove",
  'mouseover', 'mouseout', 'mousedown', 'mouseup',
  "input", "change", "select", "focusin", "focusout",
  "dragstart", "dragenter", "dragover", "dragleave", "drop",
  "paste", 'contextmenu', 'resize',
];

/** Runtime log level / debug switch for event+weave tracing. */
LOG=0;
DEV=false;

//#endregion
//#region WELEMENT

/** Lightweight DOM snapshot for text/element nodes, attributes and child nodes.
 * <li> Capture DOM text/element structure into a lightweight reusable representation.
 * <li> Apply localization and comment handling while the snapshot is being built.
 * <li> Preserve enough metadata to clone or reapply the structure later.
 * <li> Record child templates and named definitions for later weave-time reuse.
 * <li> Mirror translated text/attribute changes back into the live DOM when needed.
 */
function WElement(e,def,w$say,commentHandler){ let nodeType=e.nodeType, say=w$say||w$says;
  this.nodeName=e.nodeName;
  // Normalize text nodes immediately so the snapshot and live DOM stay in sync.
  if(nodeType==3){ var v=e.textContent, p=e.parentElement, w=p && (p.nodeName=='SCRIPT' || p.nodeName=='STYLE') ? v : say(v);
    this.textContent=w; if(v!=w) e.textContent=w;
  }else if(nodeType==1){ e.normalize(); let a,n;
    if(e.$wf) this.$wf=e.$wf;
    // Snapshot translated attributes and keep the live element updated with the same value.
    if(!!(a=e.attributes) && a.length){ this.attributes=[];
      for(var i=0; i<a.length; ++i){ var at=a[i], v=at.value, w=say(v);
        if(at.name=='w:define'){ if(def) def[w]=this; continue; }
        this.attributes.push({name:at.name, value:w});
        if(v!=w) e.setAttribute(at.name,w);
      }
    }
    // Snapshot element/text children, remove `w:else`, and forward translated comments.
    if(!!(n=e.firstChild)){ this.childNodes=[]; var el;
      while(el=n){ n=el.nextSibling;
        if(el.nodeType==1 || el.nodeType==3){
          this.childNodes.push(new WElement(el,def,w$say,commentHandler));
          if(el.nodeName.toUpperCase()=='W:ELSE') w$removeElement(el);
        }else if(el.nodeType==8){
          if(commentHandler) commentHandler(el.textContent);
        }
      }
    }
  }
}
/** Node type view (`3` for text, `1` for element). */
Object.defineProperty(WElement.prototype, "nodeType",{
  get: function(){ return this.nodeName=='#text' ? 3 : 1 }
});
/** Returns attribute value by name or `null`. */
WElement.prototype.getAttribute=function(n){ var a;
  if(!!(a=this.attributes)){ for(var i=0; i<a.length; ++i){ if(a[i].name==n) return a[i].value; } }
  return null;
}
/** Returns `true` iff the attribute exists. */
WElement.prototype.hasAttribute=function(n){ return this.getAttribute(n)!=null; }
/** Clones this lightweight node into a real DOM node. */
WElement.prototype.cloneNode=function(f,tagName){ let e;
  // Recreate either a text node or an element shell with copied attributes.
  if(this.nodeType==3){ e=document.createTextNode(this.textContent);
  }else if(this.nodeType==1){ e=document.createElement(tagName||this.nodeName); let a;
    if(this.$wf) e.$wf=this.$wf;
    if(!!(a=this.attributes)){
      try{ for(var i=0; i<a.length; ++i){ var at=a[i]; e.setAttribute(at.name,at.value); }
      }catch(ex){ console.log(ex,this);
      }
    }
    // Deep clones append child snapshots recursively when requested.
    if(f && !!(a=this.childNodes)){
      try{ for(var i=0; i<a.length; ++i){ e.appendChild(a[i].cloneNode(true)); }
      }catch(exx){ console.log(exx,this);
      }
    }
  }
  return e;
}

/** Lightweight attribute node wrapper used by refresh/apply. */
function WAttributeReference(el,name){
  this.parentElement=el; this.name=name;
}
/** Attribute value getter forwarded to `parentElement`. */
Object.defineProperty(WAttributeReference.prototype, "value",{ get: function(){ return this.parentElement.getAttribute(this.name); } });
/** Attribute node type (`2`). */
Object.defineProperty(WAttributeReference.prototype, "nodeType",{ get: function(){ return 2 } });

//#endregion
//#region WEAVE

/** Current element and attribute while evaluating bindings. */
var weave$current=null, weave$currentAttr=null;

/** Optional post-conversion hook (can be overridden per type/context). */
function weave$class(el,$){ return $; }

/** Framework truthiness: non-empty arrays/strings count as true. */
function weave$cond(v){  return v && (typeof(v.length)=='undefined' || v.length>0); }

/** Apply one conversion expression to `result`.
 * <li> Parse the conversion name and optional macro arguments from the expression text.
 * <li> Resolve the conversion from nearby WTypes, built-in conversions, or global helpers.
 * <li> Return the converted and proxied result value.
 * <li> Evaluate macro-style arguments in the current weave/data context before calling the converter.
 * <li> Normalize object/array results back through the proxy layer when the conversion changes them.
 */
function weave$conv(el,$,expr,result){ var result, i, tr, arg, o, t;
  if((i=expr.indexOf(' '))==-1){ tr=expr; arg='';
  }else{ tr=expr.substring(0,i), arg=expr.substring(i+1);
    // conversion macro
    if(arg.startsWith('(') && arg.endsWith(')')){
      var args=arg.substring(1,arg.length-1).split(',');
      if(args.length!=1){ arg=[]; }
      for(i=0; i<args.length; ++i){ var val=weave$evalExpr(el,$,args[i]);
        if(args.length==1) arg=val; else arg.push(val);
      }
    }
  }
  L:for(var e=el; e; e=e.$w && e.$w.parent || e.parentElement){ var classes=e.classList; if(!classes) continue;
    for(var j=0; j<classes.length; ++j){ var type=classes[j];
      if(type && (o=t=W$TYPES[type]) && typeof(t[tr])==='function'){
        if($ && typeof($)=='object' && !Array.isArray($)){ o=$=w$setPrototypeOf($,t); }
        result=t[tr].call(o,el,result,arg);
        result=w$proxy(weave$class(el,result));
        return result;
      }
    }
  }
  if(typeof((o=W$CONVERSIONS)[tr])=='function'){
    if($ && typeof($)=='object' && !Array.isArray($)){ o=$; }
    result=W$CONVERSIONS[tr].call(o,el,result,arg);
    return w$proxy(weave$class(el,result));
  }else if(typeof((o=this)[tr])=='function'){
    if($ && typeof($)=='object' && !Array.isArray($)){ o=$; }
    result=this[tr].call(o,result,arg,el);
    return w$proxy(weave$class(el,result));
  }
  console.log('Transformation `'+tr+'` was not found at: ',el);
  return result;
}

/** Deep search object/list for first item where `fieldName==fieldValue` (optional type filter).
 * <li> Walk nested plain objects and arrays recursively from the given base value.
 * <li> Avoid infinite loops by tracking already visited objects and arrays.
 * <li> Return the first matching object that also satisfies the optional type filter.
 * <li> Reuse the caller-provided seen list when available so wider searches can share cycle guards.
 * <li> Descend depth-first through mixed object/list graphs until the first acceptable match is found.
 */
function w$find$data(base,fieldName,fieldValue, type, seen){ var r;
  if(!seen){ seen=typeof(WeakSet)!='undefined' ? new WeakSet() : []; }
  function w$seen(object){
    if(!(object && typeof(object)=='object')) return false;
    if(typeof(seen.add)=='function'){ if(seen.has(object)) return true; seen.add(object); return false; }
    for(var i=0; i<seen.length; ++i){ if(seen[i]===object) return true; }
    seen.push(object); return false;
  }
  function w$hasType(object,type){ if(!type) return true;
    for( ; object; object=Object.getPrototypeOf(object)){
      if(object['$type']==type || object['$name']==type) return true;
    }
    return false;
  }
  if(w$isObject(base)){
    if(w$seen(base)) return w$undefined();
    if((r=base[fieldName])==fieldValue
       && (!type || w$hasType(base,type))) return base;
    var keys=Object.keys(base);
    for(var i=0; i<keys.length; ++i){
      if(!w$undefined(r=w$find$data(base[keys[i]],fieldName,fieldValue,type,seen))) return r;
    }
  }else if(w$isArray(base)){
    if(w$seen(base)) return w$undefined();
    for(var i=0; i<base.length; ++i){
      if(!w$undefined(r=w$find$data(base[i],fieldName,fieldValue,type,seen))) return r;
    }
  }
  return w$undefined();
}
/** Find first matching object by `name#value[#type]`, optionally constrained by DOM class scope. */
function w$find$(base,selector,el){ var idx, name="id",type='';
  if((idx=selector.indexOf('#'))!=-1){ name=selector.substring(0,idx); selector=selector.substring(idx+1);
    if((idx=selector.lastIndexOf('#'))!=-1){ type=selector.substring(idx+1); selector=selector.substring(0,idx); }
  }
  if(type.startsWith(' ')){
    var list=(el||document).getElementsByClassName(type.substring(1));
    for(var i=0; i<list.length; ++i){ var e=w$element$(list[i]);
      var v=w$find$data(w$data(e),name,selector);
      if(v) return v;
    }
    return w$undefined();
  }else{
    return w$find$data(base,name,selector,type);
  }
}
/** Returns true if selector uses the element-selector syntax. */
function w$isElementSelector(selector){
  var idx=selector.indexOf('#');
  return idx!=-1 && selector.substring(idx+1).indexOf('# ')!=-1;
}

/** Evaluate one literal/reference/expression segment (without logical parsing).
 * <li> Recognize literals, numbers, references, root/parent hops, and selector-style lookups.
 * <li> Resolve property chains with `$default` fallbacks and proxy wrapping where needed.
 * <li> Fall back to raw `eval(...)` only for expressions outside the reference grammar.
 * <li> Preserve quoted strings and direct selector references without routing them through logical parsing.
 * <li> Support backslash/root traversal and cross-element lookup before applying property access steps.
 */
function weave$evalValue(el,$,expr){ var idx, ch;
  function weave$isNumber(s){ // for not empty strings
    var dot=false;
    for(var i=0,l=s.length; i<l; ++i){ var c=s.charAt(i);
      if('0'<=c && c<='9') continue;
      if(i>0 && c=='.' && !dot){ dot=true; continue; }
      return false;
    }
    return true;
  }
  function weave$isReference(s){
    for(var i=0; i<s.length; ++i){ var c=s.charAt(i);
      if(!('a'<=c && c<='z' || 'A'<=c && c<='Z' || c=='_' || c=='$' || c=='\\' || c=='.' || c=='#'
            || i>0 && '0'<=c && c<='9')) return false;
    }
    return true;
  }
  if(expr.length==0 || expr=='.') return $;
  else if(expr=='undefined') return undefined;
  else if(expr=='null') return null;
  else if(expr=='true') return true;
  else if(expr=='false') return false;
  else if(expr=='""' ||expr=="''") return '';
  else if(expr=='0')return 0;
  else if(expr=='1') return 1;
  else if(weave$isNumber(expr)) return +expr;
  else if((expr.startsWith(ch="'") || expr.startsWith(ch='"')) && expr.indexOf(ch,1)==expr.length-1) return expr.substring(1,expr.length-1);
  else if(weave$isReference(expr)){
    if((idx=expr.indexOf('\\'))!=-1){
      if(idx==0){ $=document.body.$w.$;
      }else{ var n=expr.substring(0,idx);
        L:while((el=el.$w && el.$w.parent || el.parentElement)!=null){
          if(el==document.body){ $=el.$w.$; break; }
          if(el.$w){
            if((n=='.' || el.classList.contains(n))){ $=el.$w.$; var j;
            if((j=expr.indexOf('\\',idx+1))!=-1){
                n=expr.substring(idx+1,j); expr=expr.substring(idx+1); continue L;
              }
              break;
            }
          }
        }
      }
    }
    expr=expr.substring(idx+1);
    if(!expr) return $;
    if($==null) return undefined;
    if(expr.indexOf('.')==-1){
      if(expr.indexOf('#')!=-1){ return w$find$($,expr);
      }else{ return $[expr];
      }
    }
    var f=expr.split("."),fi=f[0], base=$, value;
    value=fi.indexOf('#')!=-1 ? w$find$($,fi) : $[fi];
    for(var i=1; i<f.length; ++i){ fi=f[i]; base=w$proxy(value);
      if(fi.indexOf('#')!=-1){ value=base!=null ? w$find$(base,fi) :undefined;
      }else{ value=base!=null && fi in base ? base[fi] : undefined;
        if(value==null && base!=null){ value=base[fi+"$default"];
          if(typeof(value)=='undefined' && fi.indexOf('.')!=-1) value=base[fi.replaceAll('.','$')+"$default"];
          if(fi.startsWith('$')){
            Object.defineProperty(base, fi, { value:w$proxy(value), configurable:true, enumerable: true, });
          }else{ base[fi]=w$proxy(value);
          }
        }
      }
    }
    return value;
  }else{
    return eval(expr);
  }
}
function weave$evalPostfixConv(el,$,expr){ var idx=0, result;
  if(expr.endsWith(']') && (idx=expr.lastIndexOf('[',expr.length-1))!=-1){
    result=weave$evalPostfixConv(el,$,expr.substring(0,idx));
    return weave$conv(el,$,expr.substring(idx+1,expr.length-1),result);
  }else{ return weave$evalValue(el,$,expr);
  }
}
// comparision
function weave$evalCmp(el,$,expr){ var p=0, m=null, value, result;
  if(expr.charAt(0)=='!'){ // prefix ! for negation
    return !weave$cond(weave$evalPostfixConv(el,$,expr.substring(1)));
  }else{ // x=a=b=c for IN, x!a!b!c for NOT IN
    for(var i=0; i<=expr.length; ++i){ var ch=expr.charAt(i), flag;
      if((flag=(ch=='=')) || ch=='!' || ch==''){
        if(m===null){ value=result=weave$evalPostfixConv(el,$,expr.substring(p,i));
        }else{ var value2=weave$evalPostfixConv(el,$,expr.substring(p,i));
          result=typeof(value2)!='undefined' ? (value==value2) : (typeof(value)=='undefined');
          if(m){ if(result) return true; // else result=false;
          }else{ if(result) return false; else result=true;
          }
        }
        p=i+1; m=flag;
      }
    }
  }
  return result;
}
function weave$evalLogical(el,$,expr){ var p=0, isAnd=false, result, resultFlag=false;
  for(var i=0; i<=expr.length; ++i){ var ch=expr.charAt(i), flag;
    if((flag=(ch=='?')) || ch=='|' || ch==':' || ch==''){
      if(isAnd){
        if(resultFlag){ result=weave$evalCmp(el,$,expr.substring(p,i));
          if(ch==':' || ch=='') return result;
          resultFlag=weave$cond(result);
        }
      }else{
        if(!resultFlag){ resultFlag=weave$cond(result=weave$evalCmp(el,$,expr.substring(p,i))); }
      }
      p=i+1; isAnd=flag;
    }
  }
  return result;
}
function weave$evalConv(el,$,expr){ var idx; if(!expr) return $;
  try{
    if(expr.startsWith('[') && (idx=expr.indexOf(']'))!=-1){
      var result=weave$class(el,weave$evalConv(el,$,expr.substring(idx+1)));
      return weave$conv(el,$,expr.substring(1,idx),result);
    }else{
      return weave$class(el,weave$evalLogical(el,$,expr));
    }
  }catch(e){ console.log('Exception evaluating `'+expr+'`:',e,el);
    throw e;
  }
}

/** Evaluate expression string with optional `{{...}}` interpolation. */
function weave$evalExpr(el,$,expr,START,END){ var p=0,i,j,s=null; START=START||'{{'; END=END||'}}';
  while((i=expr.indexOf(START,p))!=-1 && (j=expr.indexOf(END,i+START.length))!=-1){ if(p<i) s=(s||'')+expr.substring(p,i);
    var result=weave$evalConv(el,$,expr.substring(i+START.length,j));
    if(result!=null) s=(s!=null) ? String(s)+result : result;
    p=j+END.length;
  }
  if(p==0){
    s=weave$evalConv(el,$,expr);
  }else if(p<expr.length){
    s=s!=null?String(s)+expr.substring(p) :expr.substring(p);
  }
  return s;
}
function weave$evalExprs(el,$,expr){ var s=weave$evalExpr(el,$,expr);
  if(s!=null && typeof(s)!='string') s=String(s);
  return s;
}

function weave$evalMacro(el,$,expr,START,END){ var p=0,i,j,s=null; START=START||'{{'; END=END||'}}';
  while((i=expr.indexOf(START,p))!=-1 && (j=expr.indexOf(END,i+START.length))!=-1){ if(p<i) s=(s||'')+expr.substring(p,i);
    var result=weave$evalConv(el,$,expr.substring(i+START.length,j));
    if(result!=null) s=(s!=null) ? String(s)+result : result;
    p=j+END.length;
  }
  if(p==0){
    s=expr;
  }else if(p<expr.length){
    s=s!=null?String(s)+expr.substring(p) :expr.substring(p);
  }
  return s;
}
function weave$evalMacros(el,$,expr){ var s=weave$evalMacro(el,$,expr);
  if(s!=null && typeof(s)!='string') s=String(s);
  return s;
}

/** Apply `w:*` attributes on one element for read/write/check phases.
 * <li> Iterate the element's `w:*` attributes in a controlled read/write/check order.
 * <li> Apply attribute/data/style/class/content bindings and control-state updates.
 * <li> Return whether the attribute pass produced content that replaces child weaving.
 * <li> Separate read/display bindings from write/check bindings according to the active mode.
 * <li> Mark content-producing attributes so child pattern weaving can be skipped when appropriate.
 */
function weave$applyAttr(el,attr,$,mode){ if(!attr || !attr.length) return false; var wasContent=false;
  try{ var attrs=[]; for(var i=0,l=attr.length; i<l; ++i){ attrs.push(attr[i]); }
    for(var i=0,l=attrs.length; i<l; ++i){ var n=attrs[i].name,v=attrs[i].value,w,s, was=false;
      if(!n.startsWith(s='w:')) continue;
      weave$currentAttr=n;
      // Phase 1 applies presentation/read bindings and lightweight weave hooks.
      if(mode!==2){
        if(n.startsWith(s='w:attr:')){ was=true; n=n.substring(s.length); w=weave$evalExprs(el,$,v);
          if(w!=el.getAttribute(n)) w!=null ? el.setAttribute(n,w) : el.removeAttribute(n);
        }else if(n.startsWith(s='w:data:')){ was=true; n='data-'+n.substring(s.length); w=weave$evalExprs(el,$,v);
          if(w!=el.getAttribute(n)) w!=null ? el.setAttribute(n,w) : el.removeAttribute(n);
        }else if(n.startsWith(s='w:style:')){ was=true; n=n.substring(s.length); w=weave$evalExpr(el,$,v);
          if(w!=el.style[n]) el.style[n]=w;
        }else if(n.startsWith(s='w:class:')){ was=true; n=n.substring(s.length); w=w$is(weave$evalExpr(el,$,v));
          while((s=n.indexOf('-'))!=-1){ n=n.substring(0,s)+n.substring(s+1,s+2).toUpperCase()+n.substring(s+2); }
          var cl=el.classList;
          if(w){ if(!cl.contains(n)) cl.add(n); }else{ if(cl.contains(n)) cl.remove(n); }
        }else if(n=='w:text'){ was=wasContent=true; w=weave$evalExprs(el,$,v);
          if(el.textContent!=w) el.textContent=(w||'');
        }else if(n=='w:html'){ was=wasContent=true; w=weave$evalExprs(el,$,v);
          el.innerHTML=(w||'');
        }else if(n=='w:show'){ was=true; w=weave$evalExpr(el,$,v);
          w$show(el,typeof(w)!='undefined'?w:null);
        }else if(n=='w:enable'){ was=true; w=w$toggle(weave$evalExpr(el,$,v));
          if(w){ if(!el.hasAttribute('disabled')) el.setAttribute('disabled','');
          }else{ if(el.hasAttribute('disabled')) el.removeAttribute('disabled');
          }
        }else if(n=='w:allowed'){ was=true; w=weave$evalExpr(el,$,v); var $w;
          (el.$w ||= {}).$allowed=W$ALLOW(w);
        }else if(n=='w:value'){ was=true; w=v;
          if(!!(w=w$findName(el))){ w=weave$evalExpr(el,$,w);
            var aName=el.nodeName=='OPTION'?'selected':'checked';
            if((v||'')==(w||'')) el.setAttribute(aName,''); else el.removeAttribute(aName);
            //break;
          }
        }else if(n=='w:weave'){ was=true; w=v.split(','); weave$currentAttr=null;
          for(var j=0; j<w.length; ++j){ weave$evalExpr(el,$,w[j]); }
        }
      }
      // Phase 2 writes control values, warnings, and allow-gated visibility/enabling.
      if(!was && mode!==1){
        if(n=='w:set'){ was=true; n=n.substring(s.length); w=weave$evalExpr(el,$,v);
          if(el.nodeName=='INPUT'){
            if(w!=el.getAttribute('value')) w!=null ? el.setAttribute('value',w) : el.removeAttribute('value');
          }else if(el.nodeName=='SELECT' || el.nodeName=='DATALIST'){
            el.value=w;
          }else{
            el.innerText=w;
          }
          weave$currentAttr=false;
          w$check(el,w||null);
        }else if(n.startsWith(s='w:set:')){ was=true; n=n.substring(s.length); w=weave$evalExpr(el,$,v);
          el[n]=w;
        }else if(n=='w:warning'){ var w=weave$evalExpr(el,$,v); //LOG&&console.log('w:warning',v,w);
          if(el.setCustomValidity) el.setCustomValidity(w||'');
          if(w) el.setAttribute('w:validity',w); else el.removeAttribute('w:validity');
        }else if(n=='w:show:allowed'){ var w=weave$evalExpr(el,$,v);
          w$show(el,w$allowed(el,w));
        }else if(n=='w:enable:allowed'){ var w=weave$evalExpr(el,$,v);
          el.disabled=!w$allowed(el,w);
        }
      }
    }
  }finally{ weave$currentAttr=null;
  }
  return wasContent;
}

var ____W$APPLY____

/** Core weaving pass: clone/apply template against current data context.
 * <li> Resolve the active pattern node, data context, and template reuse mode for the target.
 * <li> Apply list/item/type/name logic, attributes, and conditional/template substitutions.
 * <li> Reconcile child DOM against the pattern snapshot and finish with post-weave hooks.
 * <li> Handle fresh clone, reset, refresh-only, and list-expansion passes from the same entry point.
 * <li> Drive `w:use`, `w:if`, `w:each`, `w:item`, `w:children`, and named-widget setup before recursion.
 */
function w$apply(el,$,pattern,check,$w,base){ $=w$proxy($); var $this=$,s;
  var weave$current$save=weave$current; weave$currentAttr=null;
  try{
    // Attribute nodes are refreshed in place against their parent element context.
    if(el.nodeType==2){ // ATTRIBUTE
      if(w$proxy$paused.has(el.parentElement)) return el;
      if(el.parentElement.getAttribute('w:hold')) return el;
      weave$applyAttr(weave$current=el.parentElement,[el],$,0);
      return el;
    }
    if(w$proxy$paused.has(el)) return el;
    //if(el.nodeType==1 && el.getAttribute('w:hold')) return el;
    weave$current=el;
    // Resolve or create the template pattern that this live element will follow.
    if(pattern==null){
      if(el.$w && el.$w.w$){ // RESET
        pattern=el.$w.w$; check ||= true;
      }else if(check){ throw ['Not woven Element',el];
      }else{ pattern=el;
        var tagName=null; if(!!(tagName=el.getAttribute('w:tagname'))) tagName=weave$evalExpr(el,$,tagName);
        el=pattern.cloneNode(false,tagName); (el.$w ||= {}).w$=pattern; // START
        pattern.parentElement.replaceChild(el,pattern)
      }
    }else{ (el.$w ||= {}).w$=pattern;
    }
    // Rebuild repeated child segments from the mapped list when `w:item` expansion is active.
    if($w){ var children=pattern.childNodes, start=null,sep=null,end, idx=-1, $$arg=$w; // ELEMENTS
      do{
        for(var i=(start||0); i<(sep!=null ? sep : children?children.length:0); ++i){ var ch=children[i], needSet=false, last=false;
          if(ch.nodeName=='SCRIPT' || ch.nodeName=='STYLE') continue;
          $this=$;
          if(ch.nodeType==1){
            if(ch.nodeName=='W:ELSE'){ break;
            }else if(ch.hasAttribute('w:item') && !ch.getAttribute('w:item')){
              if(start==null){ start=end=i; sep=i+1; $$arg=null;
                for(var j=i+1; j<children.length; ++j){ var c=children[j];
                  var isThe=c.nodeType==1 && c.hasAttribute('w:item') && !c.getAttribute('w:item');
                  if(isThe){ end=j; if(sep==i+1) sep=j; }
                }
              }
              if(++idx>=$w.$$.length-1){ last=true; start=sep=null; i=end; } // utolsó
              if(idx<$w.$$.length){ $this=$w.$$[idx]; needSet=true; }else{ continue; }
            }
          }
          var e=needSet && $w.w$map.get($this), chk=!!e;
          if(chk){ ch=e.$w.w$;
          }else{
            var tagName=null; if(!!(tagName=ch.getAttribute('w:tagname'))) tagName=weave$evalExpr(el,$this,tagName);
            e=ch.cloneNode(false,tagName); /*while(el.firstChild) el.removeChild(el.firstChild);*/
          }
          el.appendChild(e);
          if(needSet && $this && typeof($this)=='object'){ // (e.$w || (e.$w={})).$$index=idx;
            Object.defineProperty($this,'$$index',{value:idx, enumerable:false, writable:true,});
            Object.defineProperty($this,'$$last',{value:last, enumerable:false, writable:true,});
            $w.w$map.set($this,e);
          }
          var c=w$apply(e,$this,ch,chk,$$arg,base);
        }
      }while(start!=null && start<(sep!=null ? sep : children.length));
    }else if(el.nodeType==1){ // ELEMENT
      // `w:use` and `w:children` can swap in a different template snapshot before child weaving.
      var checkUse=function(el,children){ var s;
        if((s=el.getAttribute('w:use'))){
          s=weave$evalMacros(el,$,s); var x=W$DEFINITIONS[s];
          if(!x) throw "w:define `"+s+"` definition was not found";
          for(var i=0; i<x.attributes.length; ++i){ var a=x.attributes[i]; if(a.name=='w:define') continue;
            if(!el.hasAttribute(a.name)) el.setAttribute(a.name,a.value);
          }
          children=x.childNodes;
        }
        if((s=el.getAttribute('w:children')) && weave$evalExpr(el,$this,s)){
          el.$w.w$=new WElement(el,W$DEFINITIONS,w$says); children=el.$w.w$.childNodes;
        }
        return children;
      }
      var wEach=el.getAttribute('w:each'), wThe=el.getAttribute('w:item'), wIf=el.getAttribute('w:if'), wif=true, wSkip=false;
      var children=pattern.childNodes;
      // `w:each` creates/reuses one branch per list item, with optional filtering and `w:else`.
      if(wEach!=null){ var $parent=$this, $list=$this; // WEACH
        if(wIf!=null){ wif=weave$cond(weave$evalExpr(el,$,wIf)); }
        if(wif){ $list=weave$evalExpr(el,$list,wEach); // néha nem ment: $list=check===-1 ? el.$w.$$ : weave$evalExpr(el,$list,wEach);
          if(w$isArray($list) && (s=el.getAttribute('w:when'))!=null){ var a=[];
            for(var i=0; i<$list.length; ++i){
              if(weave$cond(weave$evalExpr(el,$list[i],s))) a.push($list[i]);
            }
            $list=w$proxy(a);
          }
        }else{ $list=null;
        }
        if(!w$isArray($list)) $list=w$proxy([]);
        if(wThe!=='' && !!(s=el.getAttribute("w:type"))){ var pt;
          $list=w$setPrototypeOf($list,pt=W$TYPES[s]); //if(!el.classList.contains(s)) el.classList.add(s);
          if(typeof(pt=pt['$use'])=='function') pt.call($list,el);
          /// if(typeof(pt=pt['$action'])=='function') pt.call($list,el);
        }
        el.$w.$$=$list; if($parent && !w$isArray($parent)) Object.defineProperty($list,'$parent',{value:$parent, enumerable:false, writable:true,});
        // KELL? if(check!==-1) el.$w.$=$;
        if(!check || !el.$w.w$map) el.$w.w$map=new Map();
        while(el.firstChild) w$removeElement(el.firstChild);
        if(!(wSkip=wif=!!$list.length)){ //wSkip=wif=true;
          for(var i=0; children && i<children.length; ++i){ if(children[i].nodeName=='W:ELSE'){ wSkip=wif=false; break; } }
        }
        if(wif){
          if(wThe===''){ // WEACH-WTHE
            for(var i=0; i<$list.length; ++i){ var chk,e=check && el.$w.w$map && el.$w.w$map.get($list[i]);
              if(!(chk=!!e)){ e=el.cloneNode(false); e.removeAttribute('w:each'); el.$w.w$map.set($list[i],e); }
              el.appendChild(e);
              if($parent && !w$isArray($parent)) Object.defineProperty($list[i],'$parent',{value:$parent, enumerable:false, writable:true,});
              w$apply(e,$list[i],pattern,chk,undefined,base);
            }
          }else{ // WEACH-...
            for(var i=0; i<$list.length; ++i){
              if(w$isObject($list[i]) && w$isObject($parent)) Object.defineProperty($list[i],'$parent',{value:$parent, enumerable:false, writable:true,});
            }
            children=checkUse(el,children);
            weave$applyAttr(el,el.attributes,$,1);
            w$apply(el,$,pattern,check,el.$w,base)
          }
        }else if(wThe!==''){
          weave$applyAttr(el,el.attributes,$,1);
        }
      }else{ // OTHER
        // Non-list nodes resolve their bound item/type, then auto-name and apply attributes.
        if(wThe!=null){ var pt=null, fn; $this=check===-1 ? el.$w.$ : weave$evalExpr(el,$this,wThe);
          if(!!(s=el.getAttribute("w:type"))){ pt=W$TYPES[s];
            if(!pt) console.log('type handler `'+s+'` is not found');
            $this=w$setPrototypeOf($this,pt); //if(!el.classList.contains(s)) el.classList.add(s);
            if($this && typeof($this)=='object' && typeof(base)=='object' && typeof(base.$name)=='string')
              Object.defineProperty($this,'$parent',{value:base, enumerable:DEV, writable:true, });
            if(pt && typeof(fn=pt['$use'])=='function') fn.call($this,el);
          }
          base=el.$w.$=$this;
          if(pt && typeof(fn=pt['$action'])=='function')
            w$action(el,{target:null},{},el);
          if($this && typeof($this)=='object' && !$this.$original){ var saveEl=weave$current; weave$current=null;
            try{ Object.defineProperty($this,'$original',{value:w$assign({},$this), enumerable:DEV, writable:true, });
            }finally{ weave$current=saveEl;
            }
          }
        }
        if((s=w$attribute(el,'w:named'))!=null){ wSkip ||= weave$named(el,$this,s); }
        else if((s=w$attribute(el,'w:name'))!=null){ wSkip ||= weave$name(el,$this,s,true); }
        children=checkUse(el,children);
        wSkip=wSkip||weave$applyAttr(el,el.attributes,$this,1);
        if(wIf!=null){ wif=weave$cond(weave$evalExpr(el,$,wIf)); check=false; el.$w.$if=wif; }
      }
      // Reconcile child DOM either by refreshing matching branches or by cloning from the pattern snapshot.
      if(!wSkip && children){
        if(!wif){
          for(var i=0; i<children.length; ++i){ var ch=children[i];
            if(ch.nodeName=='W:ELSE'){ wif=ch; children=ch.childNodes; break; }
          }
          if(!wif) children=null;
          while(el.lastChild) w$removeElement(el.lastChild);
        }
        if(children){ var elCh=[];
          if(el && el.childNodes){
            for(let i=0; i<el.childNodes.length; ++i){ let ch=el.childNodes[i];
              if(ch.nodeType==1 || ch.nodeType==3) elCh.push(ch);
            }
          }
          if(check && !!(check=(children.length==elCh.length))){
            for(var i=0; i<elCh.length; ++i){ var c1,c2;
              if(!((c1=elCh[i]).$w && c1.$w.w$==children[i])){ check=false; break; }
            }
          }
          if(check){ children=elCh;
            for(var i=0; i<children.length; ++i){ var ch=children[i],e;
              w$apply(ch,$this,ch.$w.w$,true,undefined,base);
            }
          }else{
            while(el.lastChild) w$removeElement(el.lastChild);
            for(var i=0; i<children.length; ++i){ var ch=children[i],e; if(ch.nodeName=='W:ELSE') break;
              e=el.appendChild(ch.cloneNode(false));
              w$apply(e,$this,ch,undefined,undefined,base);
            }
          }
        }
      }
      if(el.attributes){ weave$applyAttr(el,el.attributes,$this,2); }
      /*if(el.$w.$actions){ weave$currentAttr=false;
        w$action(el,null);
        LOG&&console.log(el.$w.$actions);
      }*/
    }
    if(el.nodeType==1 && (s=el.getAttribute('w:done')) && w$isObject($this) && typeof(s=$this[s])=='function') s.call($this,el);
    if(el.nodeType==1) el.classList.remove('w');
  }finally{ weave$current=weave$current$save; weave$currentAttr=null;
  }
  return el;
}

//function w$css(arg){
//  if(!w$STYLE){ w$STYLE=w$element("style",{name:'w:css'});
//    w$STYLE.appendChild(document.createTextNode(""));
//    document.head.appendChild(w$STYLE);
//  }
//  if(typeof(arg)=='string'){ var rules=w$STYLE.sheet;
//    rules.insertRule(arg,rules.length ? rules.length : 0);
//  }
//  return w$STYLE;
//}

//  w$jsonTransfer=function jsonTransfer(e,arg){
//    if(typeof(arg)=='undefined'){
//      var s=(e.dataTransfer && e.dataTransfer.getData('application/json') || typeof(W$DATATransfer)!='undefined');
//      if(typeof(s=W$DATATransfer)!='string' || !s) return s;
//      return JSON.parse(s);
//    }else{
//      e.dataTransfer.setData("application/json",W$DATATransfer=arg);
//      return e.dataTransfer;
//    }
//  };

/** Assign prototype, proxy-aware, only when needed. */
function w$setPrototypeOf(obj,proto){
  if(!proto || !obj || typeof(obj)!='object' || Array.isArray(obj) || Object.getPrototypeOf(obj)===proto) return obj;
  if(proto.isPrototypeOf(obj)) return obj;
  if(typeof(Proxy)=='undefined'){
    if(Object.getPrototypeOf(obj)==Object.prototype){ return Object.setPrototypeOf(obj,proto); }
  }else{ Object.setPrototypeOf(obj=w$proxy(obj),proto);
  }
  return obj;
}

/** Normalize allow-level value from int/string marker. */
function W$ALLOW(v){
  if(typeof(v)=='number' && Number.isInteger(v)){ return v; }
  if(typeof(v)=='string' && v){ var c=v.charAt();
    switch(c.toLowerCase()){
      case '0': case '-':            return 0; // none
      case 'r': case 'g': case '+':  return 1; // read/get
      case 'c':                      return 2; // change settings
      case 'l':                      return 3; // list
      case 'a':                      return 4; // add to list
      case 'd':                      return 5; // delete
      case 'w': case 's': case '=':  return 6; // write/set
      case '*':                      return 7; // all
    }
  }
  return 5;
}
/** Checks whether required allow-level `b` is granted by `a`/ancestor config. */
function w$allowed(a,b){
  if(a instanceof HTMLElement){ var e=a,$w; a=undefined;
    for( ; e; e=e.parentElement){ if(($w=e.$w) && ('$allowed' in $w)){ a=$w.$allowed; break; } }
  }
  var af=W$ALLOW(a), bf=W$ALLOW(b);
  return af>=bf;
}

/** Registered `w:define` templates by name. */
var W$DEFINITIONS={};

/** Built-in conversion functions used by weave expressions. */
var W$CONVERSIONS={
 'LOG': function(el,v,arg){
        console.log(v);
        return v;
      },
  '?': function(el,v,arg){
        if(arg=='true'){ arg=true; }else if(arg=='1'){ arg=1; }else if(arg===''){ arg=true;
        }else{ if(arg.startsWith("'") && arg.endsWith("'")){ arg=arg.substring(1,arg.length-1); }
        }
        return w$is(v,arg);
      },
  '??': function(el,v,arg){
         if(arg.startsWith("'") && arg.endsWith("'")){ arg=arg.substring(1,arg.length-1); }
         return w$is(v,arg);
      },
 '?1': function(el,v,arg){ return w$is(v,1); },
  '!': function(el,v,arg){
        if(arg=='true'){ arg=true; }else if(arg=='1'){ arg=1; }else if(arg===''){ arg=true;
        }else{ if(arg.startsWith("'") && arg.endsWith("'")){ arg=arg.substring(1,arg.length-1); }
        }
        return w$toggle(v,arg);
      },
  '!!': function(el,v,arg){
        if(arg.startsWith("'") && arg.endsWith("'")){ arg=arg.substring(1,arg.length-1); }
        return w$toggle(v,arg);
      },
 '!1': function(el,v,arg){ return w$toggle(v,1); },
 '()':function(el,v,arg){
        if(!arg || !arg.trim()) return {};
        return w$arg(el,arg)
      },
 '?=':function(el,v,arg){ return v?encodeURIComponent(v):null; }, // percent encoding
 '?()':function(el,v,arg){
    return w$setParameters(arg && arg.trim() ? w$arg(el,arg) : {},'?');
  },
 '~JSON':function(el,v,arg){
    return typeof(v)=='object' ? JSON.stringify(v) : ''+v;
  },
 '??()':function(el,v,arg){ var loc=window.location.href, idx, search='?';
    if((idx=loc.indexOf('?'))!=-1){ search=loc.substring(idx); }
    return w$setParameters(arg && arg.trim() ? w$arg(el,arg) : {}, search);
  },
  '~':function(el,v,arg){ v=(v?String(v):''); // concatenation
    if(w$isArray(arg)){  for(var i=0; i<arg.length; ++i) v+=(arg[i]||'');
    }else{ return v+=(arg||'');
    }
    return v;
  },
  '+':function(el,v,arg){ v=(v?Number(v):0);
    if(w$isArray(arg)){  for(var i=0; i<arg.length; ++i) v+=(arg[i]?Number(arg[i]):0);
    }else{ return v+=(arg?Number(arg):0);
    }
    return v;
  },
  '-':function(el,v,arg){ v=(v?Number(v):0);
    if(w$isArray(arg)){  for(var i=0; i<arg.length; ++i) v-=(arg[i]?Number(arg[i]):0);
    }else{ return v-=(arg?Number(arg):0);
    }
    return v;
  },
  '*':function(el,v,arg){ v=(v?Number(v):0);
    if(w$isArray(arg)){  for(var i=0; i<arg.length; ++i) v*=(arg[i]?Number(arg[i]):0);
    }else{ return v*=(arg?Number(arg):0);
    }
    return v;
  },
  '/':function(el,v,arg){ v=(v?Number(v):0);
    if(w$isArray(arg)){  for(var i=0; i<arg.length; ++i) v/=(arg[i]?Number(arg[i]):1);
    }else{ return v/=(arg?Number(arg):1);
    }
    return v;
  },
  '#':function(el,v,arg){
    return v ? w$find$(v,arg,el) : w$undefined();
  },
  /// '.' alelem arg név alapján
}

/** Evaluate only prefix conversion chain (`[conv]...`) on `result`. */
function weave$conversion(el,$,expr,result){ var idx; if(!expr) return result;
  try{
    if(expr.startsWith('[') && (idx=expr.indexOf(']'))!=-1){
      var result=weave$conversion(el,$,expr.substring(idx+1),result);
      return weave$conv(el,$,expr.substring(1,idx),result);
    }else{
      return result;
    }
  }catch(e){ console.log('Exception evaluating `'+expr+'`:',e,el);
    throw e;
  }
}

/** Index of optional `(...)` arguments in `arg`, or `-1`. */
function w$argIndex(arg){ return arg ? arg.indexOf('(') : -1; }
/** Name part before optional `(...)` arguments. */
function w$argName(arg){ var idx; return arg && (idx=arg.indexOf('('))!=-1 ? arg.substring(0,idx) : arg; }

/** Auto-configure named widgets (input/select/button/etc.) from data metadata.
 * <li> Resolve metadata keys for the named field in both dotted and flattened `$` forms.
 * <li> Derive default element attributes, validation hooks, and allowed-state wiring.
 * <li> Special-case common controls like forms, buttons, inputs, selects, and display wrappers.
 * <li> Fill placeholder, range, required, and default/value behavior from field metadata when present.
 * <li> Map control type conventions into framework bindings, events, and validation callbacks.
 */
function weave$name(e,$this,nm, events){ var n=e.nodeName,nn,type,v, wSkip=false;
  // Resolve metadata keys both in dotted and `$`-flattened form.
  var isIn=function($this,nn){
    return (nn in $this || nn.indexOf('.')!=-1 && (nn=nn.replaceAll('.','$')) in $this) ? nn : null;
  };
  var val=function($this,nn){
    return (nn in $this || nn.indexOf('.')!=-1 && (nn=nn.replaceAll('.','$')) in $this) ? $this[nn] : undefined;
  };
  var name=w$argName(nm||''), $$name=name /*full outer name*/;
  if((v=name.indexOf('..'))!=-1){ $$name=name.substring(0,v)+name.substring(v+1); name=name.substring(v+1); }
  var $name=name.indexOf('.')!=-1 ? name.replaceAll('.','$') : null;
  $this ||= {};
  if(name && !e.hasAttribute('name')){ e.setAttribute('name',$$name); }
  if(name.startsWith('!')) name=name.substring(1);
  if(typeof(type=$this[name+'$type'])!='undefined' || $name && typeof(type=$this[$name+'$type'])!='undefined'
  ){ v=type=type.toLowerCase();
    if(v=='boolean') v='checkbox';
    else if(v=='string') v='text';
    else if(v=='html') v='text';
    else if(v=='integer') v='number';
  }
  if( (   (nn=name+'$title') in $this || $name && (nn=$name+'$title') in $this
       || (nn=name+'$hint')  in $this || $name && (nn=$name+'$hint')  in $this )
     && !e.hasAttribute('title') && !e.hasAttribute('w:attr:title') ){
      e.setAttribute('w:attr:title',nn);
  }
  // Per-element defaults wire validation, allowed-state, and definitions from metadata.
  if(n=='FORM'){
    if(!e.hasAttribute('accept-charset') && !e.hasAttribute('w:attr:accept-charset')){
      e.setAttribute('accept-charset','utf-8');
    }
    if(!e.hasAttribute('onsubmit')){ e.setAttribute('onsubmit',"return w$submit(event)");
      if(!e.hasAttribute('w:on:submit')){ e.setAttribute('w:on:submit',nm); }
    }
  }else if(n=='BUTTON'){
    if(!!(nn=val($this,name+'$definition'))){ w$defineElement(e,nn); }
    if(!e.hasAttribute('onclick') && !e.hasAttribute('w:on:click')){ e.setAttribute('w:on:click',nm); }
    if(!!(nn=isIn($this,name+'$apt'))
        && !e.hasAttribute('disabled') && !e.hasAttribute('w:attr:disabled') && !e.hasAttribute('w:enable:allowed')){
      e.setAttribute('w:enable',nn);
    }else if(!!(nn=isIn($this,name+'$allowed'))
        && !e.hasAttribute('disabled') && !e.hasAttribute('w:attr:disabled') && !e.hasAttribute('w:enable:allowed')){
      e.setAttribute('w:enable:allowed',nn);
    }
  }else if(n=='SELECT' || n=='DATALIST'){
    if(!!(nn=val($this,name+'$definition'))){ wSkip=true; w$defineSelect(e,nn); }
    if(!!(nn=isIn($this,name+'$required')) && !e.hasAttribute('required') && !e.hasAttribute('w:attr:required')){
      e.setAttribute('w:attr:required','[??]'+nn);
    }
    if(/*(nn=name) in $this && */!e.hasAttribute('w:attr:value') && !e.hasAttribute('w:set:value') && !e.hasAttribute('w:set') ){
      e.setAttribute('w:set',name);
    }
    if(!!(nn=isIn($this,name+'$allowed')) && !e.hasAttribute('disabled') && !e.hasAttribute('w:enable:allowed')){
      e.setAttribute('w:enable:allowed',nn);
    }
    if(events && !!(nn=isIn($this,name+'$check') || isIn($this,name+'$valid'))
        && !e.hasAttribute('oninput') && !e.hasAttribute('w:on:input')){
      e.setAttribute('oninput',"w$no(event); w$check(this); return false;");
    }
    if(!e.hasAttribute('w:warning')){
      e.setAttribute('w:warning',name+'$warning');
    }
  }else if(n=='INPUT'){ var inputType=v, length=val($this,name+'$length'),decimal, li;
    if(typeof(length)=='string' && length && (li=length.indexOf(','))!=-1){ decimal=length.substring(li+1); length=length.substring(0,li); }
    if(typeof(inputType)!='undefined' && !e.hasAttribute('type')){
      e.setAttribute('type',inputType);
    }
    if(type=='string'){
      if(!e.hasAttribute(nn='autocorrect') && !e.hasAttribute('w:attr:autocorrect')) e.setAttribute(nn,'off');
      if(!e.hasAttribute(nn='autocapitalize') && !e.hasAttribute('w:attr:autocapitalize')) e.setAttribute(nn,'off');
      if(!e.hasAttribute(nn='spellcheck') && !e.hasAttribute('w:attr:spellcheck')) e.setAttribute(nn,'false');
    }
    if(!!(nn=val($this,name+'$definition'))){ w$defineElement(e,nn); }
    if(!!(nn=isIn($this,name+'$required')) && !e.hasAttribute('required') && !e.hasAttribute('w:attr:required')){
      e.setAttribute('w:attr:required','[??]'+nn);
    }
    if((nn=isIn($this,name+'$placeholder')) && !e.hasAttribute('placeholder') && !e.hasAttribute('w:attr:placeholder')){
      e.setAttribute('w:attr:placeholder',nn);
    }
    if(e.type=='button' || e.type=='submit'){ var el;
      for(el=e; el && el.nodeName!='FORM'; el=el.parentElement){}
      LOG&&console.log('FORM',el,e);
      /*if(e.type=='submit'){
      }*/
      if(!!(nn=isIn($this,name+'$apt'))
          && !e.hasAttribute('disabled') && !e.hasAttribute('w:attr:disabled') && !e.hasAttribute('w:enable:allowed')){
        e.setAttribute('w:enable',nn);
      }
      if(!!(nn=isIn($this,name+'$allowed'))
          && !e.hasAttribute('disabled') && !e.hasAttribute('w:attr:disabled') && !e.hasAttribute('w:enable:allowed')){
        e.setAttribute('w:enable:allowed',nn);
      }
    }else if(e.type=='checkbox' || e.type=='radio'){ var v;
      if((nn=w$attribute(e,'w:set'))!=null && !e.hasAttribute('w:attr:value') && !e.hasAttribute('w:set:value')){
        v='='+nn;
      }else{ v=w$attribute(e,'value'); v=v!=null ? '="'+v+'"' : '';
      }
      if(name && !e.hasAttribute('checked') && !e.hasAttribute('w:attr:checked') && !e.hasAttribute('w:set:checked')){
        e.setAttribute('w:attr:checked',name+v+"?'checked':null");
        e.setAttribute('w:set:checked',name+v);
      }
    }else{
      if(!e.hasAttribute('w:attr:value') && !e.hasAttribute('w:set:value') && !e.hasAttribute('w:set')){
        e.setAttribute('w:set',name);
      }
      if(e.type=='number' || e.type=='date'){
        if(!!(nn=isIn($this,name+'$min')) && !e.hasAttribute('min') && !e.hasAttribute('w:attr:min')){
          e.setAttribute('w:attr:min',nn);
        }
        if(!e.hasAttribute('max') && !e.hasAttribute('w:attr:max')){
          if(!!(nn=isIn($this,name+'$max'))){ e.setAttribute('w:attr:max',nn);
          }else if(length){ e.setAttribute('max',Math.pow(10,length-decimal)-1);
          }
        }
        if(e.type=='number' && !e.hasAttribute('step') && !e.hasAttribute('w:attr:step')){
          if(decimal){ e.setAttribute('step',Math.pow(10,-decimal));
          }else if(!!(nn=isIn($this,name+'$step'))){ e.setAttribute('w:attr:step',nn);
          }else if(type!='integer'){ e.setAttribute('step','any');
          }
        }
      }else{
        if(!e.hasAttribute('size') && !e.hasAttribute('w:attr:size')){
          if(!!(nn=isIn($this,name+'$size'))) e.setAttribute('w:attr:size',nn);
          else if(length) e.setAttribute('size',length);
        }
        if(length && !e.hasAttribute('maxlength') && !e.hasAttribute('w:attr:maxlength')){
          e.setAttribute('maxlength',length);
        }
        if(!!(nn=isIn($this,name+'$pattern')) && !e.hasAttribute('pattern') && !e.hasAttribute('w:attr:pattern')){
          e.setAttribute('w:attr:pattern',nn);
        }
      }
    }
    if(events && ((name+'$check') in $this || (name+'$valid') in $this)
        && !e.hasAttribute('oninput') && !e.hasAttribute('w:on:input')){
      e.setAttribute('oninput',"return w$name$oninput(this,event);");
    }
    if(!e.hasAttribute('w:warning')){
      e.setAttribute('w:warning',name+'$warning');
    }
  }else{
    // Non-input display wrappers can still map to radio/checkbox/html/text behavior.
    //if(!!(nn=$this[nn=name+'$definition'])){ w$defineElement(el,nn); }
    type=e.getAttribute('type')
    if(type=='radio'){
      var value=weave$evalExpr(e,$this,name);
      if(!!(nn=val($this,name+'$definition'))){ wSkip=true; w$defineRadio(e,name,nn,value); }
    }else if(type=='checkbox'){
      var value=weave$evalExpr(e,$this,name);
      if(!!(nn=val($this,name+'$definition'))){ wSkip=true; w$defineCheckbox(e,name,nn,value); }
    }else if(type=='html' || !type && n=='DIV'){
      if(!e.classList.contains('whtml')) e.classList.add('whtml');
      if(!e.hasAttribute('w:html') && !e.hasAttribute('w:text')){
        e.setAttribute('w:html',name);
      }
    }else if(n=='DIV'){
      if(!e.classList.contains('wtext')) e.classList.add('wtext');
      if(!e.hasAttribute('w:html') && !e.hasAttribute('w:text')){
        e.setAttribute('w:text',name);
      }
    }
  }
  return wSkip;
}
/** Named-mode variant of `weave$name` that also wires default input events. */
function weave$named(e,$this,name){ var n=e.nodeName,nn,v;
  var nm=e.getAttribute('w:name')||name||e.getAttribute('name');
  var wSkip=weave$name(e,$this,nm);
  if(n=='INPUT' && !(e.type=='button' || e.type=='submit' || e.type=='reset')
      || n=='DIV' || n=='SELECT' || n=='DATALIST'){
    if(!e.hasAttribute('w:on:input:action')){ e.setAttribute('w:on:input:action','()'); }
    if(!e.hasAttribute('oninput') && !e.hasAttribute('w:on:input')){ e.setAttribute('w:on:input',''); }
  }
  return wSkip;
}


/** Default oninput helper for name-based validation/checking. */
function w$name$oninput(el,ev){
  w$no(ev); w$check(el); return false;
}

/** Submit helper that forwards the form event to `w:on:submit`. */
function w$submit(ev){ var el=ev.target, arg=w$get(el), nm, e;
  if(!!(e=ev.submitter) && e.type=='submit' && !!(nm=e.getAttribute('name'))) arg[nm]='';
  if(w$on(ev,"submit",el,arg)===null){
    throw new ReferenceError('Event handler for w:on:submit was not found');
  }
  return w$no(ev);
}

//#endregion
//#region DATA_AND_ELEMENT

/** Find nearest ancestor (or self) that has mapped `$w.$` data. */
function w$element$(el){ for( ; el && !(el.$w && '$' in el.$w); el=(el.$w && el.$w.parent) || el.parentElement){ } return el; }
/** Find nearest ancestor (or self) that has mapped `$w.$$` list. */
function w$element$$(el){ for( ; el && !(el.$w && el.$w.$$); el=(el.$w && el.$w.parent) || el.parentElement){ } return el; }
/** Resolve current row and index inside the nearest mapped list. */
function w$element$$index(el){ el=w$element$(el); if(!el || !el.$w) return null; var $=el.$w.$, e; if(!(e=w$element$$(el))) return null;
  var $$=e.$w.$$; return { $$:$$, $:$, el:el, $$el:e, e:e /*compatibility*/, index:$$.indexOf($) }
}
/** Find nearest `w:named`/`w:name`/`name` value (without optional args). */
function w$findName(el){
  for( ; el; el=el.$w&&el.$w.parent||el.parentElement){ var v, idx;
    if((v=w$attribute(el,'w:named'))!=null || (v=w$attribute(el,'w:name'))!=null || (v=w$attribute(el,'name'))!=null){
      if((idx=v.indexOf('('))!=-1) v=v.substring(0,idx).trim();
      return v;
    }
  }
  return null;
}
/** Find mapped data upwards, optionally through a selector parent. */
function w$data(el,sel,skip){
  if(sel){ el=w$parent(el,sel,skip); return el && el.$w ? el.$w.$ : undefined;
  }else{ var $; return ($=w$element$(el)) && ($=$.$w) && '$' in $ ? $.$ : undefined;
  }
}
/** Find mapped list upwards, optionally through a selector parent. */
function w$list(el,sel,skip){
  if(sel){ el=w$parent(el,sel,skip); return el && el.$w ? el.$w.$$ : undefined;
  }else{ var $$; return ($$=w$element$$(el)) && ($$=$$.$w) && '$$' in $$ ? $$.$$ : undefined;
  }
}

/** Registered WTypes */
var W$TYPES={};

/** Find first `ruleName` from matching WType classes walking up the DOM tree. */
function w$findRule(el,ruleName, fn){
  for( ; el; el=el.parentElement){ var classes=el.classList; if(!classes) continue;
    // Return the first matching rule from the current class chain.
    for(var i=0; i<classes.length; ++i){ var type=classes[i], t;
      if(!!(t=W$TYPES[type]) && ruleName in t){
        if(typeof(fn)=='function'){ return fn(el,t,t[ruleName]);
        }else{ return t[ruleName];
        }
      }
    }
  }
  return undefined;
}

/** Clone/apply a named `w:define` template and insert it before/under the target. */
function w$use(name,$,el,beforeOrParent){ var x=W$DEFINITIONS[name];
  if(!x) throw new ReferenceError("w:define `"+name+"` was not found");
  var tagName=null; if(!!(tagName=x.getAttribute('w:tagname'))) tagName=weave$evalExpr(el,$,tagName);
  var e=x.cloneNode(false,tagName); e.removeAttribute('w:define');
  if(el){ el.insertBefore(e,beforeOrParent); }else if(beforeOrParent){ (e.$w ||= {}).parent=beforeOrParent; }
  w$apply(e,$,x);
  return e;
}

/** Deep-merge object values into mapped data (or element data). */
function w$merge($,value){ if($ instanceof HTMLElement) $=w$data($);
  if((typeof(value)=='object') && value!=null){ var v;
    // Merge nested plain objects recursively and replace non-object targets on demand.
    for(var k in value){ v=value[k];
      if(v && (typeof(v)=='object') && !w$isArray(v)){
        if(!w$isObject($[k])) $[k]=w$proxy({});
        w$merge($[k],v);
      }else{ $[k]=v;
      }
    }
  }
  return $;
}
/** Default auto-refresh behavior for `w$weave`. */
var W$REFRESH=true;

/** Apply one batched weave assignment tuple (`[path,data,time]` or `[data,time]`). */
function w$weave$data(el,c){
  var w,data,t,e,$,fn;
  // Split tuple form into optional path, payload, and sync timestamp.
  if(typeof(c[0])=='string'){ w=c[0]; data=c[1]; t=c[2]; }else{ w=''; data=c[0]; t=c[1]; }
  if(w && w.startsWith(' ')){ w=w.substring(1); e=el; $=(e!=document.body) && w$data(e)||W$DATA;
  }else{ e=document.body; $=W$DATA;
  }
  // `@selector@path` retargets the write to another woven element before path evaluation.
  if(w.startsWith('@')){ var i=w.indexOf('@',1);
    e=w$element(w$query(w.substring(1,i))); w=w.substring(i+1);
    $=(e!=document.body) && w$data(e)||W$DATA;
  }
  if(w) $=weave$evalExpr(e,$,w);
  // Prefer custom `$set(...)` hooks before falling back to plain assignment.
  if(typeof($)=='object' && typeof(fn=$['$set'])=='function'){ fn.call($,data)
  }else{ w$assign($,data);
  }
}

/** Update mapped data/list and optionally trigger refresh (`=`, `.`, `#`, `+/-`, etc.).
 * <li> Accept either one command or a batch of queued weave tuples for the target element.
 * <li> Apply list/object mutations according to the command prefix and update warnings.
 * <li> Trigger immediate refresh only when the command/prefix requires it.
 * <li> Support replace, merge, insert, delete, list splice, and warning-only command forms.
 * <li> Preserve no-refresh variants and sync timestamps while normalizing the incoming target element.
 */
function w$weave(el,cmd,val,def){ var x,idx;
  el ||= document.body;
  cmd ??= '';
  // Batched tuples are applied first and may push out the global sync time.
  if(w$isArray(cmd)){ el=w$element$(el); if(!cmd[0] || !w$isArray(cmd[0])) cmd=[cmd];
    for(idx=0; idx<cmd.length; ++idx){ var c=cmd[idx]; if(!w$isArray(c)) continue;
      w$weave$data(el,c);
      var t= typeof(c[0])=='string' ? c[2] : c[1];
      if(t && w$sync$time<t) w$sync$time=t;
    }
    return el;
  }
  if(typeof(def)!='undefined'){
    if(!cmd.endsWith(':')
        || !(typeof(val)=='object' && val!=null && Object.keys(val).length===0 && val.constructor===Object))
      val=def;
  }
  var refresh=W$REFRESH, warn=(typeof(val)=='object' && val && !w$isArray(val));
  // Prefixes control warning/reset behavior and whether the refresh should be deferred/skipped.
  if(cmd.startsWith('~')){ cmd=cmd.substring(1); refresh=false;
  }else{ w$warning(el);
    if(cmd.startsWith('!')){ cmd=cmd.substring(1); refresh=true; }
  }
  // Apply the requested list/object mutation and refresh the affected woven branch when needed.
  switch(cmd){
    case '[': case ']': // insert top/bottom
      if(val && !!(el=w$element$$(el))){ if(cmd=='[') el.$w.$$.unshift(val); else el.$w.$$.push(val);
        if(warn) w$warning(el,val);
        if(refresh) w$refresh('now',el);
      }
      break;
    case '<': case '>': // insert before/after
      if(!!(x=w$element$$index(el)) && (cmd=='>' || x.index!=-1)){
        x.$$.splice(cmd=='<'?x.index:x.index+1,0,val);
        if(warn) w$warning(x.e,val);
        if(refresh) w$refresh('now',x.e);
      }
      break;
    case '-':  // delete
      if(!!(x=w$element$$index(el)) && x.index!=-1){
        x.$$.splice(x.index,1);
        if(warn) w$warning(x.e,val);
        if(refresh) w$refresh('now',x.e);
      }
      break;
    case '#': // replace list
      if(!!(el=w$element$$(el))){ if(!w$isArray(val)) val=w$proxy([]);
        Array.prototype.splice.apply(el.$w.$$,[0,el.$w.$$.length].concat(val));
        if(warn) w$warning(el,val);
        if(refresh) w$refresh('now',el);
      }
      break;
    case '.': // replace object in list
      if(!!(x=w$element$$index(el)) && x.index!=-1){
        x.$$[x.index]=val; x.el.$w.$=val;
        if(warn) w$warning(x.el,val);
        if(refresh) w$refresh('now',x.el);
      }
      break;
    case '=': // replace object
      if(!!(el=w$element$(el))){ el.$w.$=val;
        if(warn) w$warning(el,val);
        if(refresh) w$refresh('now',el);
      }
      break;
    case '?': // check warning
      if(!!(el=w$element$(el))){
        if(warn) w$warning(el,val);
      }
      break;
    default: // merge object
      if(!!(el=w$element$(el))){
        if(typeof(val)=='object'){
          w$merge(el.$w.$,val); //val=el.$w.$;
        }
        if(warn) w$warning(el,val);
        if(refresh) w$refresh('now',el);
      }
      break;
  }
  return el;
}

/** Pending proxy-triggered refresh targets and scheduling state. */
var w$proxy$sets=new Map(), w$proxy$paused=new Set(), w$proxy$when=0, w$proxy$AnimationFrame=null;

/** Schedule or run refresh for queued proxy updates.
 * <li> Queue direct element or attribute refresh requests until the current flush point.
 * <li> Collapse queued descendants behind the highest necessary woven ancestor.
 * <li> Re-apply whole elements or individual bound attributes, then clear pause/queue state.
 * <li> Accept deferred timestamps, direct elements, or whole dependency maps from proxy traps.
 * <li> Coalesce repeated attribute names per element before issuing the minimal apply calls.
 */
function w$refresh(e$,arg,op2){ cancelAnimationFrame(w$proxy$AnimationFrame); w$proxy$AnimationFrame=null;
  var now; if(!!(now=(e$=='now'))){ e$=arg; arg=op2; }
  // Queue direct element/map refresh requests unless this call is the immediate flush pass.
  if(typeof(e$)=='number'){
    if(performance.now()<w$proxy$when){ w$proxy$AnimationFrame=requestAnimationFrame(w$refresh); return; }
  }else if(e$){
    if(e$ instanceof HTMLElement){ w$proxy$sets.set(e$,''); var $;
      if(arg && e$.$w && !!($=e$.$w.$)){ for(var e in arg){ $[e]=arg[e]; } }
    }else if(e$ instanceof Map){
      e$.forEach(function(ee,el){
        if(w$hasParent(el)){
          if(ee===''){ w$proxy$sets.set(el,'');
          }else{ var es=w$proxy$sets.get(el);
            if(es==null){ w$proxy$sets.set(el,ee);
            }else if(es!==''){
              for(var i=0; i<ee.length; ++i){ if(es.indexOf(ee[i])==-1) es.push(ee[i]); }
            }
          }
        }else{
          e$.delete(el);
        }
      });
    }
    if(!now){
      w$proxy$when=performance.now()+10; w$proxy$AnimationFrame=requestAnimationFrame(w$refresh); return;
    }
  }
  LOG&&console.log(w$proxy$sets);
  // Refresh only the highest necessary element or attribute bindings for each queued target.
  if(w$proxy$sets.size){
    var e$=w$proxy$sets;
    e$.forEach(function(ee,e,set){ var el=e.$w && '$' in e.$w ? e :null;
      for(var p=e.parentElement; p; p=p.parentElement){
        if(e$.get(p)==='') return;
        if(el==null && p.$w!=null && '$' in p.$w) el=p;
      }
      if(el==null) return;
      var $=w$data(el);
      LOG&&console.log("w$refresh: ",e,ee,$==el.$w.$,$);
      if(ee===''){
        w$apply(e,$,null,-1);
      }else{
        for(var i=0; i<ee.length; ++i){
          w$apply(new WAttributeReference(e,ee[i]),$,null,-1);
        }
      }
    });
    w$proxy$sets.clear();
  }
  w$proxy$paused.clear();
}

var ___PROXY____

/** Proxy handler storing dependency maps and optional prototype overlays. */
function w$proxyHandler(){
  this.$w$={};
}

/** Proxy trap: own keys from wrapped object. */
w$proxyHandler.prototype.ownKeys=function(object){ return Object.getOwnPropertyNames(object); };

/** Proxy trap: add prototype overlay (non-array objects only). */
w$proxyHandler.prototype.setPrototypeOf=function(obj, proto){
  if(!proto || !obj || typeof(obj)!=='object' || Array.isArray(obj) || Object.getPrototypeOf(obj)===proto) return true;
  if(proto.isPrototypeOf(obj)) return true;
  const protos=(this.$w$prototype || (this.$w$prototype=[]));
  if(!protos.includes(proto)) protos.push(proto);
  return true;
}
/** Proxy trap: get first prototype overlay. */
w$proxyHandler.prototype.getPrototypeOf=function(obj){
  if(!obj || typeof(obj)!=='object' || !this.$w$prototype) return null;
  return this.$w$prototype[0];
}
/** Resolve property descriptor through object/prototype chains. */
w$proxyHandler.prototype.getPropertyDescriptor=function(obj,nm){ var pd;
  // Search the wrapped object chain first, then any manually overlaid prototypes.
  for(let p=obj; p; p=Object.getPrototypeOf(p)) if(!!(pd=Object.getOwnPropertyDescriptor(p,nm))) return pd;
  if(this.$w$prototype){
    for(let i=0; i<this.$w$prototype.length; ++i){
      for(let proto=this.$w$prototype[i]; proto; proto=Object.getPrototypeOf(proto))
        if(!!(pd=Object.getOwnPropertyDescriptor(proto,nm))) return pd;
    }
  }
  return void(0);
}
/** Proxy trap: property existence across object and overlays. */
w$proxyHandler.prototype.has=function(obj, nm){ if(nm in obj) return true;
  if(this.$w$prototype){
    // Prototype overlays participate in `in` checks for weave expressions and rule lookup.
    for(let i=0; i<this.$w$prototype.length; ++i){
      try{ if(nm in this.$w$prototype[i]) return true;
      }catch(e){ console.log(e);
      }
    }
  }
  return false;
}
/** Proxy trap: read property and register dependency links.
 * <li> Resolve direct proxy meta-properties before ordinary object/property lookup.
 * <li> Read through own properties, overlay descriptors, and `$default` fallbacks.
 * <li> Register the current weave dependency and lazily proxy nested writable objects.
 * <li> Expose proxy bookkeeping fields such as `$w$proxy`, `$w$object`, `$w$`, and array markers.
 * <li> Persist resolved default values or newly proxied nested objects back onto the wrapped source.
 */
w$proxyHandler.prototype.get=function(obj, nm){ var v,pd;
  if(typeof(nm)==='symbol') return obj[nm];
  if(nm==='$w$proxy') return this.$w$proxy;
  if(nm==='$w$object') return obj;
  //if(nm==='$w$prototype') return this.$w$prototype;
  if(nm==='$w$') return this.$w$;
  if(nm==='$w$isArray') return Array.isArray(obj);
//  if(nm=="nn")
//    LOG&&console.log("GET:"+nm+"=",obj[nm]);
  if(nm.startsWith('$w$direct$')){ nm=nm.substring(10); }
  var hasOwnProperty=Object.prototype.hasOwnProperty.call(obj,nm), def=false, rew=false;
  // Resolve own properties first, then `$default` fallbacks and overlay descriptors.
  if(!!(pd=this.getPropertyDescriptor(obj,nm))
    || !nm.endsWith('$default') && (def=!!(pd=this.getPropertyDescriptor(obj,nm+"$default")))
  ){ v= pd.get ? pd.get.call(this.$w$proxy) : pd.value;
  }else{ v=obj[nm];
  }
  // Register dependencies for the current weave target and lazily proxy nested writable objects.
  if(hasOwnProperty||def||pd&&pd.get){
    if(weave$current && weave$currentAttr!==false){
      var map=this.$w$['~'+nm] || (this.$w$['~'+nm]=new Map());
      if(weave$currentAttr){ var mapEl=map.get(weave$current);
        if(mapEl!==''){
          if(mapEl==null) map.set(weave$current,[weave$currentAttr])
          else if(mapEl.indexOf(weave$currentAttr)==-1) mapEl.push(weave$currentAttr);
        }
      }else{ map.set(weave$current,'');
      }
      /*var s=this.$w$[' '+nm] || (this.$w$[' '+nm]=new Set());
      if(weave$currentAttr){
        if(!s.has(weave$current)) s.add(new WAttributeReference(weave$current,weave$currentAttr));
      }else{
        s.add(weave$current);
      }*/
    }
    if(!(v===null || typeof(v)!='object' || v.$w$proxy || !pd.writable)){ v=w$proxy(v); rew=true; }
    if(def || rew){
      if(def && nm.indexOf('$')!=-1 && !DEV){
        Object.defineProperty(obj, nm, { value:v, configurable:true, enumerable:false, writable:true, });
      }else{ obj[nm]=v
      }
    }
  }
  return v;
}
/** Proxy trap: write property and refresh dependent bindings. */
w$proxyHandler.prototype.set=function(obj, nm, v){ var e$;
//  if(nm=="nn")
//    LOG&&console.log("SET:"+nm+"=",obj[nm]);
  if(typeof(nm)==='symbol'){ obj[nm]=v; return true;
  }
  if(nm.startsWith('$w$direct$')){ nm=nm.substring(10);
  }else{ var w=obj[nm],len=w$isArray(obj)?obj.length:null;
    // Flush dependent bindings before mutating the value seen by future reads.
    if(v!==w && this.$w$ && !!(e$=this.$w$['~'+nm]) && e$.size){ LOG&&console.log("SET:"+nm+"=",v,w,e$);
      w$refresh(e$); e$.clear(); // delete this.$w$['~'+nm];
    }
  }
  var d; for(var p=obj; p; p=Object.getPrototypeOf(p)) if(!!(d=Object.getOwnPropertyDescriptor(p,nm))) break;
  // Delegate to setters when present; otherwise store the proxied value directly.
  if(d&&d.set){ v=d.set.call(this.$w$proxy,w$proxy(v))
  }else{ obj[nm]=w$proxy(v);
  }
  nm='length';
  if(len!=null && obj.length!=len && !!(e$=this.$w$['~'+nm]) && e$.size){ LOG&&console.log("SET:"+nm+"=",v,w,e$);
    delete this.$w$['~'+nm]; w$refresh(e$);
  }
  return true;
}
/** Proxy trap: delete property and refresh dependent list-length bindings. */
w$proxyHandler.prototype.deleteProperty=function(obj,nm){ var e$;
  if(nm in obj){ delete obj[nm]; nm='length';
    if(w$isArray(obj) && !!(e$=this.$w$['~'+nm]) && e$.size){ LOG&&console.log("SET:"+nm+"=",e$);
      delete this.$w$['~'+nm]; w$refresh(e$);
    }
    return true;
  }else{ return false;
  }
}

/** Wrap non-null objects in a proxy once; otherwise return value unchanged. */
function w$proxy(value){
  if(value===null || typeof(value)!=='object' || value.$w$proxy || typeof(Proxy)==='undefined') return value;
  let handler=new w$proxyHandler(value); let proxy=new Proxy(value,handler); handler.$w$proxy=proxy;
  return proxy;
}

//#endregion
//#region DEFINE_AND_INCLUDE

/** Define/retrieve WTypes (`string` get, `object` define, `string+object` define by name).
 * <li> Return existing types by name, or define one or many new type objects.
 * <li> Validate the requested name/base-type relationship before registration.
 * <li> Attach the chosen base prototype and store the final type in `W$TYPES`.
 * <li> Accept array batches, intrinsic `$name` declarations, and explicit `name+definition` forms.
 * <li> Derive the base prototype from `$type` when present, otherwise fall back to the root WType.
 */
function w$define(type,definition){ let name;
  function w$define$error(message){ let info=[], kind=type==null ? 'null' : typeof(type);
    if(typeof(name)!='undefined') info.push("name=`"+name+'`');
    if(type && typeof(type)=='object'){
      if(typeof(type.$name)=='string') info.push("$name=`"+type.$name+'`');
      if(typeof(type.$type)=='string') info.push("$type=`"+type.$type+'`');
    }else if(typeof(type)!='undefined'){ info.push("type="+kind); }
    throw new Error(info.length ? message+' ('+info.join(', ')+')' : message);
  }
  // Arrays define each entry in sequence; plain strings read back the named type.
  if(w$isArray(type)){
    for(let i=0; i<type.length; ++i) w$define(type[i])
  }else if(typeof(type)==='string' && typeof(definition)==='undefined'){
    return W$TYPES[type];
  }else{
    // Resolve the explicit or intrinsic type name, then validate the definition object.
    if(typeof(type)==='string'){ name=type; type=definition; }
    if(type==null || typeof(type)!=='object') w$define$error('Invalid w$define arguments.');
    if(typeof(name)==='undefined'){ name=type.$name;
      if(typeof(name)!=='string') w$define$error('Invalid w$define arguments: no name.');
    }
    let base=W$TYPES[name];
    // Inherit from the declared base `$type`, or fall back to the anonymous root type.
    if(typeof(type.$type)==='string' && type.$type){
      if(base) w$define$error('Invalid w$define redefinition: base $type already defined.');
      if(!(base=W$TYPES[type.$type])) w$define$error('w$define base $type was not found.');
    }else if(!base){
      base=W$TYPES[''];
    }
    if(base) Object.setPrototypeOf(type,base);
    W$TYPES[name]=type;
  }
}

/** Load HTML from `url`; merge comments/definitions and append or replace body content.
 * <li> Fetch an HTML document/fragment and normalize it into a temporary wrapper node.
 * <li> Extract definitions, inline script comments, and imported body content.
 * <li> Replace or append DOM content, weave it immediately, and resolve by callback or Promise.
 * <li> Preserve the current body data context while swapping the shell or appending imported nodes.
 * <li> Materialize extracted inline CSS/script blocks only after the new fragment has entered the DOM.
 */
function w$include(url,replace,fn){
  let done, promise=!fn && typeof(Promise)=='function' ? new Promise(function(resolve,reject){ done={resolve:resolve,reject:reject}; }) : null;
  function w$include$ok(result){ if(fn) fn(result); if(done) done.resolve(result); }
  function w$include$error(error){ if(done) done.reject(error); }
  let request=w$ajax({ method:'GET', url:url, success:function(data){
    try{
      var raw=''+(data||''), lower=raw.toLowerCase(), result, bodyData, appended=[];
      // Normalize a full HTML document or fragment into a temporary `<div>` wrapper.
      var b0=lower.indexOf('<body'), b1=(b0!=-1) ? raw.indexOf('>',b0) : -1, b2=lower.lastIndexOf('</body>');
      if(b0!=-1 && b1!=-1){
        var bodyAttrs=raw.substring(b0+5,b1);
        var bodyHtml=(b2!=-1 && b2>b1) ? raw.substring(b1+1,b2) : raw.substring(b1+1);
        data='<div'+bodyAttrs+'>'+bodyHtml+'</div>';
      }else{
        data='<div>'+raw+'</div>';
      }
      var div=w$element('div',{'w:html':data}).firstElementChild; if(!div){ w$include$ok(null); return; }

      // Parse definitions and `!w:script!` comments before moving nodes into the page.
      var wScript='', pattern=new WElement(div,W$DEFINITIONS,w$says,function(t){ var s;
        if(t.startsWith(s="!w:script!")) wScript+='\n'+t.substring(s.length);
      });
      bodyData=document.body.$w && '$' in document.body.$w ? document.body.$w.$ : W$DATA$;

      // Either replace the current body shell or append the imported body children.
      if(replace){
        while(document.body.attributes.length){ document.body.removeAttribute(document.body.attributes[0].name); }
        for(var i=0,a=Array.prototype.slice.call(div.attributes); i<a.length; ++i){
          document.body.setAttribute(a[i].name,a[i].value);
        }
        while(document.body.lastChild){ w$removeElement(document.body.lastChild) }
        while(div.firstChild){ document.body.appendChild(div.firstChild); }
        document.body.$w={w$:pattern}; if(typeof(bodyData)!='undefined') document.body.$w.$=bodyData;
      }else{
        while(div.firstChild){ appended.push(document.body.appendChild(div.firstChild)); }
      }

      // Materialize extracted script comments after the DOM fragment is in place.
      if(wScript){ document.head.appendChild(w$element("script",{name:'!w:script','w:text':wScript+'\n'})); }

      // Newly included content is woven immediately against the current body data.
      if(replace){
        result=w$apply(document.body,bodyData,null,true);
      }else{
        result=[];
        for(var i=0; i<appended.length; ++i){
          if(appended[i].nodeType==1 || appended[i].nodeType==3) result.push(w$apply(appended[i],bodyData,null,false,undefined,bodyData));
        }
      }
      w$include$ok(result);
    }catch(error){ w$include$error(error); }
  }, error:w$include$error });
  return promise || request;
}

//#endregion

//#region WFORM
/** Parse one inline `WF$TYPE` HTML template root, using tag-specific wrappers for table/select-only roots like `tr`. */
function wf$template$root(html){ let m=/^\s*<([a-z0-9:-]+)/i.exec(html), tag=m && m[1] && m[1].toLowerCase(), box=document.createElement('div'), parent=box, root=null;
  if(tag=='tr'){ box.innerHTML='<table><tbody>'+html+'</tbody></table>'; parent=box.firstElementChild && box.firstElementChild.tBodies[0];
  }else if(tag=='td' || tag=='th'){ box.innerHTML='<table><tbody><tr>'+html+'</tr></tbody></table>'; parent=box.querySelector('tr');
  }else if(tag=='thead' || tag=='tbody' || tag=='tfoot' || tag=='caption' || tag=='colgroup'){ box.innerHTML='<table>'+html+'</table>'; parent=box.firstElementChild;
  }else if(tag=='col'){ box.innerHTML='<table><colgroup>'+html+'</colgroup></table>'; parent=box.querySelector('colgroup');
  }else if(tag=='option' || tag=='optgroup'){ box.innerHTML='<select>'+html+'</select>'; parent=box.firstElementChild;
  }else box.innerHTML=html;
  for(let e=parent && parent.firstChild; e; e=e.nextSibling){
    if(e.nodeType==1){ if(root) throw new Error("WF$TYPE template must have one root element"); root=e;
    }else if((e.textContent||'').trim()) throw new Error("WF$TYPE template must have one root element");
  }
  return root;
}
/** Normalize a `WF$TYPE` definition and parse inline HTML templates into reusable `element` snapshots. */
function wf$template(type){ let html,root,defs=typeof(W$DEFINITIONS)!='undefined' ? W$DEFINITIONS : null;
  if(typeof(type)=='string'){ html=type; type={};
  }else if(!type || typeof(type)!='object'){ return type;
  }
  if(type.element instanceof WElement) return type;
  if(typeof(type.element)=='string'){ html=type.element;
  }else if(!html && type.element && type.element.nodeType){ root=type.element.cloneNode(true);
  }
  if(!html && !root) return type;
  if(!root) root=wf$template$root(html);
  if(!root) throw new Error("WF$TYPE template root element was not found");
  if(!type.$name){
    if(root.hasAttribute('wf:define')) type.$name=root.getAttribute('wf:define');
  }
  root.removeAttribute('wf:define');
  type.element=new WElement(root,defs,w$says);
  return type;
}
/** Register one `WF$TYPE` definition, with optional `$type` inheritance. */
function wf$define(type){ let name;
  type=wf$template(type);
  if(!type || typeof(type)!='object' || !type.$name) throw new Error("Invalid WF$TYPE definition.");
  if(!!(name=type.$type)){ let base=WF$TYPES[name]; if(!base) throw new Error("Type `"+name+"` does not exist");
    Object.setPrototypeOf(type,base);
  }
  WF$TYPES[type.$name]=type;
  return type;
}

/** Returns a `wf-...` unique id using the shared root id counter. */
function wf$id(){ return 'wf-'+ ++W$ID; }
/** Resolve a field value from `arg`; dotted names walk nested objects and preserve falsey values. */
function wf$field(arg,name){ let o=arg,a=name?name.split('.'):[];
  for(let i=0; i<a.length; ++i){ if(o==null || typeof(o)!='object' || !(a[i] in o)) return {ok:false}; o=o[a[i]]; }
  return {ok:true, value:o};
}
/** Expand `wf:*` template attributes from `arg` into real attrs before weaving the cloned DOM. */
function wf$attrs(el,arg){ function apply(e){ if(!e || e.nodeType!=1) return; let a=Array.from(e.attributes);
    for(let i=0; i<a.length; ++i){ let x=a[i], n=x.name, attr, field, v;
      if(!n.startsWith('wf:') || n=='wf:define' || n=='wf:children') continue;
      attr=n.substring(3); field=x.value||attr; e.removeAttribute(n);
      if(!(v=wf$field(arg,field)).ok || typeof(v=v.value)=='undefined' || v==null || v===false) continue;
      e.setAttribute(attr,v===true ? '' : ''+v);
    }
    for(let c=e.firstElementChild; c; c=c.nextElementSibling) apply(c);
  }
  apply(el); return el;
}
/** Resolve the optional empty `wf:children` placeholder inside a cloned element template. */
function wf$children(el){ if(el && el.nodeType==1){
  if(el.hasAttribute('wf:children') && !el.getAttribute('wf:children')) return el;
  return w$query(el,"*[wf\\:children='']");
} }

/** Render one schema node/list into `parent` by dispatching `WF$TYPE.append(...)` / `create(...)`.
 * <li> Accept either one schema node or an array of sibling nodes.
 * <li> Proxy-wrap schema objects before resolving the renderer type and definition.
 * <li> Call `append(...)` when the type manages parent insertion itself.
 * <li> Otherwise call `create(...)`, append its returned element to `parent`, and use it as the child host.
 * <li> If the type only provides `element`, clone that template snapshot, expand `wf:*` attrs from `arg`, weave it, and use empty `wf:children` as an optional nested-list host.
 * <li> Rebuild child nodes recursively from `list` when the current schema node provides one.
 */
function WF$append(wf,parent,arg, $this){ let el=parent; if(!$this) $this=this;
  // Arrays are rendered as sibling nodes under the same parent host.
  if(Array.isArray(arg)){
    for(let i=0; i<arg.length; ++i){ let a=arg[i];
      WF$append(wf,el,a,$this);
    }
    return el;
  }
  // Normalize object nodes through the shared proxy layer before renderer lookup.
  arg=w$proxy(arg);
  // Resolve the renderer type and its parsed `definition` map/object for this node.
  if(arg && arg.type){ let type=WF$TYPES[arg.type], append, create, childrenEl, rootEl, pattern,defs=typeof(W$DEFINITIONS)!='undefined' ? W$DEFINITIONS : null;
    if(!type) throw new Error("Type `"+arg.type+"` does not exist");
    if(typeof(append=type.append)=='function'){
      let def=arg.definition && w$definition(arg.definition);
      el=append.call(type,wf,parent,arg,$this,def);
      childrenEl=el;
    }else if(typeof(create=type.create)=='function'){
      let def=arg.definition && w$definition(arg.definition);
      el=create.call(type,wf,parent,arg,$this,def);
      if(el && el.parentElement!==parent) parent.appendChild(el);
      childrenEl=el;
    }else if(type.element){
      el=rootEl=type.element.cloneNode(true);
      if(el) wf$attrs(el,arg);
      if(el && el.parentElement!==parent) parent.appendChild(el);
      if(el) pattern=new WElement(el,defs,w$says), el=rootEl=w$apply(el,arg,pattern,false,undefined,arg);
      // Route nested `list` rendering into the first empty `wf:children` placeholder when present.
      if(rootEl && (childrenEl=wf$children(rootEl))) childrenEl.removeAttribute('wf:children');
    }else throw new Error("Type `"+arg.type+"` has no append(...), create(...), or element template");
    if(el){ el.$wf=arg;
      // Rebuild nested schema children only into the designated child host for this renderer.
      if(childrenEl && arg && arg.list){
        while(childrenEl.childNodes.length>0){ w$removeElement(childrenEl.firstChild); }
        for(let i=0; i<arg.list.length; ++i){ let a=arg.list[i];
          WF$append(wf,childrenEl,a,$this);
        }
      }
    }
    return el;
  }
  // Rebuild child nodes under the returned host element when the schema node has a `list`.
  if(el){ el.$wf=arg;
    if(arg && arg.list){
      while(el.childNodes.length>0){ w$removeElement(el.firstChild); }
      for(let i=0; i<arg.list.length; ++i){ let a=arg.list[i];
        WF$append(wf,el,a,$this);
      }
    }
  }
  return el;
}
/** Entry point: resolve root schema/by-name reference and render it into `el`. */
function W$Form(v,arg,el){ let wf={}; if(!v) v=this; arg=w$proxy(arg?window[arg]:v);
  return WF$append(wf,el,arg,v);
}
/** Legacy aliases kept so older WF examples still work. */
var W$Form$append=WF$append, WF$create=WF$append, WF$=W$Form;

/** Registered `WF$TYPE` renderers by `$name`. */
var WF$TYPES={};

/** `WF$TYPE`: getter for renderer registry, setter to register one renderer. */
Object.defineProperty(window,'WF$TYPE',{ configurable:true,
  get:function(){ return WF$TYPES; },
  set:function(type){ wf$define(type); },
});
//#endregion

//#region INITIALIZATION

/** Last generated unique id. */
var W$ID=0;
/** An incremented unique id. */
function w$id(){ return ++W$ID; }

/** Main assigned/root data object (also exposed as `W$DATA`). */
var W$DATA$=typeof(window.W$DATA)!='undefined' ? window.W$DATA : undefined;
/** Startup action/source (function, URL string, or undefined). */
var W$START=typeof(window.W$START)!='undefined' ? window.W$START : undefined;

/** Optional synchronizer callback executed after initial load. */
var W$SYNC=typeof(window.W$SYNC)!='undefined' ? window.W$SYNC : undefined;

/** Initializers executed before first `w$apply`. */
var W$ONSTART=w$isArray(window.W$ONSTART) ? window.W$ONSTART : [];

/** Initializers executed after first `w$apply`. */
var W$ONLOAD=w$isArray(window.W$ONLOAD) ? window.W$ONLOAD : [];

/** Prevent duplicate startup when loaded after DOM ready or re-entered indirectly. */
var W$INITIALIZED=false;

/** Bootstraps events, data, definitions, CSS/script comments and first weave pass.
 * <li> Guard against duplicate startup, bind framework events, and seed the body data slot.
 * <li> Build the initial body snapshot, run startup hooks, and apply the root weave.
 * <li> Choose startup data from remote call, preloaded globals, parameter factory, or static body markup.
 * <li> Preserve predeclared startup globals and support immediate boot when the script loads after DOM ready.
 * <li> Extract inline `!w:script!` comments before running `W$ONSTART`, `W$ONLOAD`, and `W$SYNC`.
 */
function w$startup(){ if(W$INITIALIZED) return; W$INITIALIZED=true; W$DEFINITIONS={};
  // event handlers
  if(w$isArray(W$EVENTS)){
    for(var i=0; i<W$EVENTS.length; ++i){ document.addEventListener(W$EVENTS[i], w$on, false); }
  }

  document.body.$w ||= {}; document.body.$w.$=W$DATA$;

  // Build the initial body snapshot, extract inline scripts, then weave the root data.
  function load($){ W$DATA=w$proxy($); var wScript='';
    document.body.$w.w$=new WElement(document.body,W$DEFINITIONS,w$says,function(t){ var s;
      if(t.startsWith(s="!w:script!")) wScript+='\n'+t.substring(s.length);
    });
    if(wScript){ document.head.appendChild(w$element("script",{name:'!w:script','w:text':wScript+'\n'})); }

    // Run pre-load hooks, apply the root weave, then run post-load hooks and sync.
    if(w$isArray(W$ONSTART)){
      for(var i=0; i<W$ONSTART.length; ++i){
        if(typeof(W$ONSTART[i])=='function') W$ONSTART[i].call(W$DATA,W$DATA);
      }
    }
    w$apply(document.body,W$DATA,null,true);
    if(w$isArray(W$ONLOAD)){
      for(var i=0; i<W$ONLOAD.length; ++i){
        if(typeof(W$ONLOAD[i])=='function') W$ONLOAD[i].call(W$DATA,W$DATA);
      }
    }
    if(typeof(W$SYNC)=='function') W$SYNC();
  }

  // Choose the startup source from remote call, preloaded data, parameter factory, or static body.
  if(typeof(W$START)=='string'){
    W$CALL(W$START,W$DATA,function($){
      if(Array.isArray($)){ if(Array.isArray($[0])){ $=$[0]; }
        var length; if($ && (length=$.length)){ var index=typeof($[0])=='object' ? 0 : 1;
          if(index<length) $=$[index]; /// time = ~~$[index+1];
        }
      }
      load($);
    });
  }else if(typeof(W$DATA)!='undefined'){
    if(typeof(W$START)=='function'){ W$DATA=W$START(W$DATA); }
    load(W$DATA);
  }else if(typeof(W$START)=='function'){ load(W$START(w$getParameters()));
  }else{
    document.body.classList.remove('w');
  }
}

/** `W$TYPE`: getter for type registry, setter to define a type. */
Object.defineProperty(window,'W$TYPE',{ configurable:true,
  get:function(){ return W$TYPES; },
  set:function(type){ w$define(type); },
});

/** `W$DATA`: getter/setter for root data with immediate body apply when initialized. */
Object.defineProperty(window,'W$DATA',{ configurable:true,
  get:function(){ //var b=window.document.body; return b && b.$w ? b.$w.$ :
    return W$DATA$;
  },
  set:function(data){ let body=window.document.body; W$DATA$=w$proxy(data);
    // Keep `body.$w.$` in sync immediately, and re-apply only after the body has been woven once.
    if(body){
      body.$w ||= {};
      if(body.$w.w$){
        body.$w.$=W$DATA$;
        w$apply(body,body.$w.$,null,true);
      }else{
        body.$w.$=W$DATA$;
      }
    }
  },
});

if(document.readyState=='loading'){ document.addEventListener("DOMContentLoaded", w$startup);
}else{ w$startup();
}

//#endregion
