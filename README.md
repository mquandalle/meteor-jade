# Jade for Meteor [![Build Status](https://travis-ci.org/mquandalle/meteor-jade.png?branch=master)](https://travis-ci.org/mquandalle/meteor-jade)

This [Meteor](https://www.meteor.com/) smart package provides support for
the [Jade](http://jade-lang.com/) template engine as a Spacebars alternative.

Spacebars and Jade package can coexist, Spacebars will continue to compile files
ending with `.html` and Jade will take care of those ending with `.jade`.

## Installation

> *Warning*: This package is made for the new **Meteor UI** system, which is not
released as a stable version yet. You'll need to run the latest preview
`template-engine-preview-11` or the `shark` branch of the Meteor repository.

This package is available on [atmosphere](https://atmosphere.meteor.com/) so you
can install it with [meteorite](http://oortcloud.github.io/meteorite/):

```sh
mrt add jade
```

## Examples

Meteor comes with some examples such as
[leaderboard](https://www.meteor.com/examples/leaderboard) or
[todos](https://www.meteor.com/examples/todos). You'll find jade versions of
thoses examples templates and even more in the [examples directory](examples/).

## Usage

You can define a template with the following syntax:

```jade
template(name="myTemplateA")
  p This is more the Meteor-way
```

If you want to include a template inside another, use the following syntax:

```jade
body
  //- This is equivalent to {{> leaderboard}}
  +leaderboard
```

You can provide a `content` block and optionnaly an `elseContent` block to any
component: 
[see the Meteor UI wiki page](https://github.com/meteor/meteor/wiki/New-Template-Engine-Preview#new-pattern-for-defining-custom-block-helpers)

```jade 
body
  //- 
    ifEven is a user defined component
    This is the equivalent of:
    {{#ifEven value=2}}
      2 is even
    {{else}}
      2 is odd
    {{/ifEven}}

  +ifEven(value=2)
    | 2 is even
  else
    | 2 is odd
```

For the build-in components (`if`, `unless`, `each` and `with`) you don't need
to write the `+` symbol before invocation:

```jade
ul
  each players
    if isSelected
      li.selected= name
    else
      li= name
```

Inside a text node you can use both `{{handlebars}}` and `#{jade}` expressions.

### Load order issue

If you encouter an error such as

> Cannot set property 'xxx' of undefined

This is probably a file load order issue. Meteor uses
[a hack](https://github.com/meteor/meteor/blob/ae67643a3f2de0dd9fb8db7f7bd8e1c6fe2ba285/tools/files.js#L42)
in order to push `html` files ahead of everything else. It's not possible for
a package to register an extension name to benefit of the same behavior yet.

What you can do, as a temporary solution, is to rename your `myfile.jade`, into
`myfile.jade.html`. This package will continue to compile it like before, and
the Meteor hack will push the file before your code.

## Missing features

### Components inside tags

In Spacebars you can use any component inside a tag argument:

```html
<div class="{{#if isSelected}}selected{{/if}}"></div>
<div class="{{#unless isSelected}}hidden{{/unless}}"></div>
<div class="{{#if isSelected}}visible{{else}}hidden{{/if}}"></div>
<div class={{#each classes}}this{{/each}}></div>
<input {{#if isRequired}}required{{/if}}>
<input {{attrs}}>
```

It's not possible yet to do this kind of things with Jade. Here are the planned
syntaxes:

```jade
div(class = isSelected && "selected")
div(class = isSelected || "hidden")
div(class = isSelected ? "visible" : "hidden")
div(class = if isSelected: "visible" else: "hidden")
div(class = each classes: this)
input(required = isRequired)
input($dyn = attrs) // This one is already working
```

## Additional features

We have some additional features over Spacebars.

### else if

We provide syntaxic sugar so you can write:

```jade
if user.isAdmin
  h1 Hello admin
else if user.isConnected
  h1 Hello user
else
  h1 Hello visitor
```

Instead of:

```jade
if user.isAdmin
  h1 Hello admin
else
  if user.isConnected
    h1 Hello user
  else
    h1 Hello visitor
```

Under the hood, those two codes are compiled to the same abstract tree, so there
are no runtime performance hit.

### Server-side filters

It is possible to use server-side filters in order to use a specific compiler
for a particular block. For now `:markdown` is the only filter supported.

```jade
body
  :markdown
    # I love writing my docs in markdown

    * Let's compile this text on the server
    * So the client doesn't have to do it
```

The difference with the `+markdown` block helper is that the compilation is done
on the server, not the client.

### Anonymous helper

This one is not implemented yet but I'd like to write such kind of things:

```jade
if player.score > 10
  p Well done!
```

It'll be useful for conditions (`if`, `else if` and `unless`) and inside
attributes (see the [Components inside tags section](#components-inside-tags)).

See [related issue](https://github.com/mquandalle/meteor-jade/issues/1)

## Contribute

Contributions are welcome, whether it is for a
[bug report](https://github.com/mquandalle/meteor-jade/issues/new), a fix or a
new functionnality proposition.

### Implementation

This package use the Jade lexer to define the grammar, we just add a few customs
rules for the components managment. Then we use the Jade parser which returns a
syntax tree that we adapt to make it compatible with the Meteor format. We
finally rely on the Spacebars compiler to generate the javascript code.

Everything is executed at bundle time.

### Donations

This code is published under the [MIT license](LICENSE).

If you want to buy me a beer, I proudly accept bitcoin donations:
[1Jade7Fscsx2bF13iFVVFvcSUhe7eLJgSy](https://blockchain.info/address/1Jade7Fscsx2bF13iFVVFvcSUhe7eLJgSy)
