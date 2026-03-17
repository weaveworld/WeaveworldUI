# WeaveworldUI - WFORM (`[W$Form ...]` in `w:children`) #

WFORM is a schema-driven form/page layer inside WeaveworldUI itself.
It is not a separate add-on anymore: it uses the same `w.js` runtime, helpers, data flow, and styling model as the rest of WeaveworldUI.
In normal authoring it is used as the converter form `[W$Form schemaName]`, typically inside `w:children`.
It renders a JSON-like schema into real DOM by calling registered `WF$TYPE` rules.

Load order:

```html
<script src=".../w.js"></script>
<link href=".../w.css" rel=stylesheet>
```

## Core idea ##

1. Register renderer types with `WF$TYPE` (`$name`, usually `create(...)`, optionally `append(...)`).
2. Build a schema node tree (`type`, optional `list`, optional `definition`).
3. Render from a host element with `w:children="[W$Form schemaName]"`.

The WFORM layer itself is intentionally minimal.
Most real behavior comes from your own `create(...)` / `append(...)` functions and `w.js` helpers.

So the practical layering is:

1. `[W$Form ...]` when the UI is easier to describe as a schema tree.
2. `w:name` / `w:named` when you already have handwritten HTML and want metadata-driven form wiring.
3. Direct `w:` attributes and low-level helpers when you need full manual control.

## 60-second mental model ##

`[W$Form ...]` walks your schema recursively:

1. If a node has `type`, it looks up `WF$TYPE[type]`.
2. If the type has `append(...)`, that function appends into `parent` itself and returns the child host.
3. Otherwise, if the type has `create(...)`, the returned element is appended automatically and becomes the child host.
4. If the node has `list`, children are rendered recursively.

If a node has no `type` but has `list`, children are rendered directly into the current parent.

## Type registration ##

`WF$TYPE` uses assignment-style registration (similar to `W$TYPE`):

```js
WF$TYPE={ $name:'title',
  create:function(wf,parent,arg){
    var h=document.createElement('h3');
    h.textContent=arg.text || 'Title';
    return h;
  },
};
```

Optional inheritance:

```js
WF$TYPE={ $name:'myField', $type:'baseField', ... };
```

`$type` must point to an already registered `WF$TYPE`.

You can also register a type from inline HTML:

```js
WF$TYPE='<div wf:define=TextField class=wf-field><label w:text=label></label><input type=text w:set=value w:attr:placeholder=placeholder></div>';
```

In that form:

* `wf:define` on the root element becomes the `WF$TYPE` name
* the HTML is parsed once and stored as an internal `element` template
* if the type has no `create(...)` / `append(...)`, the template is cloned and woven against the current schema node (`arg`)
* if the cloned template contains an empty `wf:children` attribute, that element becomes the host for recursive `list` rendering

## Rendering ##

Typical host usage:

```html
<div w:children="[W$Form wf$]"></div>
```

Common pattern with a named schema and current page/form data:

```html
<div w:item=formData w:children="[W$Form wf$]"></div>
```

```js
W$DATA={ formData:{ name:'Ada' } };
window.wf$={ type:'title', text:'Hello' };
```

Converter behavior:

* current data becomes `$this` for `WF$TYPE` hooks
* converter arg resolves the schema name (for example `wf$`)
* current element becomes the host parent for rendered content
* `w:children` snapshots the generated children as the active child template

The underlying helper function still exists in `w.js`, but the normal public authoring style is the converter form `[W$Form ...]`.

## Schema shape ##

Typical node fields:

* `type`: registered `WF$TYPE` name
* `list`: child nodes (rendered recursively)
* `definition`: options/config payload for the type (often for selects/radios)
* custom fields used by your `create(...)` or `append(...)` function (`name`, `label`, `value`, ...)

Example schema node:

```js
{
  type:'text',
  name:'email',
  label:'E-mail',
  value:'alice@example.com',
}
```

Root node without `type` is also valid:

```js
{
  list:[
    { type:'title', text:'Profile' },
    { type:'text', name:'email', label:'E-mail' },
  ],
}
```

## `create(...)` / `append(...)` parameters ##

Both hooks are called as:

```js
create:function(wf,parent,arg,$this,def){ ... }
```

