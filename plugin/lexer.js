// We modify a bit the Jade grammar in order to define both user defined and
// build-in components.
//
// We save components as "Mixins" nodes. That's a good host because like
// "Mixins", components have:
// 1. a name
// 2. some arguments (optionnal)

Lexer = Npm.require('jade').Lexer;

// Build-in components
Lexer.prototype.builtInComponents = function () {
  var self = this;
  var tok;
  var captures = /^(if|unless|else if|else|with|each)\b([^\n]*)/.exec(self.input);
  if (captures) {
    self.consume(captures[0].length);
    tok = self.tok('mixin', captures[1]);
    tok.args = captures[2];
    return tok;
  }
};

// User components, uses the syntax `+componentName(arguments)`
Lexer.prototype.userComponents = function () {
  var self = this;
  var tok;
  var captures = /^\+([\.\w-]+)\b(\(?(.+)\)?)?/.exec(self.input);
  if (captures) {
    self.consume(captures[0].length);
    tok = self.tok('mixin', captures[1]);
    tok.args = captures[3] || "";
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
