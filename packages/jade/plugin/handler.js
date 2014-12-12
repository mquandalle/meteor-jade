var path = Npm.require('path');
var codeGen = SpacebarsCompiler.codeGen;

var bodyGen = function (tpl) {
  var res = "";
  res += "\nTemplate.body.addContent(";
  res += codeGen(tpl, { isBody: true, sourceName: "<body>"});
  res += ");\n";
  res += "Meteor.startup(Template.body.renderToDocument);\n";
  return res;
};

var templateGen = function (tree, tplName) {
  var nameLiteral = JSON.stringify(tplName);
  var templateDotNameLiteral = JSON.stringify("Template." + tplName);
  var res = "";
  res += "\nTemplate.__checkName(" + nameLiteral + ");";
  res += "\nTemplate[" + nameLiteral + "] = new Template(";
  res += templateDotNameLiteral + ", ";
  res += codeGen(tree, { isTemplate: true });
  res += ");\n";
  return res;
};

var getCompilerResult = function (compileStep, fileMode) {
  var content = compileStep.read().toString('utf8');
  try {
    return JadeCompiler.parse(content, {
      filename: compileStep.inputPath,
      fileMode: fileMode
    });
  } catch (err) {
    return compileStep.error({
      message: "Jade syntax error: " + err.message,
      sourcePath: compileStep.inputPath
    });
  }
}

var fileModeHandler = function (compileStep) {
  var results = getCompilerResult(compileStep, true);

  // Head
  if (results.head !== null) {
    compileStep.appendDocument({
      section: "head",
      data: HTML.toHTML(results.head)
    });
  }

  var jsContent = "";
  if (results.body !== null) {
    jsContent += bodyGen(results.body);
  }
  if (! _.isEmpty(results.templates)) {
    jsContent += _.map(results.templates, templateGen).join("");
  }

  if (jsContent !== "") {
    compileStep.addJavaScript({
      path: compileStep.inputPath + '.js',
      sourcePath: compileStep.inputPath,
      data: jsContent
    });
  }
};

var templateModeHandler = function (compileStep) {
  var result = getCompilerResult(compileStep, false);
  var templateName = path.basename(compileStep.inputPath, '.tpl.jade');
  var jsContent;

  if (templateName === "head") {
    compileStep.appendDocument({
      section: "head",
      data: HTML.toHTML(result)
    });

  } else {

    if (templateName === "body")
      jsContent = bodyGen(result);
    else
      jsContent = templateGen(result, templateName);

    compileStep.addJavaScript({
      path: compileStep.inputPath + '.js',
      sourcePath: compileStep.inputPath,
      data: jsContent
    });
  }
};

var pluginOptions = {
  isTemplate: true,
  archMatching: "web"
};

Plugin.registerSourceHandler("jade", pluginOptions, fileModeHandler);
Plugin.registerSourceHandler("tpl.jade", pluginOptions, templateModeHandler);
