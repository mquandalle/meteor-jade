var sourceHandler = function (compileStep) {
  // Parse and compile the content
  try {
    var content = compileStep.read().toString('utf8');
    var results = Jade.compile(content, {filename: compileStep.inputPath});
  } catch (err) {
    return compileStep.error({
      message: "Jade syntax error: " + err.message,
      sourcePath: compileStep.inputPath
    });
  }

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
