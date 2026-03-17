# WeaveworldUI - Data binding #

In modern JavaScript environments, Weaveworld uses proxy-based two-way data binding: when bound data changes, related DOM parts are refreshed automatically.

## Refresh (`w$refresh`) ##

You can trigger refresh manually:

* `w$refresh('now', el)` updates immediately.
* `w$refresh(el)` schedules refresh shortly after (animation-frame based).

`w$refresh` can refresh whole elements or specific attributes, and can also merge quick field updates into bound data.

## Weaving (`w$weave`) ##

`w$weave` is a helper for common data/list mutations around a base element.

```js
W$TYPE={ $name:'Item',
  addItem: function(el,ev,arg){
    w$weave(el,']',arg); // append to outer list
  },
  removeItem: function(el,ev,arg){
    w$weave(el,'-'); // remove current item from outer list
  },
};
```

Signature:

`w$weave(el [,mode [,value]])`

* `el`: base element (typically the first handler argument)
* `mode`: optional prefix + operation code
* `value`: payload for operation

Mode prefixes:

* `~`: do not clear warnings and do not refresh
* `!`: force warning clear + refresh
* no prefix: behavior follows `W$REFRESH` (default `true`)

Mode codes:

* `''` (empty): merge object fields into current data
* `'['`: insert at start of outer list
* `']'`: insert at end of outer list
* `'<'`: insert before current item
* `'>'`: insert after current item
* `'-'`: remove current item
* `'.'`: replace current item in outer list
* `'#'`: replace outer list (non-array input becomes empty list)
* `'='`: replace current data object and refresh now
* `'?'`: update warnings only (no refresh)

Notes:

* Warnings are managed through `w$warning` (including `_w*` / `_m*` style fields).
* For merge mode (`''`), only object-like payloads are merged.

## Server call (`W$CALL`) ##

You can redefine `W$CALL`, but built-in behavior already supports both REST-style and ONCE-style calls.

By default:

* `Pragma: W$CALL` header is set.
* Default method is `POST.json`.
* Default URL is the current page directory.
* If a weave element is provided, warnings are cleared first (unless weave mode starts with `~`).

Common forms:

`W$CALL(cmd [,arg] [,element [,weaveMode [,weaveData]]])`

`W$CALL(cmd [,arg], callbackFn)`

`cmd` formats:

1. `METHOD[:URL]` or `METHOD.json[:URL]`
   * examples: `GET:task`, `DELETE:task/1`, `POST.json:task`
2. operation name (no colon), e.g. `addItem`
   * sent as POST-style payload key by default

Examples:
```js
W$CALL('addItem', arg, el, '.');    // replace current list item with response
W$CALL('setItem', arg, el);         // default weave mode: merge
W$CALL('removeItem', arg, el, '-'); // remove current item
```

Detailed example:

```js
W$TYPE={ $name:'Order',
};
W$TYPE={ $name:'Item',
  addItem$arg:"order:Order\\order_id",
  addItem: function(el,ev,arg){
    W$CALL('addItem',arg,el,'.');
    // the newly created item in the response replaces the current one
  },
  setItem$arg:"id",
  setItem: function(el,ev,arg){
    W$CALL('setItem',arg,el); // (default weaving) merge and warnings
  },
  removeItem$arg:"id",
  removeItem: function(el,ev,arg){
    if(arg.id) W$CALL('removeItem',arg, el,'-'); // remove
  },
};
```

## ONCE-style operation names ##

ONCE-style payloads often encode the operation in a key starting with `!`:

```js
W$CALL({'!taskAdd':'', name:arg.name, state:1}, el, ']');
```

Extended ONCE-style example:

```js
W$TYPE={ $name:"Task",
  DELETED: 0,
  ACTIVE: 1,
  STARTED: 2,
  COMPLETED:3,
  taskAdd: function(el,ev,arg){
    W$CALL({'!taskAdd':'', name:arg.name, state:this.ACTIVE }, el, ']');
  },
  taskStarted: function(el,ev,arg){
    W$CALL({'!taskSet':'', id:this.id, state:this.STARTED }, el);
  },
  taskCompleted: function(el,ev,arg){
    W$CALL({'!taskSet':'', id:this.id, state:this.COMPLETED }, el);
  },
  // ...
};
```

Buttons can also use operation-like names:

```html
<form>
  <button type=submit name="!taskSet">Save</button>
  <button type=button name="!taskUnset">Delete</button>
  <button type=reset>Reset</button>
</form>
```

## Initial data (`W$DATA`, `W$START`) ##

Startup mode is determined by `W$DATA` and `W$START`:

* Both undefined:
  * no template actualization; raw example HTML remains visible
* `W$START` is string:
  * `W$CALL(W$START, W$DATA, ...)` is executed and response becomes initial data
* `W$DATA` defined:
  * if `W$START` is function, it is called with `W$DATA`
  * otherwise `W$DATA` is used directly
* `W$DATA` undefined and `W$START` is function:
  * function receives GET parameters (`w$getParameters()`)

## Initialization ##

On `DOMContentLoaded`, Weaveworld:

1. Registers global event listeners (`W$EVENTS`).
2. Builds internal template representation from DOM.
3. Extracts inline template resources from comments:
   * `<!--!w:css!...-->`
   * `<!--!w:script!...-->`
4. Resolves initial data (`W$DATA` / `W$START`).
5. If data is available:
   * runs `W$ONSTART[]`
   * applies template (`w$apply`)
   * runs `W$ONLOAD[]`
   * calls `W$SYNC()` if defined

Example:
```js
W$ONLOAD.push(function(){
  console.log('Page updated');
});
W$ONLOAD.unshift(function(){
  console.log('Runs first');
});
```
