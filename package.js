Package.describe({
  summary: "Jade template language for Meteor",
  version: "0.2.0"
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
    "jade": "https://github.com/mquandalle/jade/tarball/f3f956fa1031e05f85be7bc7b67f12e9ec80ba37",
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
