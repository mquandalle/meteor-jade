var path = Npm.require('path');
var coffee = Npm.require('coffee-script');

var jsPrecompiler=function(source) {
  return source;
}

var coffeePrecompiler = function(code) {

  var options = {
    bare: true,
    //inline: true,
  };

  compiled = coffee.compile(code, options);
  console.log("Compiled: ", compiled)
  return compiled;
}

// Generate event function
var templateEventsGen = function(events, tplName, preCompiler) {
  var nameLiteral = JSON.stringify(tplName);
  var templateDotNameLiteral = JSON.stringify("Template." + tplName);
  var res = "";

  for(key in events) {
     res += "\nTemplate[" + nameLiteral + "].events({\n  '"+key+
       "': function(event) {\n    " + preCompiler(events[key]) + "\n  }\n});\n";
  }
  return res;
}

var findEvents = function(result) {
  if(!result)
    return null;
  if(result.events)
    return result.events;
  for(var i=0; i<result.length; i++) {
    if(typeof(result[i])=='object'&&result[i].events)
      return result[i].events;
  }
}

var eventGen = function(template, templateName, preCompiler) {
  var events = findEvents(template); 
    if(events)
      return templateEventsGen(events, templateName, preCompiler);
    return "";
}

// Generate helper functions using function name - function body map
//   in the input.
var templateHelpersGen = function (helpers, tplName, preCompiler) {
  var nameLiteral = JSON.stringify(tplName);
  var templateDotNameLiteral = JSON.stringify("Template." + tplName);
  var res = "";

  for(key in helpers) {
    res += "\nTemplate[" + nameLiteral + "].helpers({\n  "+key+
       ": function() {\n    " + preCompiler("return ("+helpers[key]+");") + "\n  }\n});\n";
  }
  console.log(res);
  return res;
};

var findHelpers = function(result) {
  if(!result)
    return null;
  if(result.helpers)
    return result.helpers;
  for(var i=0; i<result.length; i++) {
    if(typeof(result[i])=='object'&&result[i].helpers)
      return result[i].helpers;
  }
}

var helperGen = function(template, templateName, preCompiler) {
  var helpers = findHelpers(template); 
    if(helpers)
      return templateHelpersGen(helpers, templateName, preCompiler);
    return "";
}


// XXX Handle body attributes
var bodyGen = function (tpl, attrs, preCompiler) {
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
  res += eventGen(tpl, "body", preCompiler);
  res += helperGen(tpl, "body", preCompiler);
 return res;
};


var templateGen = function (tree, tplName, preCompiler) {
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
  res += eventGen(tree, tplName, preCompiler);
  res += helperGen(tree, tplName, preCompiler);

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



var fileModeHandler = function (compileStep, preCompiler) {
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
    jsContent += bodyGen(results.body, results.bodyAttrs, preCompiler);
  }
  if (! _.isEmpty(results.templates)) {
    jsContent += _.map(results.templates, function(template, templateName) {
      return templateGen(template, templateName, preCompiler)}).join("");
  }


  //console.log("result: ", JSON.stringify(result, null, 2), ", template output: ", jsContent)

  if (jsContent !== "") {
    compileStep.addJavaScript({
      path: compileStep.inputPath + '.js',
      sourcePath: compileStep.inputPath,
      data: jsContent
    });
  }
};

var templateModeHandler = function (compileStep, preCompiler, ext) {
  var result = getCompilerResult(compileStep, false);
  var templateName = path.basename(compileStep.inputPath, '.'+ext);
  var jsContent;

  if (templateName === "head") {
    compileStep.appendDocument({
      section: "head",
      data: HTML.toHTML(result)
    });

  } else {

    if (templateName === "body") {
      jsContent = bodyGen(result, preCompiler);
    }
    else {
      jsContent = templateGen(result, templateName, preCompiler);
    }

    // console.log("result: ", JSON.stringify(result, null, 2), ", template output: ", jsContent)
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

Plugin.registerSourceHandler("jade", pluginOptions, function(cs) {
  return fileModeHandler(cs, jsPrecompiler)});
Plugin.registerSourceHandler("tpl.jade", pluginOptions, function(cs) {
  return templateModeHandler(cs, jsPrecompiler, "tpl.jade")});
Plugin.registerSourceHandler("coffee.jade", pluginOptions, function(cs) {
  return fileModeHandler(cs, coffeePrecompiler)});
Plugin.registerSourceHandler("coffee.tpl.jade", pluginOptions, function(cs) {
  return templateModeHandler(cs, coffeePrecompiler, "coffee.tpl.jade")});
Plugin.registerSourceHandler("tpl.coffee.jade", pluginOptions, function(cs) {
  return templateModeHandler(cs, coffeePrecompiler, "tpl.coffee.jade")});

