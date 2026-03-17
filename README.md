# WeaveworldUI

**WeaveworldUI** is a browser-native JavaScript/ES UI framework for interactive web applications.
It uses standard HTML/CSS/JavaScript plus `w:` attributes, and does not require a mandatory build toolchain.

## License

This project is open source under the Apache License 2.0.
See: [LICENSE](LICENSE).

## Technical overview

WeaveworldUI uses real HTML as the presentation source and interprets it as a template against current data (`W$DATA`).
Behavior is defined with `w:` attributes and JavaScript type-handlers (`W$TYPE`), then applied through a reactive data-binding runtime.

In practice, the framework can be used at multiple levels:

- **Schema-driven form/page generation** with `w:children="[W$Form ...]"` and `WF$TYPE`
- **High-level form/page authoring** with `w:name` / `w:named` and metadata on `W$TYPE`
- **Direct declarative binding** with `w:` attributes such as `w:text`, `w:if`, `w:each`, `w:on:*`
- **Low-level runtime control** with helpers like `w$apply`, `w$weave`, `w$refresh`, `w$action`, and `W$CALL`

Most business-form code can stay on the higher levels, while the lower levels remain available for customization and special cases.

- Works with **plain HTML/CSS/JS**, with **no mandatory build tooling**.
- You can start from a **static HTML page** with **example data**.
- Logic can live directly in the **same page/file** (including mixed **HTML/CSS/JS**).
- Development is **incremental**: start with **simple bindings**, then add richer behavior only where needed.
- The same page remains **designable as real HTML** throughout development.
- **`W$TYPE`** provides a **unified behavior model** for events, conversions, metadata, validation, and actions.
- Delivers **consistent patterns** for **business UIs** (forms, CRUD flows, permission-aware screens).
- Supports **progressive architecture growth** without forcing early over-structuring.
- Reduces dependency on **build-tool ecosystem churn**.
- Keeps **DOM/output transparent**, which improves inspection and debugging.
- Offers strong **customization/override points** (calls, events, conversions, lifecycle, policy rules).
- Well-suited to **internal/productivity apps** where **speed**, **consistency**, and **maintainability** matter.

## Main features

* **Build interactive pages with plain web skills.** You can work directly with HTML, CSS, and JavaScript, without switching to a separate UI language.
* **Design first, wire later.** You can start from real HTML with example values, then connect it to live data step by step.
* **Keep markup and behavior close together.** `w:` attributes let you describe what each element should show, hide, enable, or update in place.
* **Reuse behavior across screens.** Type-based rules help you define once and apply consistently in many parts of the UI.
* **Handle user actions in a predictable way.** Event handling is designed so buttons, forms, and controls follow the same patterns across the app.
* **Update only what changed.** Data updates can refresh the related UI parts without rebuilding entire pages.
* **Connect to your backend in your preferred style.** You can integrate server calls with operation-style or REST-style APIs.
* **Show validation feedback where users need it.** Validation and messages are built in so form errors can appear consistently at field level.
* **Reduce repeated form setup.** Field templates can apply common rules automatically (required, length, pattern, placeholders, etc.).
* **Generate forms from schema when that fits better.** `[W$Form ...]` provides a built-in schema-driven layer on top of the same WeaveworldUI runtime.
* **Work at a higher level when desired.** `w:name` and `w:named` can generate much of the routine form wiring from metadata.
* **Control visibility and editability from business rules.** Access-related rules can hide or disable actions based on user level.
* **Support multilingual applications.** Localization helpers make it easier to translate UI text through a dictionary.
* **Adapt the framework to project needs.** Core behavior is customizable, so teams can tune conventions without rewriting everything.

### Summary

#### Core developer features

- **Browser-native workflow**: Build with plain HTML, CSS, and JavaScript, without a mandatory build toolchain.
- **Declarative UI in markup**: Use `w:` attributes to express binding, conditions, iteration, and element behavior where it is used.
- **Reusable behavior model**: Define shared UI logic with type-handlers (`W$TYPE`) and apply it consistently across screens.
- **Predictable event and update flow**: Keep user actions, argument mapping, and UI updates structured and uniform.
- **Integrated server call model**: Work with both operation-style and REST-style APIs through a single call flow (`W$CALL`).
- **Reactive data-to-DOM updates**: Update only affected UI parts as data changes.
- **Customizable runtime**: Override and extend core behaviors without changing the framework model.

#### Built-in capabilities

- **Validation and user feedback**: Field-level warnings/messages are part of the normal data flow.
- **Schema-driven UI layer**: `[W$Form ...]` can render structured form/page schemas on top of the same runtime and helpers.
- **Form defaults from metadata**: Reduce repeated form wiring with field-template rules.
- **Access-based UI control**: Hide or disable UI actions from declared access rules.
- **Localization support**: Use dictionary-based translation helpers for multilingual interfaces.

## Basic usage

