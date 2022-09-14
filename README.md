# WeaveworldUI

**WeaveworldUI** is a JavaScript/ES Web UI library/framework for interactive web applications. Only basic (!) HTML/CSS/JavaScript skills are required to create applications.

**License**: it is **free** to use for **any** purpose, but it is _**not** open-source_ during its experimental phase (i. e., it is not allowed to use elsewhere some parts or modified versions of the source, but the original files), however the framework is  _**customizable**_ and _**redefinable**_ in every details. See: [licence](LICENSE).

For comparison, there's a [simplified demo page](demo/todo), which functional equivalent versions are also available in Vue, React and Angular.
In case of full-scale business web applications, using WeaveworldUI the development cost is only about 20%-10% (!) than other current popular solutions.

WeaveworldUI **main features**:
* It is a _"Browser-native"_ library/framework, that means:
  * It uses only _simple HTML and JS/ES_ techniques.
  * It is a simple _JS library_, thus every smaller or larger details are _customizable_.
  * To use it, only a `<script src=...` reference and the definition of the initial call or data is needed.
  * UI development needs no external tool (e.g., Node.js), only a browser and a (text) editor. (Chrome's DeveloperTools can also be used.)
* It has a novel _declarative description_ based on _"type-handlers"_: the HTML (augmented with `w:` prefixed attributes) _declares_ and _refers_ the use of data and controls, what   type-handlers (given with simple JS-objects) can _define_.
  * Declarative descriptions and type-handlers provide a _simple_ way of _event handling_.
  * The _"action-reaction"_ method enables simple instant reactions for user events.
  * The concept of _"data-realm"_ gives a unified way to organize server response data and their processing.
  * _"Field-bindings"_ means a higher level of abstraction, that is automatic augmentation of template attributes based on type-handlers' definitions.
* The source of the presentation is a simple _HTML_, that is interpreted _as a template_.
  * The UI can be _designed standalone_, without any server, by switching off templating or providing a static example data response.

Usage (where VERSION: MAJOR.MINOR.DATE; suggested use: MAJOR.MINOR, e.g., .../`WeaveworldUI@1.3/`...)
```html
<script src="https://cdn.jsdelivr.net/gh/weaveworld/WeaveworldUI@VERSION/w.min.js"></script>
<link href="https://cdn.jsdelivr.net/gh/weaveworld/WeaveworldUI@VERSION/w.css" rel="stylesheet"/>
```

**Using** WeaveworldUI is extremely simple. (see: [A simple example to do list](demo/simple-todo) tutorial.)
* Create an HTML page with example data.
* Provide some data (constant data or result of AJAX-call(s)).
* Augment HTML with (`w:` prefixed) attributes to control data-binding. → Now, the page is filled with the current values.
* Declare the types of parts of the DOM with the `class` and/or `w:type` attributes.
* Create "type-handlers" containing "rules". "Rules" covers
  * event handling,
  * meta attributes of fields (such as length, required, etc.),
  * derived (computed) values of current data,
  * data transformation, view controls,
  * constant or computed attributes of form fields.

WeaveworldUI **features**:
* [Template](doc/doc-1-template.md) engine: example HTML is filled with current data.
  * [Expression](doc/doc-1-template.md#template-expressions):
    * current data, (sub)fields, `X\A.B.C`,
    * values: `true`, `false`, `null`, `undefined`, `0`, `1`, `""`, `''`, expressions
    * `!`, `= !`, `|`, `? :`, `[ ]`, [Transformations](doc/doc-1-template.md#transformations)
  * [Transformations](doc/doc-1-template.md#transformations), `[?]`, `[??]`, `[?1]`, `[!]`, `[!!]`, `[!1]`, `[{}]`
  * [Navigation](doc/doc-1-template.md#navigation-condition-iteration): `w:item`, `w:each` (`w:when`), `w:if`, (`w:else`)
  * [Element](doc/doc-1-template.md#property-like-controls) properties: `w:attr:X`, `w:data:X`, `w:style:X`, `w:set:X`, `w:value`, `w:show`, `w:warning`
* [Event-handling](doc/doc-2-event.md): events can be handled in so called "type-handlers" (simple JS objects).
  * [High-level Event-handling](doc/doc-2-event.md#high-level-event-handling), `w:on:X`
  * [Event-handling, parameters and return values](doc/doc-2-event.md#event-handling-parameters-and-return-values), _X_`$arg`
  * `w:on:X:menu`, `w:on:X:data`, `w:on:X:set`, `w:on:X:action`
  * [Low-level Event-handling](doc/doc-2-event.md#low-level-event-handling)
* [Two-way data-binding](doc/doc-3-data-binding.md): modifying data causes DOM-element updates.
  * ['Weaving'](doc/doc-3-data-binding.md#weaving---wweave) - `w$refresh`, `w$weave`
  * [Server call](doc/doc-3-data-binding.md#server-call) - `W$CALL`
  * [Initial data](doc/doc-3-data-binding.md#initial-data) - `W$DATA`, `W$START`; [Initialization](doc/doc-3-data-binding.md#initializing) - `W$ONLOAD`
* "[Type-handlers](doc/doc-4-type-handlers.md#)": data derivation, transformation, view control, etc.
  * [Type-binding](doc/doc-4-type-handlers.md#class) - `class`, [Prototype type-binding](doc/doc-4-type-handlers.md#wtype) - `w:type`
  * [Type-handler registration](doc/doc-4-type-handlers.md#type-handler-registration) - `W$TYPE`, [Type-handler rules](doc/doc-4-type-handlers.md#type-handler-rules)
* **Validation**: basic methods to check and display validation errors.
  * _X_`$warning`, `_w`, `_w`$_X_, `w:warning`,
  * _X_`$check`, _X_`$valid`
  * _X_`$message`, `_m`, `_m`$_X_,
* "**Field-templates**": setting defaults based on type-handler rules.
  * `w:name`, `w:named`
* **Access-control**: levels of view, update, delete, etc.
  * `w:for`, `w:show:for`, `w:enable:for`
* **(Re)action contexts**: complex reactions for events.
  * `w:at`, `$at$`_X_
* Basic **localization**: string translation using a dictionary.
* **Utility functions**
* **Customization**: practically everything can be redefined.
