var path = Npm.require('path');

// XXX Handle body attributes
var bodyGen = function (tpl, attrs) {
  var res = "";
  if (attrs !== {}) {
    res += "\nMeteor.startup(function() { $('body').attr(";
    res += JSON.stringify(attrs) + "); });\n";
  }
  res += "\nTemplate.body.addContent(";
  res += SpacebarsCompiler.codeGen(tpl, {
    isBody: true,
    sourceName: "<body>"
  });
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
  res += SpacebarsCompiler.codeGen(tree, {
    isTemplate: true,
    sourceName: 'Template "' + tplName + '"'
  });
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
};

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
    jsContent += bodyGen(results.body, results.bodyAttrs);
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