Parameters:

* `wf`: internal context object (currently minimal; reserved for extension)
* `parent`: parent DOM element where your type should append content
* `arg`: current schema node object
* `$this`: root value passed to `W$Form` (commonly your schema/root object)
* `def`: parsed result of `arg.definition` via `w$definition(...)` (if present)

Use `create(...)` when the type returns one element that should simply be appended to `parent`.

Use `append(...)` when the type needs custom insertion logic, multiple sibling nodes, or wants to return a child host that is not the same node it appended first.

## Example: Survey skeleton ##

```js
WF$TYPE={ $name:'survey',
  create:function(wf,parent,arg){
    var form=document.createElement('form');
    form.className='wf-survey';
    return form;
  },
};
WF$TYPE={ $name:'text',
  create:function(wf,parent,arg){
    var d=document.createElement('div');
    var i=document.createElement('input'); i.type='text'; i.name=arg.name || '';
    d.appendChild(i);
    return d;
  },
};

W$DATA={ formData:{} };
window.wf$={
  type:'survey',
  list:[
    { type:'text', name:'full_name' },
    { type:'text', name:'email' },
  ],
};
```

```html
<div w:item=formData w:children="[W$Form wf$]"></div>
```

## Example: `definition` for a select ##

```js
WF$TYPE={ $name:'select',
  create:function(wf,parent,arg,$this,def){
    var d=document.createElement('div');
    var s=document.createElement('select');
    var opts=w$definition(arg.definition); // "a=A;;b=B" -> Map
    opts && opts.forEach(function(label,value){
      var o=document.createElement('option');
      o.value=value; o.textContent=label; s.appendChild(o);
    });
    d.appendChild(s);
    return d;
  },
};
```

`definition` string format in current `w.js`:

* key/value separator: `=`
* item separator: newline or `;;`
* example: `"=Please select;;1=Male;;2=Female"`

## Full minimal example ##

```html
<div id=host w:item=formData w:children="[W$Form wf$]"></div>
<script>
W$DATA={ formData:{} };
WF$TYPE={ $name:'title',
  create:function(wf,parent,arg){
    return w$element('h3',{'w:text':arg.text||'Title'});
  },
};
WF$TYPE={ $name:'text',
  create:function(wf,parent,arg){
    var row=w$element('div');
    row.appendChild(w$element('label',{'w:text':arg.label||arg.name||''}));
    row.appendChild(w$element('input',{ type:'text', 'w:attr:name':arg.name||null }));
    return row;
  },
};
WF$TYPE={ $name:'select',
  create:function(wf,parent,arg,$this,def){
    var row=w$element('div');
    var sel=row.appendChild(w$element('select',{ 'w:attr:name':arg.name||null }));
    w$defineSelect(sel,def||arg.definition||'');
    return row;
  },
};

window.wf$={
  list:[
    { type:'title', text:'Simple form' },
    { type:'text', name:'full_name', label:'Full name' },
    { type:'select', name:'role', definition:'=Choose;;dev=Developer;;qa=QA' },
  ],
};
</script>
```

## Notes for older examples ##

The older sample files (for example `wf-questionnaire-basic.js`, `wf-questionnaire-mdl.js`, `wform-example.html`) still map well to the current model:

* their `WF$TYPE={...}` registration pattern is still valid
* `[W$Form ...]` is the preferred public entry point; the legacy `WF$(...)` function still works
* `create(...)` is the usual renderer hook for a single returned host element
* `append(...)` is for advanced types that manage parent insertion directly
* root schema without `type` is still valid
* helper usage (`w$element`, `w$defineSelect`, `w$defineRadio`, `w$name`) is still valid

Main update to keep in mind:

* prefer `definition` format consistent with current `w$definition` (`=` and newline/`;;`)

## Notes ##

* The WFORM layer in `w.js` is intentionally minimal; most behavior is defined by your `create(...)` / `append(...)` functions.
* `w.css` provides the lightweight grid/flex helper classes (`wrow`, `wcol-*`, offsets, etc.).
* Use `w.js` utilities (`w$proxy`, `w$definition`, `w$removeElement`, ...) inside `WF$TYPE` rules when useful.
