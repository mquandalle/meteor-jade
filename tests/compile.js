// XXX Test the compilation step
// XXX Test first level restrictions

var compile = function(str) {
  var tree = Parser.parse(str);
  return Compiler.compile(tree);
};

var i = function(n) {
  return "\n" + Array(n || 1).join("  ");
};

// Because of the first level restrictions
var wrapTestInTemplates = function(testFunc, tpl, expectedTree, msg) {
  tpl = "template(name='test')" + tpl.replace(/\n/g, i());
  actualTree = compile(tpl).templates.test;
  testFunc(actualTree, expectedTree, msg);
};
