Package.describe({
  summary: "Jade template language",
  version: "0.2.9",
  name: "mquandalle:jade",
  git: "https://github.com/mquandalle/meteor-jade.git"
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
    "plugin/compiler.js",
    "plugin/handler.js",
  ],
  npmDependencies: {
    "jade": "https://github.com/mquandalle/jade/tarball/f3f956fa1031e05f85be7bc7b67f12e9ec80ba37"
  }
});

Package.onTest(function (api) {
  api.versionsFrom("METEOR@0.9.0");
  api.use("tinytest");
  api.use(["mquandalle:jade", "ui", "spacebars", "templating"]);
  api.addFiles(["tests/match.jade", "tests/match.html", "tests/runtime.jade"]);
  api.addFiles(["tests/match.js", "tests/runtime.js"], "client");
});
