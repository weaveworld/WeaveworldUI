# WeaveworldUI - Validation #

Validation in Weaveworld is based on warning/message fields on bound data and utility checks called during input and event handling.

## Core concepts ##

* A field warning is usually stored as: `<field>$warning`
* A field message is usually stored as: `<field>$message`
* Element-level warning can also be stored as: `$warning`

Warnings can be shown on controls using `w:warning`:

```html
<input type=text w:name=email w:warning="email$warning">
```

`w:warning` sets HTML custom validity (`setCustomValidity`) and toggles the `w:validity` attribute.

## Validation rules on type-handlers ##

You can define validation rules on bound data prototypes:

* `field$check(el, element, value)` -> warning text or falsy
* `field$valid(value)` -> warning text or falsy
* For argument objects (events/calls):
  * `name$check(el, argObj)` / `name$valid(argObj)`
  * `name$field$valid(value)` for per-argument-field checks

Example:

```js
W$TYPE={ $name:'User',
  email$valid: function(v){
    return /.+@.+\..+/.test(v) ? null : 'Invalid e-mail';
  },
  password$valid: function(v){
    return v && v.length >= 8 ? null : 'Too short';
  },
};
```

## Utilities ##

* `w$check(el [,value])`
  * checks one control and writes `<name>$warning` on bound data
* `w$checkArg(el, name, arg [,fieldsOnly])`
  * validates argument objects (used by event dispatch)
* `w$warning(dataOrElement [,warningObject])`
  * clears warnings/messages, or writes warnings/messages from object
* `w$hasWarning(data)`
  * true if warning-like fields are present and truthy

## Warning object format ##

When writing warnings via `w$warning(..., obj)`:

* `_w` -> writes `$warning`
* `_w_<field>` -> writes `<field>$warning`
* `_m` -> writes `$message`
* `_m_<field>` -> writes `<field>$message`

Example:

```js
w$warning(el, {
  _w_email: 'Invalid e-mail',
  _m_email: 'Use a business address',
});
```

## Automatic checks with field templates ##

When using `w:name` / `w:named`, Weaveworld can auto-bind checks:

* input/select controls may get `oninput` handlers that call `w$check(...)`
* controls get `w:warning="<field>$warning"` when not already present

See also: [Field templates](doc-6-field-templates.md).
