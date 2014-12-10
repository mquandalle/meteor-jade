JadeCompiler = {
  compile: function(source, options) {
    options = options || {};
    var parser, Compiler;

    try {
      parser = new Parser(source, options.filename || "", { lexer: Lexer });
      Compiler = (options.fileMode) ? FileCompiler : TemplateCompiler;
      return new Compiler(parser.parse(), options).compile();

    } catch (err) {
      throw err;
    }
  }
};
