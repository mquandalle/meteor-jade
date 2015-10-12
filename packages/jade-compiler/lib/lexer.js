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
  var tok, argRegex;
  var captureComponentName = /^\+([\.\w-]+) */.exec(self.input);
  if (captureComponentName) {
    self.consume(captureComponentName[0].length);
    tok = self.tok('mixin', captureComponentName[1]);
    // Case 1: with parenthesis
    if (self.input[0] === "(") {
      // We capture everything until the closing parenthese. We do not want to
      // match a closing parenthese if we are inside a string literal, ie
      // inside quotes, ie the number of quotes before the parenthis is even.
      // We use regexp look ahead to model this condition.
      // see http://stackoverflow.com/a/6464500/1652064
      argRegex = /^\([\s\S]*?\)(?=(([^"]*"){2})*[^"]*$)/m;
    // Case 2: no arguments or arguments without parenthesis (on a single line)
    } else {
      argRegex = /[^\n]*/;
    }
    var capturesArgs = argRegex.exec(self.input);
    self.consume(capturesArgs[0].length);
    tok.args = unwrap(capturesArgs[0]);
    return tok;
  }
};


// Super method
var attrs = Lexer.prototype.attrs;

// Make attributes accept Blaze helper expressions inside parentheses
Lexer.prototype.attrs = function (push) {
  if (this.input.charAt(0) === "(") {
    var range = this.bracketExpression(),
        attrs_str = this.input.slice(range.start, range.end),
        regex = /(!?[$=])((?:\.{1,2}\/)?[\w\.-]+)\(((?:(['"])\4|(['"]).*?[^\\]\5|[^)]*[^\\](['"])\6|[^)]*?[^\\](['"]).*[^\\]\7)*[^)]*?)\)/g;

    attrs_str = attrs_str.replace(regex, function (match, prefix, helper, args) {
      var begin = (prefix === "$" ? "$dyn='" : (prefix === "!=" ? "!='{" : "='")) + "{{",
          end = "}}" + (prefix === "!=" ? "}'" : "'");

      return begin + helper + " " + args.replace(/(^|[^\\])'/g, "$1\\'") + end;
    });

    this.input = "(" + attrs_str + this.input.slice(range.end);
  }

  return attrs.call(this, push);
};


// Register the two rules above
var _super = Lexer.prototype.next;
Lexer.prototype.next = function () {
  var self = this;
  return self.builtInComponents() ||
         self.userComponents() ||
         _super.call(self);
};
