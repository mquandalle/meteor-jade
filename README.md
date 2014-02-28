# Jade for Meteor [![Build Status](https://travis-ci.org/mquandalle/meteor-jade.png?branch=master)](https://travis-ci.org/mquandalle/meteor-jade)

This [Meteor](https://www.meteor.com/) smart package provides support for
the [Jade](http://jade-lang.com/) template engine as a Spacebars alternative.

Spacebars and Jade package can coexist, Spacebars will continue to compile files
ending with `.html` and Jade will take care of those ending with `.jade`.

## Installation

> *Warning*: This package is made for the new **Meteor UI** system, which is not
released as a stable version yet. You'll need to run the `blaze-rc0` release.

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

Meteor-jade basically works like pure Jade, so if you never use Jade before you
should take a look at the [documentation](http://jade-lang.com/reference/).

There are some specifics rules relative to the Meteor way of handling templates.
These rules are mostly the same as the Spacebars ones.

### Templates

Every HTML tag must be in a template. You can define a template with the
following syntax:

```jade
template(name="myTemplate")
  p This paragraphe is inside my template
```

There are two particular templates that are automatically rendered inside the
DOM: `head` and `body`. If you want to include a template inside another,
precede its name by the `+` symbol:

```jade
head
  title Leaderboard

body
  +leaderboard
  //- This is equivalent to {{> leaderboard}}
```

Inside a text node you can use both `{{handlebars}}` and `#{jade}` expressions
but the last one is recommended:

```jade
template(name="leaderboard")
  p Welcome #{player.name}
```

### Components

As you may already know, Meteor templates are "components" as well. To use a
template as a component, you simply have to provide a `content` block and
optionally a `elseContent` block after the inclusion:

```jade
body
  +ifEven(value=2)
    | Hello world
  else
    | Bye world

  //-
    This is the equivalent of:
    {{#ifEven value=2}}
      Hello world
    {{else}}
      Bye world
    {{/ifEven}}
    ifEven is a component defined by the user
    See the complete example in ./examples/components.jade
```

Like with Spacebars, a component can receive both ordered and keywords
arguments. Keywords arguments must be written after the ordered ones:

```
+myComponent(arg1, arg2, arg3, key1=val1, key2=val2)
```

Brackets are optional:

```
+myComponent arg1, arg2, arg3, key1=val1, key2=val2
```

For the four build-in components (`if`, `unless`, `each` and `with`) the `+`
is also optional:

```jade
ul
  each players
    if isSelected
      li.selected= name
    else
      li= name
```

[Learn more about components](https://github.com/meteor/meteor/wiki/New-Template-Engine-Preview#new-pattern-for-defining-custom-block-helpers)

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
div(class = !isSelected && "hidden")
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
rules specifics to the Meteor components model. Then we use the Jade parser
which returns a syntax tree that we transform to make it compatible with the
Meteor format. We finally rely on the Spacebars compiler to generate the
JavaScript code sent to the client.

Everything is executed at bundle time.

### License

This code is published under the [MIT license](LICENSE).

### Tests

Use the following command to run the tests:

```
$ mrt test-packages ./
```

### Tips

If you want to buy me a beer, I proudly accept bitcoin tips:
[1Jade7Fscsx2bF13iFVVFvcSUhe7eLJgSy](https://blockchain.info/address/1Jade7Fscsx2bF13iFVVFvcSUhe7eLJgSy)
