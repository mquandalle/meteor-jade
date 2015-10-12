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
    return value.replace(/^\((.+?)\)$/, "$1").trim();
};

// Blaze helper used as a component
Lexer.prototype.blazeComponent = function () {
  var self = this;
  var tok;
  var captures = /^(\+[\.\w-]+|if|unless|else if|else|with|each)\b(.*)/.exec(self.input);
  if (captures) {
    self.consume(captures[0].length);
    tok = self.tok('mixin', captures[1].replace(/^\+/, ""));
    tok.args = unwrap(captures[2]);

    var regex = /((?:\.{1,2}\/)?[\w\.-]+)\(((?:(['"])\3|(['"]).*?[^\\]\4|[^)]*[^\\](['"])\5|[^)]*?[^\\](['"]).*[^\\]\6)*[^)]*?)\)/g;

    tok.args = tok.args.replace(regex, function (match, helper, args) {
      return helper + " " + args;
    });

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


// Super
var next = Lexer.prototype.next;

Lexer.prototype.next = function () {
  return this.blazeComponent() || next.call(this);
};
