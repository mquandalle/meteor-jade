Package.describe({
  summary: "Jade template language",
  version: "0.3.0",
  name: "mquandalle:jade",
  git: "https://github.com/mquandalle/meteor-jade.git"
});

Package.registerBuildPlugin({
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

Npm.depends({
  "jade": "https://github.com/mquandalle/jade/tarball/f3f956fa1031e05f85be7bc7b67f12e9ec80ba37"
});

Package.onUse(function(api) {
  api.versionsFrom("METEOR@0.9.0");
  api.use(['underscore','htmljs','html-tools','spacebars-compiler'], 'server');
  api.addFiles(['plugin/lexer.js','plugin/parser.js','plugin/compiler.js'], 'server');
  api.addFiles('server/jadeServer.js', 'server');
  api.export('jade', 'server');
});

Package.onTest(function (api) {
  api.versionsFrom("METEOR@0.9.0");
  api.use("tinytest");
  api.use(["mquandalle:jade", "ui", "spacebars", "templating"]);
  api.addFiles(["tests/match.jade", "tests/match.html", "tests/runtime.jade"]);
  api.addFiles(["tests/match.js", "tests/runtime.js"], "client");
});
