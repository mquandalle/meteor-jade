// We modify a bit the Jade grammar in order to define both user defined and
// build-in components.
//
// We save components as "Mixins" nodes. That's a good host because like
// "Mixins", components have:
// 1. a name
// 2. some arguments (optionnal)

Lexer = Npm.require('jade').Lexer;

// XXX Remove this function when inline JavaScript expression support lands
var unwrap = function (value) {
  if (_.isString(value) && value.trim())
    return /^\(?(.+?)\)?$/m.exec(value.replace(/\n/g, "").trim())[1];
};

// Build-in components
Lexer.prototype.builtInComponents = function () {
  var self = this;
  var tok;
  var captures = /^(if|unless|else if|else|with|each)\b(.*)/.exec(self.input);
  if (captures) {
    self.consume(captures[0].length);
    tok = self.tok('mixin', captures[1]);
    tok.args = unwrap(captures[2]);
    return tok;
  }
};

// User components, uses the syntax `+componentName(arguments)`. Arguments may
// be written on several lines. Parenthesis are optional.
Lexer.prototype.userComponents = function () {
  var self = this;
  var tok;
  var captureComponentName = /^\+([\.\w-]+) */.exec(self.input);
  if (captureComponentName) {
    self.consume(captureComponentName[0].length);
    tok = self.tok('mixin', captureComponentName[1]);
    // Case 1: with parenthesis
    // this is hacky because if a user use a closing bracket `)` in the text
    // value of an argument, the lexer will consider it as the end of the
    // component, and the parsing will fail... see #85
    if (self.input[0] === "(") {
      var capturesArgs = /^\([^\)]+\)?/m.exec(self.input);
    // Case 2: empty or arguments without parenthesis (on a single line)
    } else {
      var capturesArgs = /[^\n]*/.exec(self.input);
    }
    self.consume(capturesArgs[0].length);
    tok.args = unwrap(capturesArgs[0]);
    return tok;
  }
};

// Register the two rules above
var _super = Lexer.prototype.next;
Lexer.prototype.next = function () {
  var self = this;
  return self.builtInComponents() ||
         self.userComponents() ||
         _super.call(self);
};
