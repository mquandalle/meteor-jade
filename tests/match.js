var removeLineComment = function (code) {
  var lineBreak = "\n";
  return _.map(code.split(lineBreak), function (line) {
    return line.replace(/(.+?)\s*\/\/ [0-9]+/, "$1");
  }).join(lineBreak);
};

var tpl2txt = function(tpl) {
  return tpl.render && removeLineComment(tpl.render.toString());
};

Tinytest.add('Jade - Compiled template match Spacebars', function (test) {
  _.each(Template, function(jadeTpl, tplName) {
    if (! tplName.match(/^match-jade/))
      return;

    var testName = tplName.split('-')[2];
    var htmlTplName = ["match", "html", testName].join("-");

    if (_.has(Template, htmlTplName))
      test.equal(tpl2txt(jadeTpl), tpl2txt(Template[htmlTplName]));
    else
      test.fail("Missing template: " + htmlTplName);
  });
});
