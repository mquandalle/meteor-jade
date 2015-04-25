Package.describe({
  summary: "Jade template language",
  version: "0.4.2",
  name: "mquandalle:jade",
  git: "https://github.com/mquandalle/meteor-jade.git",
  documentation: "../../README.md"
});

Package.registerBuildPlugin({
  name: "compileJade",
  use: [
    "underscore@1.0.0",
    "htmljs@1.0.0",
    "minifiers@1.0.0",
    "spacebars-compiler@1.0.0",
    "mquandalle:jade-compiler@0.4.2"
  ],
  sources: [
    "plugin/handler.js",
  ]
});

Package.onTest(function (api) {
  api.versionsFrom("METEOR@0.9.0");
  api.use("tinytest");
  api.use(["mquandalle:jade", "ui", "spacebars", "templating"]);
  api.addFiles([
    "tests/match.jade",
    "tests/match.html",
    "tests/runtime.jade",
    "tests/body.tpl.jade",
    "tests/img_tag_here.tpl.jade"
  ]);
  api.addFiles(["tests/match.js", "tests/runtime.js"], "client");
});
