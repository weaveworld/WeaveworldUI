# WeaveworldUI - Action Contexts #

Action contexts provide a structured way to react to events beyond simple direct handlers.

## Event-side action trigger ##

You can trigger actions declaratively:

* `w:on:X:action="[(target)][(arg_spec)]"`

During event handling, Weaveworld builds an argument object and calls `w$action(...)` on the resolved bound context.

Example:

```html
<button w:on:click:action="(open:1)">Open</button>
```

## `w$action` flow ##

`w$action(el, ev, arg, sourceElement)`:

1. Merges action args into current bound data.
2. Calls type-level `$action` rule for matching classes (if any).
3. Calls data methods whose names end with `$action`.
4. If an action rule returns an object, it is merged back into data.

Notes:

* A type-level `$action` that returns `true` stops the rest of the action chain.
* Field-oriented hooks such as `opened$action` are simply methods on the current bound data object.

This enables central reactive logic for many event sources.

## Example ##

```js
W$TYPE={ $name:'Pane',
  $action: function(el,ev,arg){
    if(arg.open===1) return { opened:true };
  },
  opened$action: function(el,ev,arg){
    // optional field-oriented reaction hook
  },
};
```

```html
<div class=Pane w:item>
  <button w:on:click:action="(open:1)">Open</button>
</div>
```

## Related declarations ##

These declarations are often used with action contexts:

* `w:on:X:set` (direct data set)
* `w:on:X:data` (DOM `data-*` updates)
* `w:on:X` (standard handler dispatch)

Use action contexts when you want one centralized reaction pipeline instead of many scattered direct updates.
