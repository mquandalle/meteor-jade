// Integration tests, template are defined in the tests/tests.jade file and
// instanciated with the following function:

var instanciate = function (tplName) {
  var component = UI.render(Template[tplName]);
  // XXX `document.body` isn't a good host for that purpose
  // I don't really want to add the template in the DOM
  UI.DomRange.insert(component.dom, document.body);
  return component.templateInstance;
};


Tinytest.add('Jade - HTML tags', function (test) {
  var tpl = instanciate("htmlTags");
  test.isNotNull(tpl.find('h1'));
  test.isNotNull(tpl.find('h2.myClass'));
  test.isNotNull(tpl.find('h3#myId'));
  test.isNotNull(tpl.find('h4.myClass#myId'));
  test.isNotNull(tpl.find('form > input'));
  test.isNotNull(tpl.find('header > div'));
  // XXX Inline tgs using the #tag[] syntax doesn't work yer
  // XXX Modify the jade parser?
  // test.isNotNull(tpl.find('p > strong'));
  // test.isNotNull(tpl.find('div > span > span'));
});

Tinytest.add('Jade - Unwrapped Text', function (test) {
  var tpl = instanciate("unwrappedText");
  // XXX I don't know why but tpl.firstNode is null
  // test.equal(tpl.firstNode.innerText, "Unwrapped text");
  test.equal(tpl.find("h1").innerText, "Hello world");
});


Tinytest.add('Jade - HTML attributes', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - else if', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - Expressions', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - Components inclusion', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - Components arguments', function (test) {
  // XXX TBD
});

Tinytest.add('Jade - Filters: markdown', function (test) {
  // XXX TBD
});
