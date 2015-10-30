Package.describe({
  summary: "Compiler for the meteor-jade template language with inline anonymous helpers and events support",
  version: "0.5.2",
  name: "xiphy:jade-compiler",
  git: "https://github.com/xiphias/meteor-jade.git",
  documentation: "../../README.md"
});

Npm.depends({
  jade: "https://github.com/mquandalle/jade/tarball/f3f956fa1031e05f85be7bc7b67f12e9ec80ba37"
});

Package.onUse(function(api) {
  api.versionsFrom("METEOR@1.2.0.1");
  api.use([
    'ecmascript',
    'underscore',
    'htmljs',
    'html-tools',
    'blaze-tools',
	'coffeescript',
    'spacebars-compiler'
  ], ['server']);
  api.use('minifiers', ['server'], { weak: true });
  api.addFiles([
    'lib/lexer.js',
    'lib/parser.js',
    'lib/transpilers.js',
    'lib/exports.js'
  ], ['server']);
  api.export('JadeCompiler');
});

Package.onTest(function (api) {
  api.versionsFrom("METEOR@1.2.0.1");
  api.use("tinytest");
  api.use("minifiers");
  api.use("ecmascript")
  api.use("underscore")
  api.use("xiphy:jade-compiler", "server");
  api.addFiles(["tests/tests.js"], "server");
});
