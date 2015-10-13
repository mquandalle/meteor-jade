// We modify a bit the Jade grammar in order to define both user defined and
// build-in components.
//
// We save components as "Mixins" nodes. That's a good host because like
// "Mixins", components have:
// 1. a name
// 2. some arguments (optionnal)

Lexer = Npm.require("jade").Lexer;


// Blaze helper used as a component
Lexer.prototype.blazeComponent = function () {
  var key = this.input.match(/^(\+[\.\w-]+|if|unless|else if|else|with|each)\b/);

  if (key) {
    this.consume(key[0].length);

    var tok = this.tok("mixin", key[1].replace(/^\+/, "")),
        is_paren = this.input.charAt(0) === "(",
        args = this.input.match(/^\((.*)\)\s*$/m),
        is_singleline = !is_paren || args;

    if (is_singleline) {
      if (!args)
        args = this.input.match(/([^\n]*)/);

      var parens_re = /(?:(['"])\1|(['"]).*?[^\\]\2)|((?:\.{1,2}\/)?[\w\.-]+)\(((?:(['"])\5|(['"]).*?[^\\]\6|[^)]*(['"])\7|[^)]*(['"]).*?[^\\]\8)*[^)]*)\)/g;

      tok.args = args[1].replace(parens_re, function (match, $1, $2, helper, args) {
        if (_.isString($2))
          return match;
        
        return helper + " " + args;
      });
    }
    else {
      var multi_re = /^\(((?:(['"])\2|(['"]).*?[^\\]\3|[^)]*[^\\](['"])\4|[^)]*?[^\\](['"]).*[^\\]\5)*[^)]*?)\)/;

      args = this.input.match(multi_re);

      if (args)
        tok.args = args[1].replace(/\n/g, "");
    }

    this.consume(args[0].length);

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
