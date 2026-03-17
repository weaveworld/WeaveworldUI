# WeaveworldUI - Templates #

In WeaveworldUI, HTML pages with example data are interpreted as templates. The HTML is actualized from the current data value (initially `W$DATA`).

During initialization, Weaveworld transforms the DOM into a lightweight representation. For production use, a filter can generate more compact output without example values.

## Template attributes ##

The template engine is controlled by element attributes whose names start with `w:`.

Most template attributes are macro-enabled:

* If the value does not contain `{{...}}`, the whole value is evaluated as one expression.
  * Example: `<sup w:text="code">1234</sup>` reads the `code` field.
* If the value contains one or more `{{...}}` fragments, each fragment is evaluated and replaced.
  * Example: `<sup w:text="[{{parent}}-{{code}}]">[x12-1234]</sup>` evaluates both fragments.
* Therefore, `...="X"` and `...="{{X}}"` are equivalent.

## Template expressions ##

In `w:` template attributes, you can use a small (fast) expression language. Its main goal is to access, transform, and check data values.

During template evaluation, the framework keeps a "current value"; initially this is `W$DATA`.

In conditions, values are falsey if they are `undefined`, `null`, `false`, `0`, `""`, or an empty array. Otherwise they are truthy.

Expression building blocks (from higher to lower precedence):

* **Field, value, expression**
  * An **empty** expression means the current value.
    * Example: `<div w:item="">...` or `<div w:item>...`
  * **`.`** also means the current value (useful before postfix conversions).
    * Example: `<div w:text=".[toSummary]">...`
  * **field**: starts with a letter, `_`, or `$`, and can continue with letters, digits, `_`, or `$`.
    * Example: `<input w:attr:maxlength="name$length"...`
  * **subfield**: `A.B` means subfield `B` of `A`.
    * Example: `list.length`
  * **identified element**: `a#b` means the element whose field `a` equals `b`.
    * Example: `<div w:item="list.name#start"...` selects the list item where `name` is `'start'`.
    * Example: `<div w:item="queue.id#0"...` selects the queue item where `id` is `'0'`.
  * **field in a context**: `A\B` means field `B` in context `A`; empty context means root (`W$DATA`).
    * Example: `Group\name` searches upward for a `Group` context and returns `name`.
    * Example: `\user.name` reads `user.name` from the root data.
  * **literal values**: `true`, `false`, `null`, `undefined`, `0`, `1`, `""`, `''`, number literals, and quoted strings.
  * **simple JavaScript expression** (limited use is recommended).
    * Example: `<span w:text="(fn(1)+1)">...`

* **Postfix conversion** (`[` and `]` after a value): `V[C [ARG]]`
  * Applies conversion `C` to value `V`.
  * Postfix conversions are evaluated left to right.
  * Example: `w:text="count[toCountText][toUppercase]"`

* **Negation** (prefix `!`) and **comparison** (infix `=` and `!`): `!A` and `A(=|!)B...`
  * Prefix `!` negates the condition.
    * Example: `<div w:show="!list"...` shows only when `list` is empty.
  * Infix `=` and `!` implement equality and inequality checks.
    * Example: `<div w:show="code='x'"...` means `code` is `'x'`.
    * Example: `<div w:show="code='x'='y'"...` means `code` is `'x'` or `'y'`.
    * Example: `<div w:show="code!'a'"...` means `code` is not `'a'`.
    * Example: `<div w:show="code!'a'!'b'"...` means `code` is neither `'a'` nor `'b'`.

* **Logical operators** (`?`, `|`, `:`): `A(?| |:)B...`
  * These operators have the same precedence and are evaluated left to right.
  * `|` means logical "or".
    * Example: `<div w:show="code='x'|state!1"...`
    * Example: `w:show="code='x'='y'|isAdmin|pass"`
    * Example: `w:text="list.length|'(none)'"` (fallback value)
  * `? ... : ...` works like a ternary branch.
    * Example: `x?'a':'b'`
    * Example: `x?'a':code=1?'b':'c'`
    * Example: `w:style:font-weight="list?'bold':'normal'"`
  * `?` also works as logical "and".
    * Example: `<div w:show="code='x'?state!1"...`
    * Example: `code='x'?state!1?'a':null`

* **Prefix conversion** (`[` and `]` before a value): `[C [ARG]]V`
  * Applies conversion `C` to `V` with an optional argument.
  * Prefix conversions are evaluated right to left.
  * Example: `w:text="[toUppercase][toCountText]count"`

## Conversions ##

Conversions can be called as:

* prefix operators (lower priority): `[conv]value`
* postfix operators (higher priority): `value[conv]`

A conversion can have an optional argument after a space.

* If the argument is wrapped in parentheses, it is evaluated as expression(s).
* Otherwise, the argument is treated as a literal string.

Conversion search order:

1. Type-handlers on the element, then its parents.
2. Built-in conversions (`W$CONVERSIONS`).
3. Global object functions (for example `encodeURIComponent`).

A conversion in a type-handler is a function with parameters:

