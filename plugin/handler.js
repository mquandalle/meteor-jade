var sourceHandler = function (compileStep) {
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
  var jsContent = "";
  var codeGen = SpacebarsCompiler.codeGen;

  // Body
  if (results.body !== null) {
    jsContent += "\nTemplate.body.addContent(";
    jsContent += codeGen(results.body, { isBody: true, sourceName: "<body>"});
    jsContent += ");\n";
    jsContent += "Meteor.startup(Template.body.renderToDocument);\n";
  }

  // Templates
  _.forEach(results.templates, function (tree, tplName) {
    var nameLiteral = JSON.stringify(tplName);
    var templateDotNameLiteral = JSON.stringify("Template." + tplName);
    jsContent += "\nTemplate.__checkName(" + nameLiteral + ");";
    jsContent += "\nTemplate[" + nameLiteral + "] = new Template(";
    jsContent += templateDotNameLiteral + ", ";
    jsContent += codeGen(tree, { isTemplate: true });
    jsContent += ");\n";
  });

  if (jsContent !== "") {
    compileStep.addJavaScript({
      path: compileStep.inputPath + '.js',
      sourcePath: compileStep.inputPath,
      data: jsContent
    });
  }
};

Plugin.registerSourceHandler("jade", {
  isTemplate: true,
  archMatching: "web"
}, sourceHandler);
