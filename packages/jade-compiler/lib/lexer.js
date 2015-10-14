// We modify a bit the Jade grammar in order to define both user defined and
// build-in components.
//
// We save components as "Mixins" nodes. That's a good host because like
// "Mixins", components have:
// 1. a name
// 2. some arguments (optionnal)

Lexer = Npm.require("jade").Lexer;


var component_re = /^(\+[\.\w-]+|if|unless|else if|else|with|each)\b/,
    plus_re = /^\+/,
    args_re = /^\((.*)\)\s*$/m,
    singleline_re = /([^\n]*)/,
    parens_re = /(?:(['"])\1|(['"]).*?[^\\]\2)|((?:\.{1,2}\/)?[\w\.-]+)\(((?:(['"])\5|(['"]).*?[^\\]\6|[^)]*?(['"])\7|[^)]*?(['"]).*?[^\\]\8)*[^)]*)\)/g,
    multiline_re = /^\(((?:(['"])\2|(['"]).*?[^\\]\3|[^)]*[^\\](['"])\4|[^)]*?[^\\](['"]).*[^\\]\5)*[^)]*?)\)/,
    newline_re = /\n/g,
    attrs_re = /(?:(['"])\1|(['"]).*?[^\\]\2)|(!?=?[$=])((?:\.{1,2}\/)?[\w\.-]+)\(((?:(['"])\6|(['"]).*?[^\\]\7|[^)]*?(['"])\8|[^)]*?(['"]).*?[^\\]\9)*[^)]*)\)/g,
    quote_re = /(^|[^\\])'/g;

function parens_replace(match, $1, $2, helper, args) {
  if (_.isString($1) || _.isString($2))
    return match;
  
  return helper + " " + args;
}

function attrs_replace(match, $1, $2, prefix, helper, args) {
  if (_.isString($1) || _.isString($2))
    return match;

  var helper_pre = "";

  if (prefix.slice(-2) == "=$") {
    prefix = prefix.slice(0, -1);
    helper_pre = "$";
  }

  var begin = (prefix === "$" ? "$dyn='" : (prefix === "!=" ? "!='{" : "='")) + "{{",
      end = "}}" + (prefix === "!=" ? "}'" : "'");

  return begin + helper_pre + helper + " " + args.replace(quote_re, "$1\\'") + end;
}


// Blaze helper used as a component
Lexer.prototype.blazeComponent = function () {
  var key = this.input.match(component_re);

  if (key) {
    this.consume(key[0].length);

    var tok = this.tok("mixin", key[1].replace(plus_re, "")),
        is_paren = this.input.charAt(0) === "(",
        args = this.input.match(args_re),
        is_singleline = !is_paren || args;

    if (is_singleline) {
      if (!args)
        args = this.input.match(singleline_re);

      tok.args = args[1].replace(parens_re, parens_replace);
    }
    else {
      args = this.input.match(multiline_re);

      if (args)
        tok.args = args[1].replace(newline_re, "");
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
        attrs_str = this.input.slice(range.start, range.end);

    attrs_str = attrs_str.replace(attrs_re, attrs_replace);

    this.input = "(" + attrs_str + this.input.slice(range.end);
  }

  return attrs.call(this, push);
};


// Super
var next = Lexer.prototype.next;

Lexer.prototype.next = function () {
  return this.blazeComponent() || next.call(this);
};
