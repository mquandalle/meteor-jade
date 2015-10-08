var codeGen = SpacebarsCompiler.codeGen;

JadeCompiler = {
  parse: function(source, options) {
    options = options || {};
    var parser, Compiler;

    try {
      parser = new Parser(source, options.filename || "", { lexer: Lexer });
      Compiler = (options.fileMode) ? FileCompiler : TemplateCompiler;
      compiled = new Compiler(parser.parse(), options).compile();
      return compiled;

    } catch (err) {
      throw err;
    }
  },

  preparse: function(source, options) {
    options = options || {};
    var parser, Compiler;

    try {
      parser = new Parser(source, options.filename || "", { lexer: Lexer });
      return parser.parse();

    } catch (err) {
      throw err;
    }
  },

  compile: function(source) {
    var ast = JadeCompiler.parse(source, { fileMode: false });
    return codeGen(ast);
  }
};
