var sourceHandler = function (compileStep) {

  // XXX Code copied from
  // packages/templating/plugin/compile-template.js:6
  if (! compileStep.arch.match(/^browser(\.|$)/))
    return;

  // Parse and compile the content
  var content = compileStep.read().toString('utf8');
  var parser  = new Parser(content, compileStep.inputPath, { lexer: Lexer });
  var results = new Compiler(parser.parse()).compile();

  // Head
  if (results.head !== null) {
    compileStep.appendDocument({
      section: "head",
      data: HTML.toHTML(results.head)
    });
  }

  // Generate the final js file
  // XXX generate a source map
  var content = "";

  // Body
  if (results.body !== null) {
    content += "\nUI.body.contentParts.push(UI.Component.extend({";
    content += "render: " + Spacebars.codeGen(results.body, { isBody: true });
    content += "}));\n";
    content += "\nMeteor.startup(function () { if (! UI.body.INSTANTIATED) {\n";
    content += "  UI.body.INSTANTIATED = true; UI.materialize(UI.body, document.body);\n";
    content += "}});\n";
  }

  // Templates
  _.forEach(results.templates, function (tree, tplName) {
    content += "\nTemplate.__define__(\"" + tplName +"\", ";
    content += Spacebars.codeGen(tree, { isTemplate: true });
    content += ");\n";
  });

  if (content !== "") {
    compileStep.addJavaScript({
      path: compileStep.inputPath + '.js',
      sourcePath: compileStep.inputPath,
      data: content
    });
  }
}

Plugin.registerSourceHandler("jade", { isTemplate: true }, sourceHandler);

// Backward compatibility with Meteor <= 0.8
// XXX This is related to the following Meteor hack:
// https://github.com/meteor/meteor/blob/ae67643a3f2de0dd9fb8db7f7bd8e1c6fe2ba285/tools/files.js#L42
Plugin.registerSourceHandler("jade.html", sourceHandler);
