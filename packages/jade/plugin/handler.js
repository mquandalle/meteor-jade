var path = Npm.require('path');
var LRU = Npm.require('lru-cache');

var CACHE_SIZE = process.env.METEOR_JADE_CACHE_SIZE || 1024*1024*10;

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

var fileModeHandler = function (inputFile) {
  var ret = {};

  var contents = inputFile.getContentsAsString();
  var filepath = inputFile.getPathInPackage();

  var results = JadeCompiler.parse(contents, {
    filename: filepath,
    fileMode: true
  });

  // Head
  if (results.head !== null) {
    ret.head = HTML.toHTML(results.head);
  }

  var jsContent = "";
  if (results.body !== null) {
    jsContent += bodyGen(results.body, results.bodyAttrs);
  }
  if (! _.isEmpty(results.templates)) {
    jsContent += _.map(results.templates, templateGen).join("");
  }

  if (jsContent !== "") {
    ret.js = jsContent;
  }

  return ret;
};

var templateModeHandler = function (inputFile) {
  var ret = {};
  var contents = inputFile.getContentsAsString();
  var filepath = inputFile.getPathInPackage();

  var result = JadeCompiler.parse(contents, {
    filename: filepath,
    fileMode: false
  });

  var templateName = path.basename(filepath, '.tpl.jade');
  var jsContent;

  if (templateName === "head") {
    ret.head = HTML.toHTML(result);
  } else {
    if (templateName === "body")
      jsContent = bodyGen(result);
    else
      jsContent = templateGen(result, templateName);

    ret.js =jsContent;
  }

  return ret;
};

Plugin.registerCompiler({
  extensions: ['jade', 'tpl.jade'],
  archMatching: 'web',
  isTemplate: true
}, function () {
  return new JadeCompilerPlugin();
});

function JadeCompilerPlugin () {
  function length (x) { return x ? x.length : 0; }
  this._cache = new LRU({
    max: CACHE_SIZE,
    length: function (value) {
      return length(value.head) + length(value.body) + length(value.js);
    }
  });
}

JadeCompilerPlugin.prototype.processFilesForTarget = function (files) {
  var self = this;

  files.forEach(function (file) {
    var ext = file.getExtension();
    var content = file.getContentsAsString();
    var hash = file.getSourceHash();
    var filepath = file.getPathInPackage();

    var cacheKey = JSON.stringify([file.getPackageName || '__app__', filepath]);
    
    var ret = self._cache.get(cacheKey);

    if (! ret || ret.hash !== hash) {
      try {
        ret = (ext === 'jade') ?
              fileModeHandler(file) :
              templateModeHandler(file);

        ret.hash = hash;
        ret.filepath = filepath;

        self._cache.set(cacheKey, ret);
      } catch (err) {
        file.error({
          message: "Jade syntax error: " + err.message
        });
      }
    }

    if (ret.head) {
      file.addHtml({
        section: 'head',
        data: ret.head
      });
    }

    if (ret.js) {
      file.addJavaScript({
        path: ret.filepath + '.js',
        data: ret.js
      });
    }
  });
};
