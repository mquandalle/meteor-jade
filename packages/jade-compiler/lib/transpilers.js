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

var stringRepresentationToLiteral = function(val) {
  if (! _.isString(val))
    return null;

  var scanner = new HTMLTools.Scanner(val);
  var parsed = BlazeTools.parseStringLiteral(scanner);
  return parsed ? parsed.value : null;
};

// XXX Obiously we shouldn't have a special case for the markdown component
var isSpecialMarkdownComponent = function(node) {
  return node.type === "Mixin" && node.name === "markdown";
};

var isTextOnlyNode = function(node) {
  // XXX Is this list defined somewhere in spacebars-compiler?
  var textOnlyTags = ['textarea', 'script', 'style'];
  return node.textOnly &&
         node.type === "Tag" &&
         textOnlyTags.indexOf(node.name) !== -1;
};

// Helper function to generation an error from a message and a node
var throwError = function (message, node) {
  message = message || "Syntax error";
  if (node.line)
    message += " on line " + node.line;

  throw new Error(message);
};

// Recursively search for anonymous helper functions and
// record them
// Arguments:
// value: the tree created by the transpiler.
// found: a map from helper function names to
//    their function body.
function searchNewArgs(value, found, foundEvents) {
  if(value==null) {
    return;
  }
  if(Array.isArray(value)) {
    for(var i=0; i<value.length; i++) {
      searchNewArgs(value[i], found, foundEvents)
    }

  }

  if(value.newArgs) {
      found[value.newArgs]=value.origArgs
  }
  if(value.helpers) {
    for(var key in value.helpers) {
      found[key]=value.helpers[key];
    }
  }
  if(value.events && !_.isEmpty(value.events)) {
    for(var key in value.events) {
      foundEvents[key+" ."+value.eventClass]=value.events[key];
    }
  }
  if(value.children) {
    searchNewArgs(value.children, found, foundEvents)
  }
  if(value.content) {
    searchNewArgs(value.content, found, foundEvents)
  }

  if(value.attrs) {
    for(var attr in value.attrs) {
      searchNewArgs(value.attrs[attr], found, foundEvents)
    }
  }
}

// Recursively search for anonymous helper functions and
// record them. The input is a tree and it returns
// a map from helper function names to
//    their function body.
var genHelpers = function(body) {
      found={};
      foundEvents={}
      searchNewArgs(body, found, foundEvents);
      return found;
}

var genEvents = function(body) {
      found={};
      foundEvents={}
      searchNewArgs(body, found, foundEvents);
      return foundEvents;
}


FileCompiler = function(tree, options) {
  var self = this;
  self.nodes = tree.nodes;
  self.filename = options && options.filename || "";
  self.head = null;
  self.body = null;
  self.bodyAttrs = {};
  self.templates = {};
};

_.extend(FileCompiler.prototype, {
  compile: function () {
    var self = this;
    for (var i = 0; i < self.nodes.length; i++)
      self.registerRootNode(self.nodes[i]);

    self.templatesHelpers=self.genTemplateHelpers(self.templates);
    self.bodyHelpers=genHelpers(self.body);

    r = {
      head: self.head,
      body: self.body,
      bodyAttrs: self.bodyAttrs,
      templates: self.templates,
    };
    // We actually wouldn't need bodyHelpers and templatesHelpers as
    // there is a helpers attribute written in the root of the body
    // and every template. Should we get rid of bodyHelpers and
    // templatesHelpers (which is currently used by the file handler)?
    if(!_.isEmpty(self.bodyHelpers))
      r.bodyHelpers=self.bodyHelpers;
    if(!_.isEmpty(self.templatesHelpers))
      r.templatesHelpers=self.templatesHelpers
    return r;
  },

  // Generate template helpers for every template.
  genTemplateHelpers: function(templates) {
    r={}
    for (var key in templates) {
      value=templates[key]
      // search for newArgs - origArgs
      found=genHelpers(value)
      for(f in found) { // check if found is empty
        r[key]=found
        break;
      }
    }
    return r;

  },

  registerRootNode: function(node) {
    // XXX This is mostly the same code as the `templating` core package
    // The `templating` package should be more generic to allow others templates
    // engine to use its methods.

    var self = this;

    // Ignore top level comments
    if (node.type === "Comment" || node.type === "BlockComment" ||
        node.type === "TAG" && _.isUndefined(node.name)) {
      return;
    }

    // Doctypes
    else if (node.type === "Doctype") {
      throwError("Meteor sets the doctype for you", node);
    }

    // There are two specials templates: head and body
    else if (node.name === "body" || node.name === "head") {
      var template = node.name;

      if (self[template] !== null)
        throwError(template + " is set twice", node);
      if (node.name === "head" && node.attrs.length > 0)
        throwError("Attributes on head are not supported", node);
      else if(node.name === "body" && node.attrs.length > 0)
        self.bodyAttrs = self.formatBodyAttrs(node.attrs);

      self[template] = new TemplateCompiler(node.block).compile();
    }

    // Templates
    else if (node.name === "template") {
      if (node.attrs.length !== 1 || node.attrs[0].name !== 'name')
        throwError('Templates must only have a "name" attribute', node);

      var name = node.attrs[0].val.slice(1, -1);

      if (name === "content")
        throwError('Template can\'t be named "content"', node);
      if (_.has(self.templates, name))
        throwError('Template "' + name + '" is set twice', node);

      self.templates[name] = new TemplateCompiler(node.block).compile();
    }

    // Otherwise this is an error, we do not allow tags, mixins, if, etc.
    // outside templates
    else
      throwError(node.type + ' must be in a template', node);
  },

  formatBodyAttrs: function(attrsList) {
    var attrsDict = {};
    _.each(attrsList, function(attr) {
      if (attr.escaped)
        attr.val = attr.val.slice(1, -1);
      attrsDict[attr.name] = attr.val;
    });
    return attrsDict;
  }
});

