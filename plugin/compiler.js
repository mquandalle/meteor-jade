// This compiler is based on the meteor core Spacebars compiler. The main goal
// of this object is to transform the jade syntax-tree to a spacebars
// syntax-tree.
//
// XXX Source-mapping: Jade give us the line number, so we could implement a
// simple line-mapping but it's not yet supported by the spacebars compiler.

// Internal identifier to indicate that we should not insert a new line
// character before a value. This has the side effect that a user cannot start
// a new line starting with this value in one of its templates.
var noNewLinePrefix = "__noNewLine__";
var startsWithNoNewLinePrefix = new RegExp("^" + noNewLinePrefix);

// XXX We really need something better to handle inline JavaScript expressions
var isStringRepresentation = function(val) {
  return /^('|")/.test(val) && val.slice(-1) === val.slice(0, 1);
};

// XXX Obiously we shouldn't have a special case for the markdown component
var isSpecialMarkdownComponent = function(node) {
  return node.type === "Mixin" && node.name === "markdown";
};

Compiler = function(tree, filename) {
  var self = this;
  self.tree = tree;
  self.filename = filename;
  self.head = null;
  self.body = null;
  self.templates = {};
};

_.extend(Compiler.prototype, {

  compile: function () {
    var self = this;
    self.visitBlock(self.tree, 0);
    return {
      head: self.head,
      body: self.body,
      templates: self.templates
    };
  },

  visitBlock: function (block, level) {
    if (_.isUndefined(block) || _.isNull(block) || ! _.has(block, 'nodes'))
      return [];

    var self = this;
    var buffer = [];
    var nodes = block.nodes;
    var currentNode, elseNode, stack;

    for (var i = 0; i < nodes.length; i++) {
      currentNode = nodes[i];

      // If the node is a Mixin (ie Component), we check if there are some
      // `else if` and `else` blocks after it and if so, we groups thoses
      // nodes by two with the following transformation:
      // if a               if a
      // else if b          else
      // else          =>     if b
      //                      else

      if (currentNode.type === "Mixin") {
        // Create the stack [nodeIf, nodeElseIf..., nodeElse]
        stack = [];
        while (currentNode.name === "if" && nodes[i+1] &&
          nodes[i+1].type === "Mixin" && nodes[i+1].name === "else if")
            stack.push(nodes[++i]);

        if (nodes[i+1] && nodes[i+1].type === "Mixin" &&
          nodes[i+1].name === "else")
            stack.push(nodes[++i]);

        // Transform the stack
        elseNode = stack.shift();
        if (elseNode && elseNode.name === "else if") {
          elseNode.name = "if";
          elseNode = {
            name: "else",
            type: "Mixin",
            block: { nodes: [elseNode].concat(stack) },
            call: false
          };
        }
      }

      buffer.push(self.visitNode(currentNode, elseNode, level + 1));
    }

    return buffer;
  },

  visitTextOnlyBlock: function(block) {
    var self = this;
    var parts = _(block.nodes).pluck('val');
    parts = self._interposeEOL(parts);
    return parts.reduce(function(a, b) { return a + b}, '');
  },

  visitNode: function(node, elseNode, level) {
    var self = this;
    var attrs = self.visitAttributes(node.attrs);
    var content;
    if (node.code) {
      content = self.visitCode(node.code);
    } else if (node.textOnly || isSpecialMarkdownComponent(node)) {
      content = self.visitTextOnlyBlock(node.block);
      if (isSpecialMarkdownComponent(node)) {
        content = self.parseText(content, {textMode: HTML.TEXTMODE.STRING});
      }
    } else {
      content = self.visitBlock(node.block, level);
    }

    var elseContent = self.visitBlock(elseNode && elseNode.block, level);

    if (level === 1)
      return self.registerRootNode(node, content);
    else
      return self['visit' + node.type](node, attrs, content, elseContent);
  },

  visitCode: function(code) {
    // XXX Need to improve this for "anonymous helpers"
    var val = code.val;
    if (isStringRepresentation(val)) {
      // First case this is a string
      return noNewLinePrefix + val.slice(1, -1);
    } else {
      return [ this._spacebarsParse(this.lookup(code.val, code.escape)) ];
    }
  },

  // We interpret "Mixins" as "Components"
  // Thanks to our customize Lexer, `if`, `unless`, `with` and `each` are
  // retrieved as Mixins by the parser
  visitMixin: function(node, attrs, content, elseContent) {
    var self = this;
    var componentName = node.name;

    if (componentName === "else")
      self.throwError("Unexpected else block", node);

    var spacebarsSymbol = content.length === 0 ? ">" : "#";
    // replace "(", ")", "," and get flat spacebar's lookup expression
    var args = (node.args || "").replace(/\(|\)|\,/, " ");
    var mustache = "{{" + spacebarsSymbol + componentName + " " + args + "}}";
    var tag = self._spacebarsParse(mustache);

    // Optimize arrays
    content = self._optimize(content);
    elseContent = self._optimize(elseContent);
    if (content)
      tag.content = content;
    if (elseContent)
      tag.elseContent = elseContent;

    return tag;
  },

  visitTag: function(node, attrs, content) {
    var self = this;
    var tagName = node.name.toLowerCase();

    content = self._optimize(content, true);

    if (tagName === "textarea") {
      attrs.value = content;
      content = null;
    }

    if (! _.isArray(content))
      content = content ? [content] : [];

    if (! _.isEmpty(attrs))
      content.unshift(attrs);

    return HTML.getTag(tagName).apply(null, content);
  },

  visitText: function(node) {
    var self = this;
    return node.val ? self.parseText(node.val) : null;
  },

  parseText: function(text, options) {
    // The parser doesn't parse #{expression} and !{unescapedExpression}
    // syntaxes. So let's do it.
    // Since we rely on the Spacebars parser for this, we support the
    // {{mustache}} and {{{unescapedMustache}}} syntaxes as well.
    text = text.replace(/#\{\s*((\.{1,2}\/)*[\w\.-]+)\s*\}/g, "{{$1}}");
    text = text.replace(/!\{\s*((\.{1,2}\/)*[\w\.-]+)\s*\}/g, "{{{$1}}}");

    options = options || {};
    options.getTemplateTag = SpacebarsCompiler.TemplateTag.parseCompleteTag;

    return HTMLTools.parseFragment(text, options);
  },

  visitComment: function (comment) {
    // If buffer boolean is true we want to display this comment in the DOM
    if (comment.buffer)
      return HTML.Comment(comment.val);
  },

  visitBlockComment: function (comment) {
    var self = this;
    comment.val = "\n" + _.pluck(comment.block.nodes, "val").join("\n") + "\n";
    return self.visitComment(comment);
  },

  visitFilter: function (filter, attrs, content) {
    this.throwError("Jade filters are not supported in meteor-jade", filter);
  },

  visitWhen: function (node) {
    this.throwError("Case statements are not supported in meteor-jade", node);
  },

  visitAttributes: function (attrs) {
    // The jade parser provide an attribute tree of this type:
    // [{name: "class", val: "val1", escaped: true}, {name: "id" val: "val2"}]
    // Let's transform that into:
    // {"class": "val1", id: "val2"}
    // Moreover if an "id" or "class" attribute is used more than once we need
    // to concatenate the values.
    if (_.isUndefined(attrs))
      return;

    if (_.isString(attrs))
      return attrs;

    var self = this;
    var dict = {};

    var concatAttributes = function(a, b) {
      if (_.isString(a) && _.isString(b))
        return a + b;
      if (_.isUndefined(a))
        return b;

      if (! _.isArray(a)) a = [a];
      if (! _.isArray(b)) b = [b];
      return a.concat(b);
    };
    var dynamicAttrs = [];

    _.each(attrs, function (attr) {
      var val = attr.val;
      var key = attr.name;

      // XXX We need a better handler for JavaScript code
      if (isStringRepresentation(val) && val.length > 2) {
        // First case this is a string
        val = self.parseText(val.slice(1, -1));

        if (val.type === "DOUBLE") {
          val.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_START_TAG;
        }
      }

      else if (val === true || val === "''" || val === '""') {
        // For cases like <input required> Spacebars compiler expect required
        // attriute to have the value `""` but Jade parser returns `true`
        val = "";

      } else {
        // Otherwise this is some code we need to evaluate
        val = self._spacebarsParse(self.lookup(val, attr.escaped));
        val.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_START_TAG;
      }

      if (key === "$dyn")
        return dynamicAttrs.push(val);

      // If a user has defined such kind of tag: div.myClass(class="myClass2")
      // we need to concatenate classes (and ids)
      else if ((key === "class" || key === "id") && dict[key])
        val = [" ", val];

      dict[key] = concatAttributes(dict[key], val);
    });

    if (dynamicAttrs.length === 0)
      return dict;
    else {
      dynamicAttrs.unshift(dict);
      return HTML.Attrs.apply(null, dynamicAttrs);
    }

    return dict;
  },

  lookup: function (val, escape) {
    // replace "(", ")", "," and get flat spacebar's lookup expression
    var _val = val.replace(/\(|\)|\,/g, " ");
    var mustache = "{{" + val + "}}";
    if (! escape)
      mustache = "{" + mustache + "}";
    return HTMLTools.parseFragment(mustache);
  },

  _spacebarsParse: SpacebarsCompiler.TemplateTag.parse,

  _removeNewLinePrefixes: function(array) {
    var removeNewLinePrefix = function(val) {
      if (startsWithNoNewLinePrefix.test(val))
        return val.slice(noNewLinePrefix.length);
      else
        return val;
    };

    if (! _.isArray(array))
      return removeNewLinePrefix(array);
    else
      return _.map(array, removeNewLinePrefix);
  },

  _interposeEOL: function(array) {
    for (var i = array.length - 1; i > 0; i--) {
      if (! startsWithNoNewLinePrefix.test(array[i]))
        array.splice(i, 0, "\n");
    }
    return array;
  },

  _optimize: function(content, interposeEOL) {
    var self = this;

    if (! _.isArray(content))
      return self._removeNewLinePrefixes(content);

    if (content.length === 0)
      return undefined;
    if (content.length === 1)
      content = self._optimize(content[0]);
    else if (interposeEOL)
      content = self._interposeEOL(content);
    else
      content = content;

    return self._removeNewLinePrefixes(content);
  },

  registerRootNode: function(node, result) {
    // XXX This is mostly the same code as the `templating` core package
    // The `templating` package should be more generic to allow others templates
    // engine to use its methods.

    var self = this;

    // Don't use an array if there is only one node
    if (result.length === 1)
      result = result[0];

    // Ignore top level comments
    if (node.type === "Comment" || node.type === "BlockComment" ||
        node.type === "TAG" && _.isUndefined(node.name)) {
      return;
    }

    // Doctypes
    else if (node.type === "Doctype") {
      self.throwError("Meteor sets the doctype for you", node);
    }

    // There are two specials templates: head and body
    else if (node.name === "body" || node.name === "head") {
      var template = node.name;

      if (self[template] !== null)
        self.throwError(template + " is set twice", node);
      if (node.attrs.length !== 0)
        self.throwError("Attributes on " + template + " not supported", node);

      self[template] = self._optimize(result);
    }

    // Templates
    else if (node.name === "template") {
      if (node.attrs.length !== 1 || node.attrs[0].name !== 'name')
        self.throwError('Templates must only have a "name" attribute', node);

      var name = self.visitAttributes(node.attrs).name;

      if (name === "content")
        self.throwError('Template can\'t be named "content"', node);
      if (_.has(self.templates, name))
        self.throwError('Template "' + name + '" is set twice', node);

      self.templates[name] = self._optimize(result);
    }

    // Otherwise this is an error, we do not allow tags, mixins, if, etc.
    // outside templates
    else
      self.throwError(node.type + ' must be in a template', node);
  },

  throwError: function (message, node) {
    message = message || "Syntax error";
    if (node.line)
      message += " on line " + node.line;

    throw new Error(message);
  }
});
