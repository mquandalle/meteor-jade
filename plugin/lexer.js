// We need do modify a little the classical Jade grammar in order to define
// both user defined and build-in components.
// 
// Components are saved as "Mixin" objects. The args parameter contains:
//   * `kind` the kind of the component (if, with, each...)
//   * `args` a string of the parameters on the line
//   
// XXX It would be better to define a "Component" node. The problem is that it's
// not possible to provide a custom list of nodes to the jade parser yet (as of
// 1.1.5)

Lexer = Npm.require('jade').Lexer;

// Build-in components
Lexer.prototype.builtInComponents = function () {
  var self = this;
  var captures;
  if (captures = /^(if|unless|else if|else|with|each)\b([^\n]*)/.exec(self.input)) {
    self.consume(captures[0].length);
    var tok  = self.tok('mixin', captures[1]);
    tok.args = {kind: captures[1], args: captures[2]};
    return tok;
  }
};

// User components, uses the syntax `+componentName(arguments)`
Lexer.prototype.userComponents = function () {
  var self = this;
};

// Register the two rules above
var _super = Lexer.prototype.next;
Lexer.prototype.next = function () {
  var self = this;
  return self.builtInComponents()
    || self.userComponents()
    || _super.call(self);
};
