// XXX Maybe we should define each filter in a separate package so a user who
// doesn't want to use the markdown compilation feature doesn't need to download
// the NPM package

var markdownToHTML = Npm.require("markdown").markdown.toHTML;

Filters = {
  markdown: function (content) {
    console.warn("jade: markdown server-side filter is deprecated");
    return markdownToHTML(content);
  }
};
