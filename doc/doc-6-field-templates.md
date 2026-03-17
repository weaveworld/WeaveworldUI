# WeaveworldUI - Field Templates (`w:name`, `w:named`) #

Field templates are automatic attribute expansions driven by type-handler metadata.
They are the main high-level authoring layer for form-heavy WeaveworldUI screens: instead of wiring every `w:set`, `w:warning`, `required`, `maxlength`, and `w:on:*` manually, you declare metadata once and let the framework fill in the routine pieces.

Main attributes:

* `w:name="fieldName"`: configures one control from field metadata
* `w:named="fieldName"`: same as `w:name`, plus auto input/action wiring for interactive controls

Rule of thumb:

* Use `w:name` when you mainly want metadata-driven defaults and validation wiring.
* Use `w:named` when you also want live action/event flow while the user edits.

## Metadata conventions ##

Given field name `name`, common metadata rules are:

* basic type/value shape
  * `name$type`
  * `name$required`
  * `name$length`
  * `name$size`
  * `name$min`, `name$max`, `name$step`
  * `name$pattern`
* text/help
  * `name$placeholder`
  * `name$title` / `name$hint`
* choice/definition data
  * `name$definition` (select/radio/checkbox options, etc.)
* access/enablement
  * `name$apt` / `name$allowed`
* validation
  * `name$check` / `name$valid`

## What gets auto-generated ##

Depending on element type, Weaveworld may add defaults when missing:

* `FORM`
  * `accept-charset="utf-8"`
  * submit wiring (`onsubmit`, `w:on:submit`)
  * form `w:name` is treated as the submit-handler name
* `BUTTON`
  * click wiring (`w:on:click`)
  * definition-driven element setup when `<field>$definition` is present
  * enable/allowed rules (`w:enable`, `w:enable:allowed`)
* `INPUT`, `SELECT`, `DATALIST`, `DIV[type=html|text]`
  * value binding (`w:set`, `w:set:value`, `w:attr:checked`, etc.)
  * validation attributes (`required`, `pattern`, `maxlength`, ...)
  * warning binding (`w:warning="<field>$warning"`)
* `DIV[type=radio|checkbox]`
  * option rendering from `<field>$definition`
  * current-value comparison and selection wiring

Element-specific notes:

* `SELECT` / `DATALIST` can populate options from `<field>$definition`.
* `INPUT[type=checkbox|radio]` can derive checked/value behavior from the field metadata and current bound value.
* Plain `DIV` wrappers can become text, html, radio, or checkbox presenters depending on `type`.

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
* `class` and `w:type` are still useful alongside `w:name` / `w:named`: they provide the metadata, conversions, handlers, and validators that field templates expand from.
* `w:named` is especially useful for editors and panels where typing should immediately feed the action pipeline.
