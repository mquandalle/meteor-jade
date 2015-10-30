Package.describe({
  summary: "Jade template language with inline coffeescript and Javascript support",
  version: "0.1.6",
  name: "xiphy:jade-coffee",
  git: "https://github.com/xiphias/meteor-jade-coffee.git",
  documentation: "../../README.md"
});

Package.registerBuildPlugin({
  name: "compileJadeBatch",
  use: [
    "ecmascript@0.1.0",
    "caching-compiler@1.0.0",
    "underscore@1.0.0",
    "htmljs@1.0.0",
    "minifiers@1.0.0",
    "spacebars-compiler@1.0.0",
    "xiphy:jade-compiler@0.5.2",
    "coffeescript@1.0.10"
  ],
  sources: [
    "plugin/handler.js",
  ],
  npmDependencies: {
    "coffee-script": "1.9.2"
  }

});

Package.onUse(function (api) {
  api.use("isobuild:compiler-plugin@1.0.0");
  api.use("blaze@2.0.0");
});

Package.onTest(function (api) {
  api.versionsFrom("METEOR@1.2.0.1");
  api.use("tinytest");
  api.use([
    "xiphy:jade-coffee",
    "jquery",
    "spacebars",
    "templating",
    "ui",
    "underscore",
  ]);
  api.addFiles([
    "tests/match.jade",
    "tests/match.html",
    "tests/runtime.jade",
    "tests/body.tpl.jade",
    "tests/img_tag_here.tpl.jade",
    "tests/runtimec.coffee.jade"
  ]);
  api.addFiles(["tests/match.js", "tests/runtime.js"], "client");
});
