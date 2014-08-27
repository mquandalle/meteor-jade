var sourceHandler = function (compileStep) {

  // XXX Code copied from
  // packages/templating/plugin/compile-template.js:6
  if (! compileStep.arch.match(/^web.browser(\.|$)/))
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
  var jsContent = "";

  // Body
  if (results.body !== null) {
    jsContent += "\nTemplate.__body__.__contentParts.push(Blaze.View(";
    jsContent += "'body_content_'+Template.__body__.__contentParts.length, ";
    jsContent += SpacebarsCompiler.codeGen(results.body, { isBody: true });
    jsContent += "));\n";
    jsContent += "Meteor.startup(Template.__body__.__instantiate);\n";
  }

  // Templates
  _.forEach(results.templates, function (tree, tplName) {
    jsContent += "\nTemplate.__define__(\"" + tplName +"\", ";
    jsContent += SpacebarsCompiler.codeGen(tree, { isTemplate: true });
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

Plugin.registerSourceHandler("jade", { isTemplate: true }, sourceHandler);
