Package.describe({
  summary: "Jade template language for Meteor",
  version: "0.1.5"
});

Package._transitional_registerBuildPlugin({
  name: "compileJade",
  use: [
    "underscore",
    "htmljs",
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
    "jade": "1.3.0",
    "markdown": "0.5.0",
  }
});

Package.on_test(function (api) {
  api.use("jade");
  api.use("tinytest");
  api.add_files("tests/tests.jade");
  api.add_files("tests/client.js", "client");
  api.add_files("tests/server.js", "server");
});
