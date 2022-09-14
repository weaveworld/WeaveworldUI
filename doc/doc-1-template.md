# WeaveworldUI - Templates #

Using WeaveworldUI, HTML pages with example data are interpreted as templates. The HTML will be actualized based on the current data.
Initially, the value of W$DATA is used.

(During initialization, Weaveworld transforms DOM into a lightweight representation. For production use, a filter program can create more compact pages without the examples.)

## Template attributes ##

The template engine is controlled by element attributes, that have `w:` prefixed names.

Most attributes are handled as _macros_, which can contain expressions:     

* If there's no `{{` in the attribute value at all, then the whole value is evaluated as an expression.
  * e.g., `<sup w:text="code">1234</sup>` - accessing the `code` field.
* If there are one or more parts between the `{{` and `}}` symbols in the attribute value, then they are evaluated and replaced by their results.
  * e.g., `<sup w:text="[{{parent}}-{{code}}]">[x12-1234]</sup>` - parts will be replaced with the values of the `parent` and `code` fields.
* That means, that `...="X"` and `...="{{X}}"` attribute values are handled in the same way.

## Template expressions ##

In (the `w:` prefixed) template attributes simple expressions can be given. 

WeaveworldUI has a very limited (but fast) expression language, which main goal is to access, transform and check parts of data. 
Note that, using "`[]` prefix or postfix conversions", _full control_ (!) can be gained.   

During template actualization, there is a concept of "current value", that is initialy the value of W$DATA.

In case of conditionals, values are considered false, if they're `undefined`, `null`, `false`, `0`, `""` or an empty array (!); otherwise they're considered as true.

Building blocks of expressions (from higher to lower precedence):

* **Field, value, expression**
  * **empty** expression means **current data**, so empty `w:item` means "current data"   
    e.g., `<div w:item="">...` or `<div w:item>...`
  * **`.`** ("dot") also refers to the **current data**, that can be used with postfix conversions.
    * e.g., `<div w:text=".[toSummary]">...` - the `toSummary` conversion of the current data
  * **field** (that may contain letters, `$`, `@`, `_` and digits, and not started with digit)   
    e.g., `<input w:attr:maxlength="name$length"...`
  * **subfield**: A`.`B means subfield B of field A,   
    e.g., `list.length`
  * **identified element**: a`#`b means that element, where the `a` (default is id) field's value is `b`.  
    e.g. `<div w:item="list.name#start" ...` - in the list field of the current value that element, which `name` field has the `'start'` value.   
    e.g. `<div w:item="queue.#0" ...` - in the queue field of the current value that element, which `id` field has the `'start'` value.   
  * **field of a context**: A`\`B means field B in context A, where empty context is the root (i.e., W$DATA)     
    e.g., `Group\name` looks upward for a Group and gets its name  
    e.g., `\user.name` looks for the root data (W$DATA) and gets the user's name
  * literal **value**: `true`, `false`, `null`, `undefined`, `0`, `1`, `""`, `''`, Number, String between `"` or `'`.
  * simple **expression** (limited). (Only the simplest expressions are allowed; for more complex rules use conversions.)
    *  e.g., `<span w:text="(fn(1)+1)">`...      

* **Postfix conversion (postfix `[` and `]`)**: V`[`C <sub>[</sub>ARG<sub>]</sub>`]`   
  * Uses C conversion on the V value. Postfix conversions are performed left to right.  
   e.g., `... w:text="count[toCountText][toUppercase]"`
 

* **Negation (prefix `!`)** and **Comparison (infix `=`, `!`)**: `!`A and A<sub>{</sub><sub>(</sub>`=`<sub>|</sub>`!`<sub>)</sub>B<sub>}</sub>
  * Prefix `!` check is for negation.  
    e.g., `<div w:show="!list"`... - show only if the list is empty
  * Infix `=` and `!` is for equality and non-equality checks.  
    It checks if the left value equals one of the '=' values, but not equals none of the '!' values.  
    e.g., `<div w:show="code='x'"` ... - the code is 'x'  
    e.g., `<div w:show="code='x'='y'"` ... - the code is 'x' or 'y', i.e., code is in ('x','y')  
    e.g., `<div w:show="code!'a'"` ... - the code is not 'a'  
    e.g., `<div w:show="code!'a'!'b'"` ... - the code is neither 'a' nor 'b', i.e., code is not in ('a','b')  

