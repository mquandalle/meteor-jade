const path = Npm.require('path');

Plugin.registerCompiler({
  extensions: ['jade', 'tpl.jade'],
  archMatching: 'web',
  isTemplate: true,
}, () => new JadeCompilerPlugin());

class JadeCompilerPlugin extends CachingCompiler {
  constructor() {
    super({
      compilerName: 'jade',
      defaultCacheSize: 1024*1024*10,
    });
  }

  compileOneFile(file) {
    const ext = file.getExtension();

    try {
      const handlerMode = (ext === 'jade') ? 'file' : 'template';
      this[`_${handlerMode}ModeHandler`](file);
    } catch (err) {
      file.error({
        message: "Jade syntax error: " + err.message
      });
    }
  }

  getCacheKey(inputFile) {
    return [ inputFile.getSourceHash() ];
  }

  // XXX Handle body attributes
  _bodyGen(tpl, attrs) {
    const renderFunction = SpacebarsCompiler.codeGen(tpl, {
      isBody: true,
      sourceName: "<body>"
    });

    return `
      Meteor.startup(function() { $('body').attr(${JSON.stringify(attrs)}); });
      Template.body.addContent(${renderFunction});
      Meteor.startup(Template.body.renderToDocument);
    `;
  }

  _templateGen(tree, tplName) {
    const nameLiteral = JSON.stringify(tplName);
    const templateDotNameLiteral = JSON.stringify(`Template.${tplName}`);
    const renderFunction = SpacebarsCompiler.codeGen(tree, {
      isTemplate: true,
      sourceName: `Template "${tplName}"`
    });

    return `
      Template.__checkName(${nameLiteral});
      Template[${nameLiteral}] =
        new Template(${templateDotNameLiteral}, ${renderFunction});
    `;
  }

  _getCompilerResult(file, fileMode) {
    try {
      return JadeCompiler.parse(file.getContentsAsString(), {
        filename: file.getPathInPackage(),
        fileMode: fileMode
      });
    } catch (err) {
      return file.error({
        message: "Jade syntax error: " + err.message,
        sourcePath: file.getPathInPackage()
      });
    }
  }

  _fileModeHandler(file) {
    const results = this._getCompilerResult(file, true);

    // Head
    if (results.head !== null) {
      file.addHtml({
        section: "head",
        data: HTML.toHTML(results.head)
      });
    }

    let jsContent = "";
    if (results.body !== null) {
      jsContent += this._bodyGen(results.body, results.bodyAttrs);
    }
    if (! _.isEmpty(results.templates)) {
      jsContent += _.map(results.templates, this._templateGen).join("");
    }

    if (jsContent !== "") {
      file.addJavaScript({
        path: file.getPathInPackage() + '.js',
        sourcePath: file.getPathInPackage(),
        data: jsContent
      });
    }
  }

  _templateModeHandler(file) {
    const result = this._getCompilerResult(file, false);
    const templateName = path.basename(file.getPathInPackage(), '.tpl.jade');
    let jsContent;

    if (templateName === "head") {
      file.addHtml({
        section: "head",
        data: HTML.toHTML(result)
      });

    } else {
      if (templateName === "body") {
        jsContent = this._bodyGen(result);
      } else {
        jsContent = this._templateGen(result, templateName);
      }

      file.addJavaScript({
        path: file.getPathInPackage() + '.js',
        sourcePath: file.getPathInPackage(),
        data: jsContent
      });
    }
  }
}
