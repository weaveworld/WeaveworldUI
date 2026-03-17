# WeaveworldUI - Events #

Standard DOM event handlers can still be used, and they can override Weaveworld behavior when they stop propagation/default handling.

Example:
```html
<button onclick="return handleClick(event)">OK</button>
```

After page load, Weaveworld initializes global event listeners.

## High-level event handling ##

When an event occurs, Weaveworld walks up from the event target through parent elements.

If it finds a matching event declaration (attribute `w:on:<event>`), it resolves the handler name and searches matching type-handler rules (`W$TYPE`).

Example (See on [jsFiddle](https://jsfiddle.net/weaveworld/bag0kL8p/)):
```js
W$TYPE={ $name:'Amount',
  increaseAmount: function(el,ev){
    ++this.amount;
  },
  decreaseAmount: function(el,ev){
    --this.amount;
  },
};
W$DATA={
  product:{ id:123456, name:'Bulb', amount:1, }
};
```

```html
<div class="Amount" w:item=product>
  <span w:text=name>Product name</span>
  <!--!w:css! div.Amount>input[name="amount"]{ max-width:4em; }-->
  <input type="number" name="amount" w:set:value="amount">
  <input type="button" class=wbutton value="+"
           w:on:click=increaseAmount>
  <input type="button" class=wbutton value="-"
           w:on:click=decreaseAmount>
</div>
```
When one of the buttons is clicked and Weaveworld finds a `w:on:click` attribute, the event name is converted using the attribute value.

Events may have **arguments**, given in the `$arg` format (see below) between parentheses.

(See on [jsFiddle](https://jsfiddle.net/weaveworld/q90vrdjh/))
```js
W$TYPE={ $name:'Amount',
  changeAmount: function(el,ev,arg){
    this.amount+=arg.n;
  },
};
W$DATA={
  product:{ id:123456, name:'Bulb', amount:1 }
};
```
```html
<div class="Amount" w:item=product>
  <span w:text=name>Product name</span>
  <input type="number" name="amount" w:set:value="amount">
  <input type="button" class=wbutton value="+" w:on:click="changeAmount(n:1)">
  <input type="button" class=wbutton value="-" w:on:click="changeAmount(n:-1)">
</div>
```

## Arguments (`$arg` and declaration args) ##

Event handlers can receive arguments in two ways:

1. Type-handler declaration: `<handlerName>$arg`
2. Event declaration arguments: `w:on:click="handlerName(...)"` (parenthesized arg-spec format)

Example:
```js
W$TYPE={ $name:'Amount',
  changeAmount$arg: "id",
  changeAmount: function(el,ev,arg){
    this.amount += arg.n;
    console.log(arg);
    // W$CALL('changeAmount',arg,el)
  },
};
W$DATA={
  product:{ id: 123456, name: 'Bulb', amount:1 }
};
```
```html
<div class="Amount" w:item=product>
  <span w:text=name>Product name</span>
  <input type="button" class=wbutton value="+" w:on:click="changeAmount(n:1)">
  <input type="button" class=wbutton value="-" w:on:click="changeAmount(n:-1)">
</div>
```

Argument merge order:

1. Build arguments from `<handlerName>$arg` against current data.
2. Add declaration arguments from parentheses.
3. If element has `w:name`/`name` and `w:value`/`value`, add that value by name.

Arg-spec format:
* comma-separated items
* item forms:
  * `name` (shorthand for `name:name`)
  * `name:<template-expression>`

## Handler parameters and return values ##

Handler signature:
* `this`: current bound data
* `el`: element of the matching type-binding context
* `ev`: original event
* `arg`: merged arguments

Return values:
* `undefined`: handled; Weaveworld prevents default and stops propagation (except `dragstart`)
* `null`: not handled; Weaveworld continues searching
* `true`: handled; Weaveworld stops propagation but keeps browser default action

## Event declarations ##

Declarations are processed in this order:

* `w:on:X:menu="<name>[(arg_spec)]"`: opens menu by definition name or DOM id (`#menuId`), then stops further processing
* `w:on:X:data="[target][(arg_spec)]"`: sets/removes `data-*` attributes on target element
* `w:on:X:set="[target][(arg_spec)]"`: sets properties of bound data
* `w:on:X:action="[target][(arg_spec)]"`: triggers `(re)action` update context
* `w:on:X="[name][(arg_spec)]"`: calls handler
  * empty name means "handled"
  * `default` means "stop propagation but keep default action"
* `w:on:X:href="[urlTemplate][(arg_spec)]"`: opens resolved URL with merged parameters

Notes:
* Optional `target` uses parent-selector rules.
* If target is omitted, the first bound element is used.
* If the control has a `w:name` / `w:named` / `name` and a current value, that value is also merged into the final arg object.

Examples:
```html
<span w:on:click:data="(open:1)" w:on:click="">Open</span>
<span w:on:click:data="(open:null)" w:on:click="">Close</span>
<span w:on:click:set="(open:1)" w:on:click="">Set</span>
<span w:on:click:action="(open:1)" w:on:click="">Act</span>
<input type=text name=code w:on:change:action="()">
```

## Capture handlers ##

You can declare capture-phase style dispatch with `w:capture:<event>="<handlerName>"`.
Weaveworld resolves and executes matching type-handler rules before normal bubbling-phase declarations.

## Low-level event handling ##

If no high-level declaration handles the event, Weaveworld can still call low-level rules named like DOM handlers (for example `onclick`) on matching type-handlers while traversing parent contexts.

Example:
```html
<div class="Time t-container">
  <input type="number" name="hour" value=23><sup class=wbutton name="x-hour">X</sup>
  <input type="number" name="minute" value=59><sup class=wbutton name="x-minute">X</sup>
  <input type="number" name="second" value=59><sup class=wbutton name="x-second">X</sup>
</div>
```
```js
W$TYPE={ $name:'Time',
  onclick: function(el,ev){
    var e=ev.target;
    if(e.nodeName=='SUP' && e.getAttribute("name").startsWith('x-')){
      e.previousElementSibling.value=null;
    }else{
      return null; // not handled
    }
  },
};
```
