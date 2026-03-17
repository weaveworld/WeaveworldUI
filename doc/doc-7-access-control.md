# WeaveworldUI - Access Control #

Weaveworld provides lightweight access-level checks for visibility and enablement.

## Attributes ##

* `w:allowed="..."` -> sets access level on an element context
* `w:show:allowed="..."` -> shows element only if access is sufficient
* `w:enable:allowed="..."` -> enables control only if access is sufficient

These checks use `w$allowed(...)` and access levels normalized by `W$ALLOW(...)`.

## Level codes ##

Level mapping (string prefixes):

* `0`, `-` -> none
* `r`, `g`, `+` -> read/get
* `c` -> change settings
* `l` -> list
* `a` -> add
* `d` -> delete (default level if unknown)
* `w`, `s`, `=` -> write/set
* `*` -> all

## Example ##

```html
<div w:allowed="'r'">
  <button w:show:allowed="'a'">Add</button>
  <button w:enable:allowed="'w'">Save</button>
  <button w:enable:allowed="'*'">Admin</button>
</div>
```

## In field templates ##

If metadata contains `<field>$allowed` or `<field>$apt`, `w:name` can generate:

* `w:enable:allowed="..."`
* `w:enable="..."`

This keeps permission behavior close to type metadata.