* `el`: current element
* `v`: input value
* `arg`: optional conversion argument

Example:

```js
W$TYPE = { $name: "Order",
  toFixed: function(el, v, arg) {
    return String(v.toFixed(arg ? Number(arg) : 0));
  },
};
```

```html
<div class=Order>
  ... <span w:text="${{[toFixed 2]price}}">199.99</span> ...
```

Global converter example:

```js
function toIndentation(v, arg){
  return ((v - 1) * 10) + "px";
}
```

```html
<a w:style:margin-left="[toIndentation]level"
   w:attr:href="[encodeURIComponent]uri">...
```

### Built-in conversions ###

This version provides these built-ins:

* Condition helpers
  * `[?]` -> `true` or `false`
  * `[??]` or `[?? 'text']` -> `'text'` (or empty string) or `null`
  * `[?1]` -> `1` or `0`
  * `[!]` -> inverse condition (`w$toggle`)
  * `[!!]` or `[!! 'text']` -> `null` or `'text'`
  * `[!1]` -> `0` or `1`
* Argument/object helpers
  * `[()]` -> argument object from arg-spec string
  * `[?()]` -> query string from arg-spec
  * `[??()]` -> current URL query updated with arg-spec
* Encoding and formatting
  * `[?=]` -> `encodeURIComponent(value)`
  * `[~JSON]` -> JSON text
* Math/string ops
  * `[~]` string concat
  * `[+]`, `[-]`, `[*]`, `[/]` numeric operations
* Lookup/debug
  * `[# selector]` deep search helper
  * `[LOG]` console logging passthrough

## Type-binding (class, w:type) ##

Basic data-binding works by default.
For advanced use, see [type-binding](doc-4-type-handlers.md).

## Navigation, condition, iteration ##

* **w:item**: navigates to data and sets the current value.
  * Empty `w:item` means current value.
  * Example: `<div w:item="group"...` uses `group` from current data.
  * Example: `<div w:item...` uses current data.
  * Example: `<body w:item=""...` starts from root `W$DATA`.

Example:

```html
<div w:item="user">
  <div w:text="email"></div>
</div>
```

* **w:if**: child content is used only when the expression is truthy.
  * Optional `<w:else>` provides fallback content.

```html
<div w:if="user">
  <div w:text="user.email"></div>
  <w:else>
    <button w:on:click="login">Please log in.</button>
  </w:else>
</div>
```

* **w:each**: navigates to a value and iterates over it.

Basic form:

```html
<ul w:each=list>
  <li class=Todo w:item>
    <button w:on:onclick=todoDelete>-</button>
    <span  w:text=name>Todo 1</span>
  </li>
  <li w:item>
    <button>-</button>
    <span>Todo 2</span>
  </li>
</ul>
```

General form:

* Elements before the first `w:item` are headers.
* The first `w:item` is the repeated item template.
* Elements between the first and second `w:item` are separators.
* Elements after the last `w:item` are footers.
* Optional `<w:else>` is used when no iterable item exists.

Shorthand form:

```html
<div w:each="list" w:item>
  <button>-</button><span w:text="name">item</span>
</div>
```

Optional filter with `w:when`:

```html
<div w:each="list" w:when="!deleted" w:item>
  <button>-</button><span w:text="name">item</span>
</div>
```

## Property-like controls ##

* **w:text**: sets text (`textContent`).
  * Example: `<span w:text="code"...`
* **w:html**: sets HTML (`innerHTML`).
  * Example: `<div w:html="descr"...`
* **w:attr:X**: sets or removes attribute `X`.
  * Example: `<div w:attr:title="descr$title"...`
* **w:data:X**: sets or removes `data-X`.
  * Example: `<div w:data:open="hasItems?1:0"...`
* **w:style:X**: sets or clears style property `X`.
  * Example: `<span w:style:fontWeight="loggedin?'bold':null"...`
* **w:class:X**: adds or removes CSS class `X` by condition.
  * Example: `<div w:class:highlight="isActive"...`
* **w:set:X**: sets property `X` on the element.
  * Example: `<select w:set:value="areacode"...`
* **w:set**: sets the element's primary value (`value`, `selected`, or text, depending on element type) and runs validation checks.
  * Example: `<input w:set="email"...`
* **w:show**: shows/hides the element by condition.
  * Example: `<select w:show="code=1=2"...`
* **w:enable**: toggles `disabled` state by condition.
  * Example: `<input w:enable="isLocked"...`
* **w:allowed**, **w:show:allowed**, **w:enable:allowed**:
  allow-level helpers for visibility and enablement checks.
* **w:warning**: sets custom validity.
  * Example: `<input type="text" name="email" w:warning="email$warning"...`
* **w:value**: compares by name and updates checked/selected state.
* **w:weave**: evaluates one or more comma-separated expressions for side effects.
* **w:tagname**: evaluates and uses a dynamic tag name during rendering.
* **w:use** and **w:define**: reusable template definitions.
* **w:children**: forces regeneration of children from current template children when true.

