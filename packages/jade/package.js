Package.describe({
  summary: "Jade template language",
  version: "0.4.4",
  name: "mquandalle:jade",
  git: "https://github.com/mquandalle/meteor-jade.git",
  documentation: "../../README.md"
});

Package.registerBuildPlugin({
  name: "compileJadeBatch",
  use: [
    "underscore@1.0.0",
    "htmljs@1.0.0",
    "minifiers@1.0.0",
    "spacebars-compiler@1.0.0",
    "mquandalle:jade-compiler@0.4.4"
  ],
  sources: [
    "plugin/handler.js",
  ],
  npmDependencies: {
    "lru-cache": "2.6.4"
  }
});

Package.onUse(function (api) {
  api.use("isobuild:compiler-plugin@1.0.0");
});

Package.onUse(function (api) {
  api.use("blaze@2.0.0");
});

Package.onTest(function (api) {
  api.versionsFrom("METEOR@1.2.0.1");
  api.use("tinytest");
  api.use(["mquandalle:jade", "ui", "spacebars", "templating", "underscore", "jquery"]);
  api.addFiles([
    "tests/match.jade",
    "tests/match.html",
    "tests/runtime.jade",
    "tests/body.tpl.jade",
    "tests/img_tag_here.tpl.jade"
  ]);
  api.addFiles(["tests/match.js", "tests/runtime.js"], "client");
});
