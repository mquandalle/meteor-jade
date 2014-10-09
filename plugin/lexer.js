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
// be written on several lines
Lexer.prototype.userComponents = function () {
  var self = this;
  var tok;
  // XXX this is hacky because if a user use a closing bracket `)` in the text
  // value of an argument, the lexer will consider it as the end of the
  // component, and the parsing will fail...
  var captures = /^\+([\.\w-]+) *(\([^\)]+\))?/m.exec(self.input);
  if (captures) {
    self.consume(captures[0].length);
    tok = self.tok('mixin', captures[1]);
    tok.args = unwrap(captures[2]) || "";
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
