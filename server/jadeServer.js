jade = {
  compile: function(content, filename) {
    if (!filename)
      filename='(content)';

    try {
      var parser = new Parser(content, filename, { lexer: Lexer });
      var results = new Compiler(parser.parse()).compile();
    } catch (err) {
      // TODO, something smart :)
      throw err;
    }

    return results;
  }
};
