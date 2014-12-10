
var template = ["p",
                "  | hello world"].join("\n");

var wrapInTemplate = function(tplName, template) {
  return "template(name='"+tplName+"')\n  " + template.replace("\n", "\n  ");
};

Tinytest.add("JadeCompiler - Templates compilation", function(test) {
  test.equal(JadeCompiler.compile(template), { children: ["hello world"] });
});

Tinytest.add("JadeCompiler - Files compilation", function(test) {
  test.throws(
    function(){ JadeCompiler.compile(template, {fileMode: true}) },
    "Tag must be in a template on line 1");

  var template2 = wrapInTemplate("hello", template);
  test.equal(JadeCompiler.compile(template2, {fileMode: true}), {
    head: null,
    body: null,
    templates: {
      hello: { children: ["hello world"] }
    }
  });
});