```html
<script src="https://cdn.jsdelivr.net/gh/weaveworld/WeaveworldUI@VERSION/w.min.js"></script>
<link href="https://cdn.jsdelivr.net/gh/weaveworld/WeaveworldUI@VERSION/w.css" rel="stylesheet"/>
```

Version format: `MAJOR.MINOR.DATE`.
Recommended CDN reference: `MAJOR.MINOR` (for example `.../WeaveworldUI@1.3/...`).

## Typical development flow

1. Create HTML with example values.
2. Provide initial data (`W$DATA`) or load it (`W$START` + `W$CALL`).
3. Add `w:` template attributes.
4. For forms, choose the higher layer that fits best: `w:children="[W$Form ...]"` for schema-driven generation, or `w:name` / `w:named` for metadata-driven wiring in handwritten HTML.
5. Bind types via `class` and/or `w:type`.
6. Define `W$TYPE` / `WF$TYPE` rules for events, conversions, metadata, validation, or schema rendering.

Tutorial: [simple To-Do](demo/simple-todo/README.md).

## Features

### Main features

* [Template](doc/doc-1-template.md) - build UI structure and value rendering from HTML templates.
  * [Template attributes](doc/doc-1-template.md#template-attributes)
  * [Template expressions](doc/doc-1-template.md#template-expressions)
  * [Conversions](doc/doc-1-template.md#conversions)
  * [Navigation, condition, iteration](doc/doc-1-template.md#navigation-condition-iteration)
  * [Property-like controls](doc/doc-1-template.md#property-like-controls)
  * Cheat-sheet: `w:item`, `w:each`, `w:if`, `w:else`, `w:text`, `w:value`, `w:show`, `w:enable`, `w:attr:*`, `w:style:*`, `w:class:*`

* [Events](doc/doc-2-event.md) - define predictable user interaction flow.
  * [High-level event handling](doc/doc-2-event.md#high-level-event-handling)
  * [Arguments (`$arg` and declaration args)](doc/doc-2-event.md#arguments-arg-and-declaration-args)
  * [Event declarations](doc/doc-2-event.md#event-declarations)
  * [Capture handlers](doc/doc-2-event.md#capture-handlers)
  * [Low-level event handling](doc/doc-2-event.md#low-level-event-handling)
  * Cheat-sheet: `w:on:X`, `w:on:X:menu`, `w:on:X:data`, `w:on:X:set`, `w:on:X:action`, `w:on:X:href`, `w:capture:X`, `X$arg`

* [Data binding](doc/doc-3-data-binding.md) - keep data and DOM synchronized and integrate server responses.
  * [Refresh (`w$refresh`)](doc/doc-3-data-binding.md#refresh-wrefresh)
  * [Weaving (`w$weave`)](doc/doc-3-data-binding.md#weaving-wweave)
  * [Server call (`W$CALL`)](doc/doc-3-data-binding.md#server-call-wcall)
  * [ONCE-style operation names](doc/doc-3-data-binding.md#once-style-operation-names)
  * [Initial data (`W$DATA`, `W$START`)](doc/doc-3-data-binding.md#initial-data-wdata-wstart)
  * [Initialization](doc/doc-3-data-binding.md#initialization)
  * Cheat-sheet: `w$refresh`, `w$weave`, `W$CALL`, `W$DATA`, `W$START`, `W$ONLOAD`

* [Type-handlers and type binding](doc/doc-4-type-handlers.md) - centralize reusable behavior and field metadata.
  * [Class-based binding (`class`)](doc/doc-4-type-handlers.md#class-based-binding-class)
  * [Prototype binding (`w:type`)](doc/doc-4-type-handlers.md#prototype-binding-wtype)
  * [Type-handler registration (`W$TYPE`)](doc/doc-4-type-handlers.md#type-handler-registration-wtype)
  * [Supertypes (`$type`)](doc/doc-4-type-handlers.md#supertypes-type)
  * [Type-handler rules](doc/doc-4-type-handlers.md#type-handler-rules)
  * Cheat-sheet: `W$TYPE`, `$name`, `$type`, `class`, `w:type`, `X$arg`, `X$check`, `X$valid`

### Extended features

* [WFORM](doc/doc-wf.md) - schema-driven form/page generation as another built-in WeaveworldUI layer.
  * [Core idea](doc/doc-wf.md#core-idea)
  * [Type registration](doc/doc-wf.md#type-registration)
  * [Rendering](doc/doc-wf.md#rendering)
  * [Hook semantics](doc/doc-wf.md#create--append-parameters)
  * Cheat-sheet: `w:children`, `[W$Form ...]`, `WF$TYPE`, `create(...)`, `append(...)`, `definition`, `list`

* [Validation](doc/doc-5-validation.md) - consistent warning/message flow and checks.
  * [Core concepts](doc/doc-5-validation.md#core-concepts)
  * [Validation rules on type-handlers](doc/doc-5-validation.md#validation-rules-on-type-handlers)
  * [Utilities](doc/doc-5-validation.md#utilities)
  * [Warning object format](doc/doc-5-validation.md#warning-object-format)
  * [Automatic checks with field templates](doc/doc-5-validation.md#automatic-checks-with-field-templates)
  * Cheat-sheet: `_w`, `_w$field`, `_m`, `_m$field`, `w:warning`, `$check`, `$valid`

* [Field templates](doc/doc-6-field-templates.md) - auto-apply form defaults from metadata.
  * [Metadata conventions](doc/doc-6-field-templates.md#metadata-conventions)
  * [What gets auto-generated](doc/doc-6-field-templates.md#what-gets-auto-generated)
  * [Notes](doc/doc-6-field-templates.md#notes)
  * Cheat-sheet: `w:name`, `w:named`, `field$type`, `field$required`, `field$length`, `field$pattern`

* [Access control](doc/doc-7-access-control.md) - declare view/edit permissions in templates.
  * [Attributes](doc/doc-7-access-control.md#attributes)
  * [Level codes](doc/doc-7-access-control.md#level-codes)
  * [In field templates](doc/doc-7-access-control.md#in-field-templates)
  * Cheat-sheet: `w:allowed`, `w:show:allowed`, `w:enable:allowed`

* [Action contexts](doc/doc-8-action-contexts.md) - context-aware reactions after user actions.
  * [Event-side action trigger](doc/doc-8-action-contexts.md#event-side-action-trigger)
  * [`w$action` flow](doc/doc-8-action-contexts.md#waction-flow)
  * [Related declarations](doc/doc-8-action-contexts.md#related-declarations)
  * Cheat-sheet: `w:on:X:action`, `w$action`, `$action`

* [Localization](doc/doc-9-localization.md) - dictionary-based UI translation.
  * [Dictionary](doc/doc-9-localization.md#dictionary)
  * [Phrase format](doc/doc-9-localization.md#phrase-format)
  * [Utility functions](doc/doc-9-localization.md#utility-functions)
  * [Customizing markers](doc/doc-9-localization.md#customizing-markers)
  * Cheat-sheet: `W$DICTIONARY`, `w$say`, `w$says`

* [Utilities](doc/doc-x1-utilities.md) - grouped helper APIs.
  * [Data/object helpers](doc/doc-x1-utilities.md#dataobject-helpers)
  * [DOM/query helpers](doc/doc-x1-utilities.md#domquery-helpers)
  * [Data-binding helpers](doc/doc-x1-utilities.md#data-binding-helpers)
  * [Networking and sync](doc/doc-x1-utilities.md#networking-and-sync)
  * [URL, cookie, and form helpers](doc/doc-x1-utilities.md#url-cookie-and-form-helpers)

* [Customization](doc/doc-x2-customization.md) - extension points and override strategy.
  * [Common extension points](doc/doc-x2-customization.md#common-extension-points)
  * [Practical pattern](doc/doc-x2-customization.md#practical-pattern)

### By use case

* First page template setup: [Template](doc/doc-1-template.md), [Type-handlers](doc/doc-4-type-handlers.md)
* Schema-driven generated forms/pages: [WFORM](doc/doc-wf.md)
* Button/form interaction flow: [Events](doc/doc-2-event.md), [Data binding](doc/doc-3-data-binding.md)
* Server response weaving: [Data binding](doc/doc-3-data-binding.md#server-call-wcall)
* Form validation and defaults: [Validation](doc/doc-5-validation.md), [Field templates](doc/doc-6-field-templates.md)
* Role-based screen behavior: [Access control](doc/doc-7-access-control.md)
* Reactive action contexts: [Action contexts](doc/doc-8-action-contexts.md)
* Multilingual UI text: [Localization](doc/doc-9-localization.md)
* Runtime extension and overrides: [Customization](doc/doc-x2-customization.md), [Utilities](doc/doc-x1-utilities.md)

### Full document index

Main features:

* [Template](doc/doc-1-template.md)
* [Events](doc/doc-2-event.md)
* [Data binding](doc/doc-3-data-binding.md)
* [Type-handlers and type binding](doc/doc-4-type-handlers.md)

Extended features:

* [WFORM](doc/doc-wf.md)
* [Validation](doc/doc-5-validation.md)
* [Field templates](doc/doc-6-field-templates.md)
* [Access control](doc/doc-7-access-control.md)
* [Action contexts](doc/doc-8-action-contexts.md)
* [Localization](doc/doc-9-localization.md)
* [Utilities](doc/doc-x1-utilities.md)
* [Customization](doc/doc-x2-customization.md)

## Notes

For comparison, there is a simplified demo in [demo/todo](demo/todo). Functionally similar implementations can be built in Vue/React/Angular, while WeaveworldUI keeps a browser-native and directly customizable runtime model.
