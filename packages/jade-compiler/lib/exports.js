Jade = {
  compile: function(source, options) {
    options = options || {};
    var parser, results;

    try {
      parser = new Parser(source, options.filename || "", { lexer: Lexer });
      if (_.isUndefined(options.filename))
        results = new TemplateCompiler(parser.parse()).compile();
      else
        results = new FileCompiler(parser.parse(), options.filename).compile();

    } catch (err) {
      throw err;
    }

    return results;
  }
};
