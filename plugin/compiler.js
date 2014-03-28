// This compiler is based on the meteor core Spacebars compiler. The main goal
// of this object is to transform the jade syntax-tree to a spacebars
// syntax-tree.
//
// XXX Source-mapping: Jade give us the line number, so we could implement a
// simple line-mapping but it's not yet supported by the spacebars compiler.

Compiler = function(tree, filename) {
  var self = this;
  self.tree = tree;
  self.filename = filename;
  self.head = null;
  self.body = null;
  self.templates = {};
}

_.extend(Compiler.prototype, {

  compile: function () {
    var self = this;
    self.visitBlock(self.tree, 0);
    return {
      head: self.head,
      body: self.body,
      templates: self.templates
    }
  },

  visitBlock: function (block, level) {
    if (_.isUndefined(block) || _.isNull(block) || ! _.has(block, 'nodes'))
      return null;

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
          }
        }
      }

      buffer.push(self.visitNode(currentNode, elseNode, level + 1));
    }

    return buffer;
  },

  visitNode: function(node, elseNode, level) {
    var self = this;
    var attrs = self.visitAttributes(node.attrs);
    var content = (node.code) ? self.visitCode(node.code) :
                                             self.visitBlock(node.block, level);
    var elseContent = self.visitBlock(elseNode && elseNode.block, level);

    if (level === 1)
      return self.registerRootNode(node, content);
    else
      return self['visit' + node.type](node, attrs, content, elseContent);
  },

  visitCode: function(code) {
    // XXX Need to improve this for "anonymous helpers"
    return [ HTMLTools.Special(this.lookup(code.val, code.escape)) ];
  },

  // We interpret "Mixins" as "Components"
  // Thanks to our customize Lexer, `if`, `unless`, `with` and `each` are
  // retrieved as Mixins by the parser
  visitMixin: function(node, attrs, content, elseContent) {
    var self = this;
    var componentName = node.name;

    if (componentName === "else")
      self.throwError("Unexpected else block", node);

    var spacebarsSymbol = content === null ? ">" : "#";
    var args = node.args || "";
    var mustache = "{{" + spacebarsSymbol + componentName + " " + args + "}}";
    var tag = Spacebars.TemplateTag.parse(mustache);

    if (content !== null)
      tag.content = content;

    if (elseContent !== null)
      tag.elseContent = elseContent;

    return HTMLTools.Special(tag);
  },

  visitTag: function(node, attrs, content) {
    var self = this;
    var tagName = node.name.toLowerCase();

    if (! HTML.isTagEnsured(tagName))
      self.throwError("Unknow tag: " + tagName, node);

    if (! _.isEmpty(attrs))
      content.unshift(attrs);

    return HTML[tagName.toUpperCase()].apply(null, content);
  },

  visitText: function(node) {
    var self = this;
    return node.val ? self.parseText(node.val) : null;
  },

  parseText: function(text) {
    // The parser doesn't parse the #{expression} syntax. Let's do it.
    // Since we rely on the Spacebars parser for this, we support the
    // {{mustache}} syntax as well.
    var self = this;
    var jadeExpression = /#\{\s*((\.{1,2}\/)*[\w\.-]+)\s*\}/g;
    text = text.replace(jadeExpression, "{{$1}}");
    return Spacebars.parse(text);
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
    var self = this;
    if (Filters[filter.name])
      return self.parseText(Filters[filter.name](content.join("\n")));
    else
      self.throwError("Unknowed filter " + filter.name, filter);
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

    _.each(attrs, function (attr) {
      var val = attr.val;
      var key = attr.name;

      // XXX We need a better handler for JavaScript code
      if (/^('|")/.test(val) && val.slice(-1) === val.slice(0, 1))
        // First case this is a string
        val = self.parseText(val.slice(1, -1));

      else if (val === true)
        // For cases like <input required> Spacebars compiler expect required
        // attriute to have the value `""` but Jade parser returns `true`
        val = "";
      else
        // Otherwise this is some code we need to evaluate
        val = HTMLTools.Special(self.lookup(val, attr.escaped));

      if (key === "$dyn")
        key = "$specials";

      // If a user has defined such kind of tag: div.myClass(class="myClass2")
      // we need to concatenate classes (and ids)
      if ((dict["class"] && key === "class") ||
          (dict["id"] && key === "id"))
        dict[key].push(" ", val)
      else if (dict["$specials"] && key === "$specials")
        dict[key].push(val)
      else
        dict[key] = [val];
    });

    return dict;
  },

  lookup: function (val, escape) {
    if (escape)
      spacebarsSymbol = "{{" + val + "}}";
    else
      spacebarsSymbol = "{{{" + val + "}}}";
    return Spacebars.TemplateTag.parse(spacebarsSymbol);
  },

  registerRootNode: function(node, result) {
    // XXX This is mostly the same code as the `templating` core package
    // The `templating` package should be more generic to allow others templates
    // engine to use its methods.

    var self = this;

    // Ignore top level comments
    if (node.type === "Comment" || node.type === "BlockComment" ||
        node.type === "TAG" && _.isUndefined(node.name)) {
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

      self[template] = result;
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

      self.templates[name] = result;
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