* **Logical operators (`?`, `|`, `:`)**: A<sub>{</sub><sub>(</sub>`?`<sub>|</sub>`|`<sub>|</sub>`:`<sub>)</sub>B<sub>}</sub>    
  Logical operators have the same priority and are evaluated left to right. (The notation is a generalization of the "? :" ternary-operator, because `&` can not be directly written in an HTML attribute.)
  * `|` means "or"
    * e.g., `<div w:show="code='x'|state!1"` ... - show only if the code is 'x' or the state is not 1
    * e.g., `... w:show="code='x'='y'|isAdmin|pass"` ...: if the code is 'x' or 'y', or isAdmin or pass is considered as true
    * e.g., `... w:text="list.length|'(none)'"...`: default for the value
  * between `?` and `:` that is the return value if the previous expression is true, otherwise the evaluation continues after the `:` symbol.  
    * e.g., `...="x?'a':'b'"` ... - if x is true-ish then 'a' else 'b'
    * e.g., `...="x?'a':code=1?'b':'c'"` ... - if x is true-ish then 'a' else if code is 1 then 'b' else 'c'.
    * e.g., `... w:style:font-weight="list?'bold':'none'"...`
  * `?` also means "and"
    * e.g., `<div w:show="code='x'?state!1"` ... - show only if the code is 'x' and state is not 1
    * e.g., `...="code='x'?state!1?'a':null"` ... - if code='x' and state is not 1 then 'a' else null
   
* **Prefix conversion (prefix `[` and `]`)**: `[`C <sub>[</sub>ARG<sub>]</sub>`]`V    
  Uses C conversion on the V value with an optional arguments. 
  Prefix conversions are performed right to left.  
  e.g., `... w:text="[toUppercase][toCountText]count"`
  

## Conversions ##

Conversions can be invoked as a (low priority) prefix or (high priority) postfix operator.
Conversion can have an optional argument after a space.  
if the argument is between parenthesis, then it is evaluated. Otherwise the argumentum is considered as a literal (e.g., a pattern for the conversion). 

Conversions' *search order*:

**1.** Type-handlers of the element and its parents.

A conversion can be defined as a function "rule" in the type-handler. Parameters are:
* _el_: the processed element. (Thus the element attributes or the content can be changed!)
* _v_: the value to be changed.
* _arg_: the (optional) argument, that can be literal.

The following example defines a `toFixed` conversion for the `Order` type-handler:
```js
W$TYPE={ $name:'Order',
    toFixed: function(el,v,arg){
      return String(v.toFixed(p?Number(p):0));  
    },
}
```
```html
<div class=Order>
  ... <span w:text="${{[toFixed 2]price}}">199.99</span> ...
```

**2.** Basic conversions. (See below.)


**3.** Global object's functions. Parameters: _value_ and optional argument.

```js
function toIndentation(v,arg){ 
  return ((v-1)*10)+"px";
} 
```
```html
<a w:style:margin-left="[toIndentation]level" 
  w:attr:href="[encodeURIComponent]uri">...
```

### Basic conversions ###

Initially WeaveworldUI has the following built-in conversions:

* condition-conversion
  * `[?]`: condition conversion to `true` or `false`    
    * e.g., `<div w:attr:contenteditable="[?]code$isEditable"` ...
    * e.g., `<div w:show="[?]details"` ...   
    * (The `[?]` conversion is performed via `w$is` redefinable utility function.)
  * `[?? `<sub>[</sub>`'`_string_`'`<sub>]</sub>`]`: conversion to "HTML conditional", that is the _string_ (default is empty string) or `null`.
     * e.g., `<input type=radio w:attr:checked="[??]code='1'" value="1"` ...
     * e.g., `<input type=radio w:attr:checked="[?? 'checked']code='1'" value="1"` ...  
  * `[?1]`: conversion to `1` or `0`
    * e.g., `<div w:data:open="[?1]opened"` ...    
