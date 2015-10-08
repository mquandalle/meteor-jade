Package.describe({
  summary: "Compiler for the meteor-jade template language",
  version: "0.4.3",
  name: "mquandalle:jade-compiler",
  git: "https://github.com/mquandalle/meteor-jade.git",
  documentation: "../../README.md"
});

Npm.depends({
 jade: "https://github.com/mquandalle/jade/tarball/f3f956fa1031e05f85be7bc7b67f12e9ec80ba37"
});

Package.onUse(function(api) {
  api.versionsFrom("METEOR@0.9.0");
  api.use([
    'underscore',
    'htmljs',
    'html-tools',
    'blaze-tools',
    'spacebars-compiler'
  ]);
  api.use('minifiers', ['server'], { weak: true });
  api.addFiles([
    'lib/lexer.js',
    'lib/parser.js',
    'lib/transpilers.js',
    'lib/exports.js'
  ]);
  api.export('JadeCompiler');
});

Package.onTest(function (api) {
  api.versionsFrom("METEOR@0.9.0");
  api.use("tinytest");
  api.use("minifiers");
  api.use("mquandalle:jade-compiler", "server");
  api.addFiles(["tests/tests.js"], "server");
});
