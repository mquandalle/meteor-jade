var tests = {
  'htmlarg': "it should interpolate expressions inside html arguments",
  'inclusionwithargs': "it should include the template with arguments"
};

Tinytest.add('Jade - Compiled template match Spacebars', function (test) {
  _.each(tests, function(desc, name) {
    var jadeTpl = Template[["match", "jade", name].join("-")];
    var htmlTpl = Template[["match", "html", name].join("-")];
    test.equal(jadeTpl.render.toString(), htmlTpl.render.toString(), desc);
  });
});