* complementer condition-conversion
  * `[!]`: complementer condition to `false` or `true`.
    * e.g., `<div w:attr:contenteditable="[!]comment$isLocked"` ...
    * (The `[!]` conversion is performed via `w$toggle` redefinable utility function.)
  * `[!! `<sub>[</sub>`'`_string_`'`<sub>]</sub>`]`: conversion to "HTML conditional", that is `null` or the _string_ (default is empty string).
  * `[!1]`: conversion to `0` or `1`.
* `[{} `<sub>[</sub>FIELD_ASSIGNS<sub>]</sub>`]`: extracts values into an object. 
    * e.g., `<div w:item="[{}]"` ... - uses a new empty object.

## Type-binding (class, w:type) ##

Basic data-binding is performed by default.  
For more advanced use, [type-binding](doc-4-type-handlers) is needed.
  
## Navigation, condition, iteration ##  
  
* **w:item** - navigates to the data, and that will be the current data.  
Empty `w:item` means "current data".
  * e.g., `<div w:item="group"` ... - uses the `group` field of the current data.
  * e.g., `<div w:item` ... - uses the current data.
  * e.g., `<body w:item=""` ... - starts to use (the initial) W$DATA at the body element.

The following example navigates to the `user` and uses its `email` value.
```html
<div w:item="user">
  <div w:text="email"></div>
</div>
```

* **w:if** - child elements of the content are used only if the value is true-ish.

  * An optional `w:else` can be given for an alternate content.

```html
<div w:if="user">
  <div w:text="user.email"></div>
  <w:else>
    <button w:on:onclick=login>Please, login!</button>
  </w:else>
</div>
```

* **w:each** - navigates to the value, and iterates on it.

The basic form is the following: the outer element is marked by a `w:each`, and one or more inner elements are marked by an empty `w:item`, as "the current data". During iteration only the first marked element will be used as template.

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

The general form of `w:each` is the next:
* The elements before the first item are the _headers_.
* First item is used as the _iterated pattern_.
* Elements between the first and second items are used as _separators_.
* Elements after the last elements are used as _footers_.
* An optional `w:else` can be used as replacement, if there's no iterable item at all.

There's a shorthand version, where the w:each and the empty w:item is given by the same element, so that will be repeated.

```html
<div w:each=list w:item>
  <button>-</button><span w:text=name>item</span>
</div>
```

Using w:each there's an optional **w:when** attribute, what can filter the results.

```html
<div w:each=list w:when="!deleted" w:item>
  <button>-</button><span w:text=name>item</span>
</div>
```

## Property-like controls ##  

* **w:text** - sets the element text (i.e., the `textContent`).
  * e.g., `<span w:text=code` ...

* **w:html** - sets the element's HTML content (i.e., the `innerHTML`).
  * e.g., `<div w:html=descr` ...

* **w:attr:X** - sets or removes the given attribute.
  * e.g., `<div w:attr:title="descr$title"` ...

* **w:data:X** - sets or removes the given 'data-' prefixed attribute.
  * e.g., `<div w:data:open="hasItems?1:0"` ...

* **w:style:X** - sets or removes the given style attribute.
  * e.g., `<span w:style:fontWeight="loggedin?'bold':null"` ...
  * e.g., `<span w:style:width="{{o_r|17.7}}%"` ...

* **w:set:X** - sets or removes the given property of the element.
  * e.g., `<select w:set:value=areacode` ...

* **w:show** - Element is shown only if the expression value is considered as true.
  * e.g., `<select w:show="code=1=2"` ...

* **w:warning** - sets the element's custom validity property.
  * e.g., `<input type=text name=email w:warning=email$warning` ...




