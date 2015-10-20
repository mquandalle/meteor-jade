# Jade for Meteor with support for anonymous Meteor helper and event templates using inline CoffeeScript or JavaScript

This [Meteor](https://www.meteor.com/) smart package provides support for
the [Jade](http://jade-lang.com/) template engine as a Spacebars alternative with inline Javascript and Coffeescript.

With this version of meteor-jade you can cut down a lot of code. To see the simple-todos example using the jade-coffee Meteor package, see the Example code at https://github.com/xiphias/meteor-jade-coffee#example-code

## Example code

Here is how you can write the whole simple-todos app (except the unmodified css) in less than 100 lines of code, while making the app easier to maintain:

simple-todos.coffee.jade:
```jade
head
  title Todo List

body
  .container
    header
      h1 Todo List (#{Tasks.find({checked: $ne: true}).count()})
      label.hide-completed(mt-change="Session.set 'hideCompleted', event.target.checked")
        input(type="checkbox" checked="#{Session.get 'hideCompleted'}")
        | Hide Completed Tasks #{testhelper}

      +loginButtons
      if currentUser
        form.new-task
          input(type="text" name="text" placeholder="Type to add new tasks!")
    ul
      each shownTasks()
        +task
```

task.tpl.coffee.jade:
```jade
li(class="{{#if checked}}checked{{/if}} {{#if private}}private{{/if}}")
    button.delete(mt-click="Meteor.call 'deleteTask', @_id") &times;
    input(type="checkbox" checked=checked
        mt-click="Meteor.call 'setChecked', @_id, !@checked")
    if this.owner==Meteor.userId()
      button(mt-click="Meteor.call 'setPrivate', @_id, !@private")
        if private
          | Private
        else
          | Public
    span.text <strong>#{username}</strong> - #{text}
```

simple-todos.coffee:
```jade
Tasks = new (Mongo.Collection)('tasks')
@shownTasks=->
  if Session.get('hideCompleted')
    # If hide completed is checked, filter tasks
    Tasks.find { checked: $ne: true }, sort: createdAt: -1
  else
    # Otherwise, return all of the tasks
    Tasks.find {}, sort: createdAt: -1

if Meteor.isServer
  # This code only runs on the server
  # Only publish tasks that are public or belong to the current user
  Meteor.publish 'tasks', ->
    Tasks.find $or: [
      { private: $ne: true }
      { owner: @userId }
    ]
if Meteor.isClient
  # This code only runs on the client
  Meteor.subscribe 'tasks'
  Template.body.events
    'submit .new-task': (event) ->
      # Prevent default browser form submit
      event.preventDefault()
      # Get value from form element
      text = event.target.text.value
      # Insert a task into the collection
      Meteor.call 'addTask', text
      # Clear form
      event.target.text.value = ''
  Accounts.ui.config passwordSignupFields: 'USERNAME_ONLY'
Meteor.methods
  addTask: (text) ->
    # Make sure the user is logged in before inserting a task
    if !Meteor.userId()
      throw new (Meteor.Error)('not-authorized')
    Tasks.insert
      text: text
      createdAt: new Date
      owner: Meteor.userId()
      username: Meteor.user().username
  deleteTask: (taskId) ->
    task = Tasks.findOne(taskId)
    if task.private and task.owner != Meteor.userId()
      # If the task is private, make sure only the owner can delete it
      throw new (Meteor.Error)('not-authorized')
    Tasks.remove taskId
  setChecked: (taskId, setChecked) ->
    task = Tasks.findOne(taskId)
    if task.private and task.owner != Meteor.userId()
      # If the task is private, make sure only the owner can check it off
      throw new (Meteor.Error)('not-authorized')
    Tasks.update taskId, $set: checked: setChecked
  setPrivate: (taskId, setToPrivate) ->
    task = Tasks.findOne(taskId)
    # Make sure only the task owner can make a task private
    if task.owner != Meteor.userId()
      throw new (Meteor.Error)('not-authorized')
    Tasks.update taskId, $set: private: setToPrivate

```


Spacebars and Jade packages can coexist, Spacebars will continue to compile
files ending with `.html` and Jade will take care of those ending with `.jade`.

## Table of Contents

* [Installation](#installation)
* [Examples](#examples)
* [Usage](#usage)
	* [Templates](#templates)
	* [HTML Tag attributes](#html-tag-attributes)
	* [Components](#components)
* [Additional features](#additional-features)
	* [else if](#else-if)
	* [Unwrapped templates](#unwrapped-templates)
	* [Anonymous helper](#anonymous-helper)
* [Contributing](#contributing)
	* [Implementation](#implementation)
	* [License](#license)
	* [Tests](#tests)
	* [Tips](#tips)
* [Known bugs](#known-bugs)
  * [Using Jade in a package](#using-jade-in-a-package)

## Installation

Meteor-jade is installable from atmosphere, the meteor package system:

```sh
$ meteor add mquandalle:jade
```

## Examples

Meteor comes with some examples such as leaderboard or todos. You'll find jade
versions of those examples templates and even more in the
[examples directory](examples/).

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
  p This paragraph is inside my template
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

Inside a text node you can use both `{{spacebars}}` and `#{jade}` expressions
but the last one is recommended:

```jade
template(name="leaderboard")
  p Welcome #{player.name}
```

If you want to insert raw HTML you can use the `!{jade}` syntax which is
equivalent to the triple-braced `{{{spacebars}}}` expression.

### HTML Tag attributes

In Jade you define HTML Tag attributes inside parenthesis:

```jade
input(name="myName" placeholder="name" autofocus)
```

If you want to conditionally include a HTML Tag attribute you can use the
following syntax:

```jade
input(required = isRequired)
```

Where `isRequired` is a (potentially reactive) boolean defined in a template
helper. If you want to add a list of dynamic attributes use:

```jade
input($dyn = attrs)
```

Spacebars equivalent:

```html
<input {{attrs}}>
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
+myComponent(arg1 arg2 arg3 key1=val1 key2=val2)
```

Brackets are optional:

```
+myComponent arg1 arg2 arg3 key1=val1 key2=val2
```

For the four built-in components (`if`, `unless`, `each` and `with`) the `+`
is also optional:

```jade
ul
  each players
    if isSelected
      li.selected= name
    else
      li= name
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

### Unwrapped templates

Putting each template in its own separate file and naming the file
after the template it contains is becoming a followed pattern among
Meteor developers. See for instance
[this article](http://joshowens.me/how-to-organize-your-meteor-js-app/)
from Josh Owens.

But as it stands today, this pattern doesn't respect the “don't repeat yourself”
(DRY) philosophy. Indeed you have to wrap your template in a
`<template name="myTemplate>` tag and saving it in a `myTemplate.html` file,
effectively writing the name of the template twice. If those two names doesn't
match Meteor will consider the name of the `<template>` tag and will ignore the
file name. So if you follow this pattern you have to take care of keeping the
file name and the template tag name in sync (manually).

We solve this problem using a new the `.tpl.jade` file extension. With it you
can only define one template per file and you don't need to wrap your template
in a tag. The template will be named after the file name. We handle special
`head.tpl.jade` and `body.tpl.jade` templates as expected.

You can also use the `.coffee.jade` file extension for inline CoffeeScript, and the program accepts both `.coffee.tpl.jade` and `.tpl.coffee.jade` as Jade templates with inline CoffeeScript support.

### Anonymous helpers

There is experimental support for helper functions inside the templates:

```jade
if player.score > 10
  p Well done, you have #{player.score} points!

```

It can be useful for conditions (`if`, `else if` and `unless`) and inside
attributes. Anonymous helpers can't call other template helper functions though. If you want to use a helper function in multiple anonymous helpers, you have to declare it as a global function.

### Anonymous events

There is experimental support for anonymous event functions inside the templates as well:

```jade
    button.delete(mt-click="Meteor.call 'deleteTask', @_id") &times;
```

It uses the event after mt-, and uses JavaScript or CoffeeScript depending on the extension of the file. The event function can use the current object and also can access current DOM event with the event variable. 


## Contributing

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
$ meteor test-packages --test-app-path . packages/*
```

## Known bugs
This is an experimental version so there can be many unknown bugs, but the biggest problem that I know of is that the program uses a heuristic to see if the code is inline anonymous helper (that can't call other helper functions) or if it is a named Meteor helper function.
