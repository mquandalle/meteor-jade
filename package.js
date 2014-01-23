Package.describe({
  summary: "HTML dialect with fewer braces and semicolons"
});

Package._transitional_registerBuildPlugin({
  name: "compileJade",
  use: [
    "underscore",
    "html-tools",
    "spacebars-compiler",
  ],
  sources: [
    "plugin/lexer.js",
    "plugin/parser.js",
    "plugin/filters.js",
    "plugin/compiler.js",
    "plugin/handler.js",
  ],
  npmDependencies: {
    "jade": "1.1.5",
    "markdown": "0.5.0",
  }
});
