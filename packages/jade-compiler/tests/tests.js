
var template = ["p",
                "  | hello world"].join("\n");

var wrapInTemplate = function(tplName, template) {
  return "template(name='"+tplName+"')\n  " + template.replace("\n", "\n  ");
};

Tinytest.add("JadeCompiler - parse templates", function(test) {
  test.equal(JadeCompiler.parse(template), { children: ["hello world"] });
});

Tinytest.add("JadeCompiler - parse files", function(test) {
  test.throws(
    function(){ JadeCompiler.parse(template, {fileMode: true}); },
    "Tag must be in a template on line 1");

  var template2 = wrapInTemplate("hello", template);
  test.equal(JadeCompiler.parse(template2, {fileMode: true}), {
    head: null,
    body: null,
    bodyAttrs: {},
    templates: {
      hello: { children: ["hello world"] }
    }
  });
});

Tinytest.add("JadeCompiler - compile templates", function(test) {
  test.equal(JadeCompiler.compile(template),
  "(function() {\n  return HTML.P(\"hello world\");\n})");
});

Tinytest.add("JadeCompiler - compile template with parameters in helper", function(test) {
  var template = 'p #{foo (foo "bar")}';
  test.equal(JadeCompiler.compile(template),
  "(function() {\n  return HTML.P(Blaze.View(\"lookup:foo\", function() {\n    return Spacebars.mustache(view.lookup(\"foo\"), Spacebars.dataMustache(view.lookup(\"foo\"), \"bar\"));\n  }));\n})");
});

Tinytest.add("JadeCompiler - compile template with parameters in helper on attribute", function(test) {
  var template = "p(title=foo('bar'))";
  test.equal(JadeCompiler.compile(template),
  "(function() {\n  return HTML.P({\n    title: function() {\n      return Spacebars.mustache(view.lookup(\"foo\"), \"bar\");\n    }\n  });\n})");
});
