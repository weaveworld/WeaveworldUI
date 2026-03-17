# WeaveworldUI - Utilities #

Weaveworld exposes many utility functions used internally and available for app code.

## Data/object helpers ##

* `w$assign(target, source [,fields])` - copies fields from `source` into `target` (supports field filtering and nested object merge).
  * e.g., `w$assign(todo,{ name:'Buy milk', state:1 });`
* `w$setField(obj, "a.b.c", value)` - sets a nested field path, creating intermediate objects when needed.
  * e.g., `w$setField(order,'shipping.address.city','Budapest');`
* `w$is(value [,trueish])` - normalizes condition-like values to boolean, `1/0`, or a truthy text marker.
  * e.g., `const enabled=w$is(list.length,1);`
* `w$toggle(value [,trueish])` - toggles a value and returns it in normalized form.
  * e.g., `item.done=w$toggle(item.done,1);`
* `w$proxy(value)` - wraps objects/lists with the reactive proxy used by auto-refresh binding.
  * e.g., `W$DATA=w$proxy({ list:[] });`

## DOM/query helpers ##

* `w$query(selector [,root] [,fn])` - finds the first matching element (supports Weaveworld selector shortcuts).
  * e.g., `const form=w$query('#todoForm');`
* `w$queryAll(selector [,root] [,fn])` - returns all matches (or iterates them through `fn`).
  * e.g., `w$queryAll('.Todo',document.body,el=>el.classList.add('ready'));`
* `w$show(el [,state])` - reads visibility or shows/hides an element (`W$TOGGLE` supported).
  * e.g., `w$show(panel,false);`
* `w$element(elOrTag [,arg [,value]])` - creates/updates elements quickly (`w:text`, attrs, style, children).
  * e.g., `const b=w$element('button',{ 'w:text':'Save', class:'wbutton' });`
* `w$removeElement(el)` - removes an element from the DOM.
  * e.g., `w$removeElement(w$query('#tmpWarning'));`
* `w$parent(el, matcher [,up])` - finds nearest matching ancestor/self by tag/class rule.
  * e.g., `const row=w$parent(ev.target,'.Todo');`
* `w$child(el, matcher [,mode [,level]])` - finds matching descendants from a root element.
  * e.g., `const email=w$child(form,'INPUT.email');`

## Data-binding helpers ##

* `w$data(el [,selector [,skip]])` - returns the mapped data object for an element context.
  * e.g., `const todo=w$data(ev.target);`
* `w$list(el [,selector [,skip]])` - returns the nearest mapped outer list (`w:each` context).
  * e.g., `const list=w$list(ev.target);`
* `w$refresh('now',el)` / `w$refresh(el)` - forces immediate refresh or schedules one shortly.
  * e.g., `w$refresh('now',document.body);`
* `w$weave(el [,mode [,value]])` - updates mapped data/list with weave modes (`]`, `-`, `.`, `#`, `=`, ...).
  * e.g., `w$weave(el,']',{ name:'New task' });`
* `w$apply(el,data [,pattern [,check]])` - applies template mapping for an element manually.
  * e.g., `w$apply(document.body,W$DATA);`

## Validation helpers ##

* `w$check(el [,value])` - validates one control and writes `<field>$warning` on bound data.
  * e.g., `w$check(w$query('input[name=email]'));`
* `w$checkArg(el,name,arg [,fieldsOnly])` - validates argument objects against type rules and returns warning object.
  * e.g., `const warn=w$checkArg(btn,'todoAdd',{ name:'' });`
* `w$warning(dataOrElement [,warnObj])` - clears warnings or writes warning/message fields (`_w*`, `_m*`).
  * e.g., `w$warning(formEl,{ _w_name:'Required' });`
* `w$hasWarning(data)` - checks whether data currently contains active warning fields.
  * e.g., `if(w$hasWarning(todo)){ return; }`

## Event/action helpers ##

* `w$on(ev [,eventName [,elem [,arg [,indirect]]]])` - central dispatcher for `w:on:*` and type handlers.
  * e.g., `w$on(event,'click',event.target,{ id:this.id });`
