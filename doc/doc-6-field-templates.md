# WeaveworldUI - Field Templates (`w:name`, `w:named`) #

Field templates are automatic attribute expansions driven by type-handler metadata.

Main attributes:

* `w:name="fieldName"`: configures one control from field metadata
* `w:named="fieldName"`: same as `w:name`, plus auto input/action wiring for interactive controls

## Metadata conventions ##

Given field name `name`, common metadata rules are:

* `name$type`
* `name$required`
* `name$length`
* `name$size`
* `name$min`, `name$max`, `name$step`
* `name$pattern`
* `name$placeholder`
* `name$title` / `name$hint`
* `name$definition` (select/radio/checkbox options, etc.)
* `name$apt` / `name$allowed`
* `name$check` / `name$valid`

## What gets auto-generated ##

Depending on element type, Weaveworld may add defaults when missing:

* `FORM`
  * `accept-charset="utf-8"`
  * submit wiring (`onsubmit`, `w:on:submit`)
* `INPUT`, `SELECT`, `DATALIST`, `DIV[type=html|text]`
  * value binding (`w:set`, `w:set:value`, `w:attr:checked`, etc.)
  * validation attributes (`required`, `pattern`, `maxlength`, ...)
  * warning binding (`w:warning="<field>$warning"`)
* `BUTTON`
  * submit/action wiring
  * enable/allowed rules (`w:enable`, `w:enable:allowed`)

For `w:named`, interactive controls also get:

* `w:on:input:action="()"` (if missing)
* `w:on:input=""` (if missing)

## Example ##

```js
W$TYPE={ $name:'Todo',
  name$type: 'string',
  name$required: true,
  name$length: 64,
  name$placeholder: 'Task name',
  name$valid: function(v){ return v ? null : 'Required'; },
};
```

```html
<form w:name="todoAdd" w:item="[toNew]" w:type=Todo>
  <input class=winput w:name=name><sup></sup>
  <button>+</button>
</form>
```

Result: `required`, `maxlength`, warning handling, and submit/event wiring are configured automatically.

## Notes ##

* Dot names are supported (`order.item.name`).
* Names starting with `!` are treated as operation-like names in submit/action contexts.
* `w:name` works best when current data is bound with `w:item` / `w:type`.
