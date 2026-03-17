# WeaveworldUI - `wf.js` (Weaveworld Forms) #

`wf.js` is a small schema-driven UI/form builder extension for `w.js`.
It renders a JSON-like schema into real DOM by calling registered `WF$TYPE` rules.

Load order:

```html
<script src="../w.min.js"></script>
<script src=".../wf.js"></script>
<link href=".../wf.css" rel=stylesheet>
```

## Core idea ##

1. Register renderer types with `WF$TYPE` (`$name`, `create(...)`).
2. Build a schema node tree (`type`, optional `list`, optional `definition`).
3. Render with `WF$(...)` into a host element.

`wf.js` itself is intentionally minimal.
Most real behavior comes from your own `create(...)` functions and `w.js` helpers.

## 60-second mental model ##

`WF$` walks your schema recursively:

1. If a node has `type`, it looks up `WF$TYPE[type]` and calls `create(...)`.
2. The returned element becomes the parent for child nodes.
3. If the node has `list`, children are rendered recursively.

If a node has no `type` but has `list`, children are rendered directly into the current parent.

## Type registration ##

`WF$TYPE` uses assignment-style registration (similar to `W$TYPE`):

```js
WF$TYPE={ $name:'title',
  create:function(wf,parent,arg){
    var h=document.createElement('h3');
    h.textContent=arg.text || 'Title';
    return parent.appendChild(h);
  },
};
```

Optional inheritance:

```js
WF$TYPE={ $name:'myField', $type:'baseField', ... };
```

`$type` must point to an already registered `WF$TYPE`.

## Rendering ##

Main call:

```js
WF$(schema, null, hostElement);
```

Common pattern with global schema name:

```js
window.wf$={ type:'title', text:'Hello' };
WF$(window.wf$, 'wf$', document.getElementById('host'));
```

`WF$(v,arg,el)` behavior:

* `v`: schema object (or current `this` if omitted)
* `arg`: optional global schema name string (for example `'wf$'`)
* `el`: host DOM element

## Schema shape ##

Typical node fields:

* `type`: registered `WF$TYPE` name
* `list`: child nodes (rendered recursively)
* `definition`: options/config payload for the type (often for selects/radios)
* custom fields used by your `create(...)` function (`name`, `label`, `value`, ...)

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

## `create(...)` parameters ##

`create` is called as:

```js
create:function(wf,parent,arg,$this,def){ ... }
```

Parameters:

* `wf`: internal context object (currently minimal; reserved for extension)
* `parent`: parent DOM element where your type should append content
* `arg`: current schema node object
* `$this`: root value passed to `WF$` (commonly your schema/root object)
* `def`: parsed result of `arg.definition` via `w$definition(...)` (if present)

## Example: Survey skeleton ##

```js
WF$TYPE={ $name:'survey',
  create:function(wf,parent,arg){
    var form=document.createElement('form');
    form.className='wf-survey';
    return parent.appendChild(form);
  },
};
WF$TYPE={ $name:'text',
  create:function(wf,parent,arg){
    var d=document.createElement('div');
    var i=document.createElement('input'); i.type='text'; i.name=arg.name || '';
    d.appendChild(i);
    return parent.appendChild(d);
  },
};

window.wf$={
  type:'survey',
  list:[
    { type:'text', name:'full_name' },
    { type:'text', name:'email' },
  ],
};
WF$(window.wf$, 'wf$', document.getElementById('host'));
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
    return parent.appendChild(d);
  },
};
```

`definition` string format in current `w.js`:

* key/value separator: `=`
* item separator: newline or `;;`
* example: `"=Please select;;1=Male;;2=Female"`

## Full minimal example ##

```html
<div id=host></div>
<script>
WF$TYPE={ $name:'title',
  create:function(wf,parent,arg){
    return parent.appendChild(w$element('h3',{'w:text':arg.text||'Title'}));
  },
};
WF$TYPE={ $name:'text',
  create:function(wf,parent,arg){
    var row=parent.appendChild(w$element('div'));
    row.appendChild(w$element('label',{'w:text':arg.label||arg.name||''}));
    row.appendChild(w$element('input',{ type:'text', 'w:attr:name':arg.name||null }));
    return row;
  },
};
WF$TYPE={ $name:'select',
  create:function(wf,parent,arg,$this,def){
    var row=parent.appendChild(w$element('div'));
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
WF$(window.wf$,'wf$',document.getElementById('host'));
</script>
```

## Notes for older examples ##

The older sample files (for example `wf-basic.js`, `wf-mdl.js`, `wform-example.html`) still map well to the current model:

* their `WF$TYPE={...}` registration pattern is still valid
* root schema without `type` is still valid
* helper usage (`w$element`, `w$defineSelect`, `w$defineRadio`, `w$name`) is still valid

Main update to keep in mind:

* prefer `definition` format consistent with current `w$definition` (`=` and newline/`;;`)

## Notes ##

* `wf.js` is intentionally minimal; most behavior is defined by your `create(...)` functions.
* `wf.css` provides lightweight grid/flex helper classes (`wrow`, `wcol-*`, offsets, etc.).
* Use `w.js` utilities (`w$proxy`, `w$definition`, `w$removeElement`, ...) inside `WF$TYPE` rules when useful.
