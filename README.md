dalgard:jade 0.4.3
==================

This is a direct fork of [`mquandalle:jade`](https://github.com/mquandalle/meteor-jade) merged with [pull request #165](https://github.com/mquandalle/meteor-jade/pull/165).

### Rationale

The latest development on the `mquandalle:jade` package was on 29 April 2015. Judging from that and the lack of responsiveness in the issues forum, it looks like development may have halted.

My ambition is not to continue development of the package, only to add the desired addition to the syntax, in order to better support the [`dalgard:viewmodel`](https://github.com/dalgard/meteor-viewmodel/) package.

### The added syntax

Dynamic attributes were added to the Meteor version of Jade using the `$dyn` syntax. However, when passing arguments to a helper, the syntax becomes cluttered:

```jade
// Old, cluttered syntax
input(type='text' $dyn='{{bind "value: value"}}')
```

The problem is having to use Spacebars curly braces syntax inside the Jade attribute syntax.

To alleviate this problem, `dalgard:jade` introduces the concept of using a dollar sign (`$`) in front of an attribute name to designate a dynamic attribute helper.

The value of the attribute becomes the first positional argument to the helper.

The example above can now be written like this:

```jade
// New, shiny syntax
input(type='text' $bind='value: value')
```

### Compatibility

I consider this addition fully backwards compatible, since attributes beginning with dollar sign were not allowed before – with the exception of `$dyn`, which this package leaves untouched.