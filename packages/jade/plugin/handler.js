const path = Npm.require('path');

Plugin.registerCompiler({
  extensions: ['jade', 'tpl.jade'],
  archMatching: 'web',
  isTemplate: true,
}, () => new JadeCompilerPlugin());

class JadeCompilerPlugin extends CachingHtmlCompiler {
  constructor() {
    super('jade');
  }

  compileOneFile(inputFile) {
    const mode = this._getMode(inputFile);

    try {
      const compileResult = this._getCompilerResult(mode, inputFile);
      return this[`_${mode}ModeHandler`](inputFile, compileResult);
    } catch (err) {
      inputFile.error({
        message: "Jade syntax error: " + err.message
      });
    }
  }

  getCacheKey(inputFile) {
    return [ inputFile.getSourceHash() ];
  }

  _getMode(file) {
    const ext = file.getExtension();
    return (ext === 'jade') ? 'file' : 'template';
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

  _getCompilerResult(mode, file) {
    try {
      return JadeCompiler.parse(file.getContentsAsString(), {
        filename: file.getPathInPackage(),
        fileMode: mode === 'file'
      });
    } catch (err) {
      return file.error({
        message: "Jade syntax error: " + err.message,
        sourcePath: file.getPathInPackage()
      });
    }
  }

  _fileModeHandler(file, results) {
    let head = '', body = '', js = '', bodyAttrs = {};

    if (results.head !== null) {
      head = HTML.toHTML(results.head);
    }

    if (results.body !== null) {
      js += this._bodyGen(results.body, results.bodyAttrs);
    }
    if (! _.isEmpty(results.templates)) {
      js += _.map(results.templates, this._templateGen).join("");
    }

    return { head, body, js, bodyAttrs };
  }

  _templateModeHandler(file, result) {
    let head = '', body = '', js = '', bodyAttrs = {};

    const templateName = path.basename(file.getPathInPackage(), '.tpl.jade');

    if (templateName === "head") {
      head = HTML.toHTML(result);
    } else if (templateName === "body") {
      js = this._bodyGen(result);
    } else {
      js = this._templateGen(result, templateName);
    }

    return { head, body, js, bodyAttrs };
  }
}
