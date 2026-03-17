# WeaveworldUI - Localization #

Weaveworld includes lightweight dictionary-based localization.

## Dictionary ##

Define translations in `W$DICTIONARY`:

```js
W$DICTIONARY = {
  HELLO: "Hello",
  SAVE: "Save",
};
```

## Phrase format ##

Localized phrases can be embedded in text using markers:

* begin: `W$SAY_BEGIN` (default `\u00A7`)
* end: `W$SAY_END` (default `\u00A7`)
* key/default separator: `W$SAY_CODE` (default `|`)

Examples:

* `\u00A7HELLO\u00A7` -> dictionary lookup for `HELLO`
* `\u00A7SAVE|Save now\u00A7` -> dictionary lookup, with default fallback text
* `\u00A7|Raw text\u00A7` -> explicit literal/default text

## Utility functions ##

* `w$say(key [,default])` -> translate one key
* `w$says(text)` -> translate all embedded phrases in text

## Where localization is applied ##

During template initialization/parsing, Weaveworld applies `w$says(...)` to:

* attribute values
* text node contents
* localized template comments (for example `!w:css!` / `!w:script!` content)

Validation warnings/messages set through `_w*` and `_m*` are also passed through `w$say(...)`.

## Customizing markers ##

You can redefine markers before initialization:

```js
W$SAY_BEGIN = "{{";
W$SAY_END = "}}";
W$SAY_CODE = "|";
```
