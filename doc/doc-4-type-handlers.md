# WeaveworldUI - Type-handlers, type binding #

Weaveworld supports two complementary type-binding styles:

* **Context (class-based) binding**: uses element `class` names
* **Prototype binding**: uses `w:type` to set data prototype

## Class-based binding (`class`) ##

Context binding is based on CSS classes on DOM elements.

It is used for:
* [event handling](doc-2-event.md)
* [conversions/transformations](doc-1-template.md#conversions)
* type-level action/context hooks tied to element classes

Example:
```js
W$TYPE={ $name:'Product',
  toDate: function(el,v,p){ ... },
  doSomething: function(el,ev,arg){ ... },
};
```
```html
<div class="Product OtherTypeClass otherCSSClass">
  <span w:text="[toDate]date">12/11/2018</span>
  <button type=button w:on:click=doSomething>Do</button>
</div>
```

## Prototype binding (`w:type`) ##

`w:type` sets the prototype of the current bound data object/list to the declared type-handler.
In practice, `class` and `w:type` are often used together: `class` drives DOM-side lookup, while `w:type` enriches the data object with metadata, getters, and helper methods.

Typical usage:
```html
<div class="Product" w:item w:type=Product>...</div>
```

Notes:
* `w:type` works on current bound data (`w:item` context).
* `w:type` **does not automatically add** the type name to element classes in current runtime.
  * If you need class-based event/conversion lookup, keep the matching class in `class=""`.
* If the type defines `$use` or `$action`, those hooks can run during binding/application.

Prototype binding is commonly used for:
* computed properties (`get ...`)
* field-template metadata used by `w:name` / `w:named`

Example:
```js
W$TYPE={ $name:'Product',
  quantity$type: 'integer',
  quantity$required: true,
  quantity$min: 1,
  get price(){ return this.unit_price*this.quantity; },
  get vat(){ return this.price*0.15; },
  toDate: function(el,v,p){ ... },
  doSomething: function(el,ev,arg){ ... },
};
```
```html
<div class="Product OtherTypeClass otherCSSClass" w:item w:type=Product>
  ...<span w:text="[toDate]date">12/11/2018</span>
  ...<input w:name=quantity value=1>
  ...<span w:text="€{{vat}}">€12</span>
  ...<button type=button w:on:click=doSomething>Do</button>
</div>
```

## Type-handler registration (`W$TYPE`) ##

Suggested registration style:

```js
W$TYPE={ $name:'Product', ... };
```

When a type with the same name already exists, the previous type becomes the prototype of the new definition (incremental extension).

Example:
```js
// generated/base definition
W$TYPE={ $name:'Product',
    quantity$type:'integer',
    quantity$required:true,
    quantity$min:1,
    get price(){ return this.unit_price*this.quantity; },
    get vat(){ return this.price*0.15; },
};
```

Access registered types through `W$TYPE`:
```js
console.log(W$TYPE.Product);
```

## Supertypes (`$type`) ##

You can declare inheritance explicitly with `$type`:

```js
W$TYPE={ $name:'Deliverable', ... };
W$TYPE={ $name:'Product', $type:'Deliverable', ... };
```

Behavior notes:
* `$type` must refer to an already registered type.
* If neither existing same-name type nor `$type` exists, Weaveworld tries `W$TYPE['']` as fallback base (if defined).

You can extend fallback root rules when present:
```js
W$TYPE[''].toCodeFormat=function(el,v,p){ ... };
```

## Type-handler rules ##

Type-handlers are plain JavaScript objects. Common rule kinds:

* `$name` (string): type name
* `$type` (string): supertype name
* [event handlers](doc-2-event.md): `function(el,ev,arg)`
* [conversions](doc-1-template.md#conversions): `function(el,value,arg)`
  * by convention conversion names start with `to...`
* derived/computed properties (`get`)
* field metadata (for field-template binding), for example:
  * `field$type`, `field$required`, `field$length`, `field$min`, `field$max`, `field$pattern`, ...
* validators:
  * `field$check`, `field$valid`
* argument declarations:
  * `fn$arg`
* action-related hooks:
  * `$action`
  * project-level conventions may also use names like `$at$...`
* optional lifecycle/helpers:
  * `$use`
  * custom helper methods using `this`

By convention:
* enablement declarations can use `fn$apt`
* permission/access declarations are often represented by `$for`-style rules in app conventions
* field metadata is especially useful together with `w:name` / `w:named`, which is the higher-level authoring style for many business forms
