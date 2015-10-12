dalgard:jade 0.5.0
==================

This package is a fork of [`mquandalle:jade`](https://github.com/mquandalle/meteor-jade).

I don't have any ambitions of taking on the maintenance of the canonical Jade package for Meteor, but will keep this package in sync with the original.

#### Install

`meteor add dalgard:jade`

#### Rationale

The latest development on the `mquandalle:jade` package was on 29 April 2015. Judging from the lack of responsiveness in the issues forum, it looks like the project have been set on stand-by.

Until development is resumed, this package may improve things a bit in some areas, including in relation to the [`dalgard:viewmodel`](https://github.com/dalgard/meteor-viewmodel/) package.


## Changes

Although only a few lines of code have been added to the package, they enable some rather useful features.

Like the existing syntax, the new syntax comes in two variants – space separated or with parentheses. I recommend using the parenthesized version, since this is the only available style for attribute helpers.

### Arguments in extrapolation

Positional and keyword arguments have been missing from Jade's extrapolation syntax, but may now be used in one of the two mentioned forms, alleviating the need for Blaze syntax:

```jade
body
  // Space separated version – similar to Blaze
  | Hello #{person name prefix='Lord'}

  // Parenthesis version – similar to attribute helpers
  | Hello #{person(name prefix='Lord')}
```

### Arguments in attributes

Positional and keyword arguments can now also be passed to helpers that are used in attributes:

```jade
input(type='text' placeholder=person(name prefix='Lord'))
```

### Dollar sign attributes

Dynamic attributes were added to the Meteor version of Jade using the `$dyn` syntax:

```jade
input(type='text' $dyn=bind('value: value'))
```

This package introduces the concept of using a dollar sign (`$`) in front of an attribute name as a shorthand for designating a dynamic attribute helper.

These two examples are thus equivalent:

```jade
div($attr)
```

```html
<div {{attr}}></div>
```

If a *value* is set on the attribute, it becomes the first positional argument for the helper. Consequently, the `$dyn` example may be rewritten in two ways:

```jade
input(type='text' $bind='value: value')
```

Or, when more arguments are needed:

```jade
input(type='text' $bind('value: value' throttle=500))
```


## Compatibility

So far, these improvements should be considered fully backwards compatible, as the new syntax simply resulted in an error previously (with the exception of `$dyn`, which this package leaves untouched).