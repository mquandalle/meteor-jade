Package.describe({
  name: "dalgard:jade",
  version: "0.5.3_1",
  summary: "Jade template engine for Meteor",
  git: "https://github.com/dalgard/meteor-jade.git",
  documentation: "../../README.md"
});

Package.registerBuildPlugin({
  name: "compileJade",
  use: [
    "underscore@1.0.0",
    "htmljs@1.0.0",
    "minifiers@1.0.0",
    "spacebars-compiler@1.0.0",
    "dalgard:jade-compiler@0.5.3_1"
  ],
  sources: [
    "plugin/handler.js",
  ]
});

Package.onUse(function (api) {
  api.use("blaze@2.0.0");
});

Package.onTest(function (api) {
  api.versionsFrom("METEOR@0.9.0");
  api.use("tinytest");
  api.use(["dalgard:jade@0.5.3_1", "ui", "underscore", "jquery", "spacebars", "templating"]);
  api.addFiles([
    "tests/match.jade",
    "tests/match.html",
    "tests/runtime.jade",
    "tests/body.tpl.jade",
    "tests/img_tag_here.tpl.jade"
  ]);
  api.addFiles(["tests/match.js", "tests/runtime.js"], "client");
});
