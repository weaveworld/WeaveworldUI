# WeaveworldUI - Customization #

Weaveworld is intentionally customizable. Most behavior can be redefined by replacing globals or extending type rules.

## Common extension points ##

### Type system

* `W$TYPE = { ... }` - register new types or extend an existing type by re-registering the same `$name`.
  * e.g., `W$TYPE={ $name:'Task', taskDone:function(el){ this.state=3; } };`
  * e.g., `W$TYPE={ $name:'Task', toLabel:function(el,v){ return '['+v+']'; } };`
* `$type` - define explicit inheritance from an already registered base type.
  * e.g., `W$TYPE={ $name:'OrderItem', $type:'ItemBase', itemSave:function(el){ ... } };`
* `W$TYPE['']` - extend fallback root behavior used when no specific type override exists.
  * e.g., `W$TYPE[''].toCodeFormat=function(el,v){ return String(v||'').trim().toUpperCase(); };`

### Conversions

* `W$CONVERSIONS` - add or override global conversion operators used in template expressions.
  * e.g., `W$CONVERSIONS.toMoney=function(el,v){ return '$'+Number(v||0).toFixed(2); };`
* Type-level conversion methods (`to...`) - attach conversion logic directly to a type-handler.
  * e.g., `W$TYPE={ $name:'Price', toGross:function(el,v,arg){ return v*(1+(Number(arg)||0)); } };`
* Global function fallback - use plain global JS functions when no type/global conversion rule matches.
  * e.g., `function toSlug(v){ return String(v||'').toLowerCase().replace(/\s+/g,'-'); }`
  * e.g., `<span w:text="[toSlug]title"></span>`

### Event behavior

* `W$EVENTS` - extend the list of DOM events that Weaveworld listens to globally.
  * e.g., `W$EVENTS.push('scroll');`
* `w$on`, `w$action`, and handler rules - customize event dispatch pipeline or keep custom logic in type handlers.
  * e.g., `W$TYPE={ $name:'Task', onclick:function(el,ev){ if(ev.target.matches('.x')) return; return null; } };`
  * e.g., `const _w$action=w$action; w$action=function(el,ev,arg,src){ console.log(arg); return _w$action(el,ev,arg,src); };`

### Server calls

* `W$CALL` - redefine high-level command mapping, protocol conventions, and post-response weaving behavior.
  * e.g., `const _W$CALL=W$CALL; W$CALL=function(cmd,arg,el,mode){ return _W$CALL('POST.json:/api/'+cmd,arg,el,mode); };`
* `w$call` / `w$ajax` - replace or wrap low-level transport implementation.
  * e.g., `w$call=function(conf){ conf.pragma='W$CALL'; return w$ajax(conf); };`
  * e.g., `w$ajax({ method:'GET', url:'task.json', success:console.log });`

### Lifecycle/startup

* `W$ONSTART[]`, `W$ONLOAD[]` - register before/after initial apply hooks.
  * e.g., `W$ONSTART.push(function($){ $.sessionLoadedAt=Date.now(); });`
  * e.g., `W$ONLOAD.push(function(){ console.log('UI ready'); });`
* `W$START` - choose startup mode using a command string or a function.
  * e.g., `W$START='taskList';`
  * e.g., `W$START=function(params){ return { filter:params.filter||'all', list:[] }; };`
* `W$SYNC` - plug background synchronization after initial load.
  * e.g., `W$SYNC=w$sync;`

### Localization

* `W$DICTIONARY` - provide translation dictionary entries by key.
  * e.g., `W$DICTIONARY={ SAVE:'Save', CANCEL:'Cancel', HELLO:'Hello' };`
* `W$SAY_BEGIN`, `W$SAY_END`, `W$SAY_CODE` - customize localization marker syntax.
  * e.g., `W$SAY_BEGIN='{{'; W$SAY_END='}}'; W$SAY_CODE='|';`
  * e.g., `w$says('{{SAVE|Save}}');`

### Access and policy

* `W$ALLOW(...)` - override level normalization and permission mapping policy.
  * e.g., `W$ALLOW=function(v){ if(v==='owner') return 7; return 0; };`
* `$apt` / `$allowed` conventions - extend project metadata rules used by `w:name`/`w:named` generated controls.
  * e.g., `W$TYPE={ $name:'Task', name$allowed:'w', remove$apt:'a' };`
  * e.g., `<button w:name=remove>Delete</button>`

### UI helpers

* Menu/HTML/normalization helpers - wrap or replace helper behavior (`w$menu`, `w$element`, `w$normalizeHTML`, etc.) for project-specific UI behavior.
  * e.g., `const _w$menu=w$menu; w$menu=function(el,m,init,fn){ console.log('menu open'); return _w$menu(el,m,init,fn); };`
* Warning and validation presentation - customize warning lifecycle using `w$warning` plus `$check`/`$valid` rules.
  * e.g., `W$TYPE={ $name:'User', email$valid:function(v){ return /.+@.+/.test(v)?null:'Invalid email'; } };`
  * e.g., `w$warning(formEl,{ _w_email:'Invalid email', _m_email:'Use business address' });`

## Practical pattern ##

Use incremental layering:

1. Server/generated base type metadata
  * e.g., `W$TYPE={ $name:'Task', name$type:'string', name$required:true };`
2. Page-level type extensions (`W$TYPE = {...}`)
  * e.g., `W$TYPE={ $name:'Task', taskAdd:function(el,ev,arg){ this.list.push(arg); } };`
3. App-level utility overrides (`W$CALL`, conversions, events)
  * e.g., `W$CONVERSIONS.toMoney=...;`
  * e.g., `W$CALL=function(cmd,arg,el,mode){ ... };`

This keeps framework upgrades manageable while preserving project-specific behavior.