* `w$arg(..., el, "argSpec" [,extraObj...])` - builds event/call argument object from data, toggles, and explicit values.
  * e.g., `const arg=w$arg(btn,'id,name', { mode:'edit' });`
* `w$action(el,ev,arg [,sourceElement])` - runs action pipeline (`$action`, `*action` hooks) and merges results.
  * e.g., `w$action(panel,event,{ open:1 });`
* `w$submit(ev)` - helper for form submit flow (`w:on:submit`) with argument collection.
  * e.g., `<form onsubmit="return w$submit(event)">...</form>`
* `w$no(ev)` - prevents default browser behavior and stops propagation.
  * e.g., `return w$no(event);`
* `w$default(ev)` - stops propagation but keeps browser default action.
  * e.g., `return w$default(event);`

## Networking and sync ##

* `w$ajax(conf)` - low-level transport helper (`GET`, `POST`, JSON, callbacks, async/sync).
  * e.g., `w$ajax({ method:'GET', url:'task.json', success:console.log });`
* `W$CALL(cmd [,arg] [,element [,weaveMode [,weaveData]]])` - high-level call helper with default transport + weave integration.
  * e.g., `W$CALL('setTask',{ id:this.id, name:this.name },el);`
* `w$sync()` - starts sync polling loop against `location.pathname+'.json'`.
  * e.g., `W$SYNC=w$sync;`
* `w$resync(data)` - queues async sync messages for frame-based processing.
  * e.g., `w$resync([[{ name:'server update' },'2026-02-17T10:00:00Z']]);`
* `w$resyncer(time)` - internal queue processor called by `requestAnimationFrame`.
  * e.g., `requestAnimationFrame(w$resyncer);`
* `w$resync$done()` - unlock callback for async resync preconditions.
  * e.g., `someAsyncStep(w$resync$done);`

## URL, cookie, and form helpers ##

* `w$getParameters([targetObj [,query]])` - parses query string into an object.
  * e.g., `const p=w$getParameters();`
* `w$setParameters(arg [,urlOrQuery])` - writes/merges query parameters into a URL/query.
  * e.g., `const href=w$setParameters({ page:2 },location.href);`
* `w$setCookie(name,value [,days])` - stores a cookie value with optional expiry days.
  * e.g., `w$setCookie('lang','en',30);`
* `w$getCookie(name [,defaultValue])` - reads a cookie, with optional fallback default.
  * e.g., `const lang=w$getCookie('lang','en');`
* `w$get(formOrControl)` - collects values from a form/control into object/value form.
  * e.g., `const arg=w$get(w$query('#todoForm'));`

## Menu helpers ##

* `w$menu(elOrEvent [,menuDefOrId [,init [,onClick]]])` - opens a menu from element/event context.
  * e.g., `w$menu(event,'#taskMenu');`
* `w$menuShow(el,menu,left,right,top,bottom [,init [,onClick]])` - low-level menu renderer/positioner.
  * e.g., `w$menuShow(btn,menuNode,rect.left,rect.right,rect.top,rect.bottom);`
* `w$menuOff([menuNode [,inclusive]])` - closes current menu stack or closes up to a node.
  * e.g., `w$menuOff();`

## Localization helpers ##

* `w$say(key [,defaultText])` - translates one dictionary key/token.
  * e.g., `titleEl.textContent=w$say('SAVE','Save');`
* `w$says(text)` - translates all embedded localized markers in a text.
  * e.g., `msgEl.textContent=w$says('\\u00A7HELLO|Hello\\u00A7');`

## Include/definition helpers ##

* `w$define(type [,definition])` - registers, extends, or returns a `W$TYPE`.
  * e.g., `w$define({ $name:'Task', taskDone:function(el){ this.state=3; } });`
* `w$use(name,data,parentEl [,beforeNode])` - instantiates a `w:define` template node and applies data on it.
  * e.g., `w$use('TaskRow',task,listEl,null);`
* `w$include(url [,replace [,fn]])` - loads HTML fragment, imports definitions/resources, and appends/replaces body content.
  * e.g., `w$include('part/todo.html',false,()=>console.log('included'));`

For practical use patterns, see docs 1-9 and the demo pages in `_ui/demo`.

