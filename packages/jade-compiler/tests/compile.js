
var template = ["p",
                "  | hello world"].join("\n");

var wrapInTemplate = function(tplName, template) {
  return "template(name='"+tplName+"')\n  " + template.replace("\n", "\n  ");
};

Tinytest.add("Jade-Compiler - Templates compilation", function(test) {
  test.equal(Jade.compile(template), { children: ["hello world"] });
});

Tinytest.add("Jade-Compiler - Files compilation", function(test) {
  test.throws(
    function(){ Jade.compile(template, {filename: ""}) },
    "Tag must be in a template on line 1");

  var template2 = wrapInTemplate("hello", template);
  test.equal(Jade.compile(template2, {filename: ""}), {
    head: null,
    body: null,
    templates: {
      hello: { children: ["hello world"] }
    }
  });
});