// Find #{ - } and !{ - } pairs and call back a function (fn) that
// returns the replacement value for them.
// Args:
//   text: input text
//   start: #{ or !{
//   fn: callback function
// Returns:
//   Replaced text
function replaceExpression(text, start, fn) {
  spos=text.indexOf(start);
  if(spos<0) {
    return text;
  }
  spos=spos+start.length;
  // find end
  end = spos;
  var i=0;
  while(i>=0 && end < text.length) {
    if(text[end]=='{')
      i=i+1;
    if(text[end]=='}')
      i=i-1;
    end=end+1;
  }
  if(i>=0) {
    throw new Error("not found } for text "+text)
  }
  r = text.substr(0, spos-start.length)+fn(text.substr(spos, end-spos-1))+
         replaceExpression(text.substr(end), start, fn);
  return r
}

// This is used for creating anonymous helper function name if
//   there is no line number available.
this.globalParsedCounter=0;

TemplateCompiler = function(tree, options) {
  var self = this;
  self.tree = tree;
  self.filename = options && options.filename || "";
};

_.extend(TemplateCompiler.prototype, {
  compile: function () {
    var self = this;
    r = self._optimize(self.visitBlock(self.tree));
    // We write helpers attribute at the root of the output parse tree
    //   without changing it when there is no anonymous helper needed.
    if(r) {
      helpers = genHelpers(r);
      events = genEvents(r);
      if(!_.isEmpty(helpers) || !_.isEmpty(events))
        if(Array.isArray(r)) {
          for(var i=0; i<r.length; i++) {
            if(typeof(r[i])=='object') {
              if(!_.isEmpty(helpers))
                r[i].helpers = helpers;
              if(!_.isEmpty(events))
                r[i].events = events;
              break;
            }
          }
        } else
          if(!_.isEmpty(helpers))
            r.helpers = helpers;
          if(!_.isEmpty(events))
            r.events = events;
    }
    return r;
  },

  visitBlock: function (block) {
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

      buffer.push(self.visitNode(currentNode, elseNode));
    }


    return buffer;
  },

  getRawText: function(block) {
    var self = this;
    var parts = _(block.nodes).pluck('val');
    parts = self._interposeEOL(parts);
    return parts.reduce(function(a, b) { return a + b; }, '');
  },

  visitNode: function(node, elseNode) {
    var self = this;
    var attrs = self.visitAttributes(node.attrs, node);

    // attrs may have created events with mt-...
    if(node.events) {
      if(attrs.class==null)
        attrs.class="";
      node.eventClass="_event_line"+node.line;
      attrs.class=attrs.class+" "+node.eventClass;
    }

    var content;

    if (node.code) {
      content = self.visitCode(node.code);
    } else if (isTextOnlyNode(node) || isSpecialMarkdownComponent(node)) {
      content = self.getRawText(node.block);
      if (isSpecialMarkdownComponent(node)) {
        content = self.parseText(content, {textMode: HTML.TEXTMODE.STRING});
      }
    } else {
      content = self.visitBlock(node.block);
    }

    var elseContent = self.visitBlock(elseNode && elseNode.block);

    return self['visit' + node.type](node, attrs, content, elseContent);
  },

  visitCode: function(code) {
    // XXX Need to improve this for "anonymous helpers"
    var val = code.val;
    // First case this is a string
    var strLiteral = stringRepresentationToLiteral(val);
    if (strLiteral !== null) {
      return noNewLinePrefix + strLiteral;
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
      throwError("Unexpected else block", node);

    var spacebarsSymbol = content.length === 0 ? ">" : "#";
    var args = node.args || "";
    // Create anonymous helper if needed
    var origArgs=null;

    if(node.name.match(/^if|else if|unless|each$/) && args.length > 0 && args.match(/[^_a-zA-Z0-9 .]/)) {
      origArgs=args
      args="_jade_line"+(node.block.line-1)  // No line number was generated
    }


    var mustache = "{{" + spacebarsSymbol + componentName + " " + args + "}}";
    var tag = self._spacebarsParse(mustache);
    if(origArgs) {
      tag.origArgs=origArgs
      tag.newArgs=args
    }

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
    } else if (tagName === "style") {
      content = self.parseText(content);
    }

    if (! _.isArray(content))
      content = content ? [content] : [];

    if (! _.isEmpty(attrs))
      content.unshift(attrs);

    var r = HTML.getTag(tagName).apply(null, content);
    if(node.events && !_.isEmpty(node.events)) {
      r.events=node.events;
      r.eventClass=node.eventClass;
    }
    return r;
  },

  visitText: function(node) {
    var self = this;
    return node.val ? self.parseText(node.val, null, node) : null;
  },

  parseText: function(text, options, node) {
    // The parser doesn't parse #{expression} and !{unescapedExpression}
    // syntaxes. So let's do it.
    // Since we rely on the Spacebars parser for this, we support the
    // {{mustache}} and {{{unescapedMustache}}} syntaxes as well.
    anonFuncs={}
    var helperIndex=0;
    // Generate a new name for each new anonymous helper function.
    var getHelperName=function() {
      var base;
      if(node==null) {
        base="complexParsed"+globalParsedCounter;
        globalParsedCounter++;
      } else {
        base="_jade_line"+node.line;
        if(helperIndex>0) {
          base=base+"_"+helperIndex;
        }
        helperIndex++;
      }
      return base;
    }
    // Search for #{
    text=replaceExpression(text, '#{', function(innerExpr) {
      if(innerExpr.match(/^\s*((\.{1,2}\/)*[\w\.-]+)\s*$/)) {
        return "{{"+innerExpr+"}}";
      }
      // complex expression
      var helperName=getHelperName();
      anonFuncs[helperName]=innerExpr;
      return "{{"+helperName+"}}"
    })
    text=replaceExpression(text, '!{', function(innerExpr) {
      if(innerExpr.match(/^\s*((\.{1,2}\/)*[\w\.-]+)\s*$/)) {
        return "{{{"+innerExpr+"}}}";
      }
      // complex expression
      var helperName=getHelperName();
      anonFuncs[helperName]=innerExpr;
      return "{{{"+helperName+"}}}"
    })
    text = text.replace(/#\{\s*((\.{1,2}\/)*[\w\.-]+)\s*\}/g, "{{$1}}");
    text = text.replace(/!\{\s*((\.{1,2}\/)*[\w\.-]+)\s*\}/g, "{{{$1}}}");

    options = options || {};
    options.getTemplateTag = SpacebarsCompiler.TemplateTag.parseCompleteTag;
    
    // Put helpers attribute anywhere in the output of parseFragement
    r = HTMLTools.parseFragment(text, options);
    if(!_.isEmpty(anonFuncs)) {
      if(Array.isArray(r)) {
        for(var j=0; j<r.length; j++) {
          if(typeof(r[j])=='object' && !_.isEmpty(anonFuncs)) {
            r[j].helpers=anonFuncs;
            break;
          }
        }
      } else {
        if(r && !_.isEmpty(anonFuncs))
          r.helpers=anonFuncs;
      }
    }
    return r;
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
    throwError("Jade filters are not supported in meteor-jade", filter);
  },

  visitWhen: function (node) {
    throwError("Case statements are not supported in meteor-jade", node);
  },

  visitAttributes: function (attrs, node) {
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
      // First case this is a string
      var strLiteral = stringRepresentationToLiteral(val);
      if (strLiteral) {
        val = self.parseText(strLiteral, { textMode: HTML.TEXTMODE.STRING });
        val.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE;
      }

      // For cases like <input required> Spacebars compiler expect the attribute
      // to have the value `""` but Jade parser returns `true`
      else if (val === true || val === "''" || val === '""') {
        val = "";

      // Otherwise this is some code we need to evaluate
      } else {
        val = self._spacebarsParse(self.lookup(val, attr.escaped));
        val.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE;
      }


      if(key.indexOf("mt-")==0) {
        // Create event
        if(node.events==null) {
          node.events={}
        }
        node.events[key.substr(3)]=val;
       }

      if (key === "$dyn") {
        val.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_START_TAG;
        return dynamicAttrs.push(val);
      }

      // If a user has defined such kind of tag: div.myClass(class="myClass2")
      // we need to concatenate classes (and ids)
      else if ((key === "class" || key === "id") && dict[key])
        val = [" ", val];

      dict[key] = concatAttributes(dict[key], val);
    });

    if (dynamicAttrs.length === 0) {
      return dict;
    } else {
      dynamicAttrs.unshift(dict);
      return HTML.Attrs.apply(null, dynamicAttrs);
    }
  },

  lookup: function (val, escape) {
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
  }
});
